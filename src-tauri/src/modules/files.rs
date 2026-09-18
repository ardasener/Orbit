use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::Duration;

use notify_debouncer_full::notify::RecursiveMode;
use notify_debouncer_full::{new_debouncer, DebounceEventResult, Debouncer, RecommendedCache};
use serde::Serialize;
use tauri::{Emitter, State};

type FileWatcher = Debouncer<notify_debouncer_full::notify::RecommendedWatcher, RecommendedCache>;

#[derive(Default)]
pub struct FileWatcherState {
    state: Mutex<FileWatcherStateInner>,
}

#[derive(Default)]
struct FileWatcherStateInner {
    generation: u64,
    watcher: Option<FileWatcher>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileEntry {
    pub name: String,
    pub relative_path: String,
    pub is_directory: bool,
    pub is_symlink: bool,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FilePathInfo {
    pub absolute_path: String,
    pub relative_path: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct FilesChangedEvent {
    worktree: String,
    paths: Vec<String>,
    error: Option<String>,
}

fn canonical_root(worktree: &str) -> Result<PathBuf, String> {
    let root = fs::canonicalize(worktree).map_err(|e| format!("invalid worktree: {e}"))?;
    if !root.is_dir() {
        return Err("worktree is not a directory".to_string());
    }
    Ok(root)
}

fn resolve_path(root: &Path, relative_path: &str) -> Result<PathBuf, String> {
    let relative = Path::new(relative_path);
    if relative.is_absolute() {
        return Err("path must be worktree-relative".to_string());
    }
    let candidate = root.join(relative);
    let mut current = root.to_path_buf();
    for component in relative.components() {
        if let std::path::Component::Normal(part) = component {
            current.push(part);
            if fs::symlink_metadata(&current)
                .map_err(|e| format!("path not found: {e}"))?
                .file_type()
                .is_symlink()
            {
                return Err("symlink traversal is not allowed".to_string());
            }
        }
    }
    let resolved = fs::canonicalize(&candidate).map_err(|e| format!("path not found: {e}"))?;
    if !resolved.starts_with(root) {
        return Err("path is outside the worktree".to_string());
    }
    Ok(resolved)
}

fn relative_string(root: &Path, path: &Path) -> Result<String, String> {
    let relative = path
        .strip_prefix(root)
        .map_err(|_| "path is outside the worktree".to_string())?;
    Ok(relative
        .components()
        .filter_map(|component| match component {
            std::path::Component::Normal(value) => Some(value.to_string_lossy().into_owned()),
            _ => None,
        })
        .collect::<Vec<_>>()
        .join("/"))
}

#[tauri::command]
pub async fn files_list_directory(
    worktree: String,
    relative_path: String,
) -> Result<Vec<FileEntry>, String> {
    tauri::async_runtime::spawn_blocking(move || list_directory(&worktree, &relative_path))
        .await
        .map_err(|e| format!("directory listing task failed: {e}"))?
}

fn list_directory(worktree: &str, relative_path: &str) -> Result<Vec<FileEntry>, String> {
    let root = canonical_root(worktree)?;
    let directory = resolve_path(&root, relative_path)?;
    if !directory.is_dir() {
        return Err("path is not a directory".to_string());
    }

    let mut entries = fs::read_dir(&directory)
        .map_err(|e| format!("failed to read directory: {e}"))?
        .filter_map(Result::ok)
        .filter_map(|entry| {
            let path = entry.path();
            let metadata = fs::symlink_metadata(&path).ok()?;
            let is_symlink = metadata.file_type().is_symlink();
            let is_directory = !is_symlink && metadata.is_dir();
            let name = entry.file_name().to_string_lossy().into_owned();
            let relative_path = relative_string(&root, &path).ok()?;
            Some(FileEntry {
                name,
                relative_path,
                is_directory,
                is_symlink,
            })
        })
        .collect::<Vec<_>>();

    entries.sort_by_cached_key(|entry| {
        (
            !entry.is_directory,
            entry.name.to_lowercase(),
            entry.name.clone(),
        )
    });
    Ok(entries)
}

#[tauri::command]
pub fn files_resolve_path(worktree: String, relative_path: String) -> Result<FilePathInfo, String> {
    let root = canonical_root(&worktree)?;
    let path = resolve_path(&root, &relative_path)?;
    Ok(FilePathInfo {
        absolute_path: path.to_string_lossy().into_owned(),
        relative_path: relative_string(&root, &path)?,
    })
}

#[tauri::command]
pub async fn files_watch_start(
    app: tauri::AppHandle,
    state: State<'_, FileWatcherState>,
    worktree: String,
) -> Result<(), String> {
    let generation = {
        let mut current = state
            .state
            .lock()
            .map_err(|_| "file watcher state is unavailable".to_string())?;
        current.generation = current.generation.wrapping_add(1);
        current.watcher = None;
        current.generation
    };
    // Stop the previous watcher before doing the blocking setup. This keeps
    // setup asynchronous without allowing two watchers to remain active.
    let watcher = tauri::async_runtime::spawn_blocking(move || {
        let root = canonical_root(&worktree)?;
        create_watcher(app, root)
    })
    .await
    .map_err(|e| format!("file watcher task failed: {e}"))??;

    let mut current = state
        .state
        .lock()
        .map_err(|_| "file watcher state is unavailable".to_string())?;
    if current.generation == generation {
        current.watcher = Some(watcher);
    }
    Ok(())
}

fn create_watcher(app: tauri::AppHandle, root: PathBuf) -> Result<FileWatcher, String> {
    let root_for_callback = root.clone();
    let worktree_for_callback = root.to_string_lossy().into_owned();
    let app_for_callback = app.clone();
    let mut debouncer = new_debouncer(
        Duration::from_millis(250),
        None,
        move |result: DebounceEventResult| {
            let event = match result {
                Ok(events) => {
                    let mut paths = events
                        .into_iter()
                        .flat_map(|event| event.paths.clone())
                        .filter_map(|path| relative_string(&root_for_callback, &path).ok())
                        .collect::<Vec<_>>();
                    paths.sort();
                    paths.dedup();
                    FilesChangedEvent {
                        worktree: worktree_for_callback.clone(),
                        paths,
                        error: None,
                    }
                }
                Err(errors) => FilesChangedEvent {
                    worktree: worktree_for_callback.clone(),
                    paths: Vec::new(),
                    error: Some(
                        errors
                            .into_iter()
                            .map(|error| error.to_string())
                            .collect::<Vec<_>>()
                            .join("; "),
                    ),
                },
            };
            let _ = app_for_callback.emit("files-changed", event);
        },
    )
    .map_err(|e| format!("failed to create file watcher: {e}"))?;
    debouncer
        .watch(&root, RecursiveMode::Recursive)
        .map_err(|e| format!("failed to watch worktree: {e}"))?;

    Ok(debouncer)
}

#[tauri::command]
pub fn files_watch_stop(state: State<'_, FileWatcherState>) -> Result<(), String> {
    let mut current = state
        .state
        .lock()
        .map_err(|_| "file watcher state is unavailable".to_string())?;
    current.generation = current.generation.wrapping_add(1);
    current.watcher = None;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    fn temp_root() -> TempDir {
        tempfile::tempdir().unwrap()
    }

    #[test]
    fn lists_directories_first_and_includes_hidden_entries() {
        let root = temp_root();
        fs::create_dir(root.path().join("src")).unwrap();
        fs::write(root.path().join(".env"), "").unwrap();
        fs::write(root.path().join("README"), "").unwrap();
        fs::write(root.path().join("z.txt"), "").unwrap();
        let entries = list_directory(&root.path().to_string_lossy(), "").unwrap();
        assert_eq!(
            entries
                .iter()
                .map(|entry| entry.name.as_str())
                .collect::<Vec<_>>(),
            ["src", ".env", "README", "z.txt"]
        );
    }

    #[test]
    fn rejects_paths_outside_the_root() {
        let root = temp_root();
        assert!(resolve_path(root.path(), "../outside").is_err());
    }

    #[test]
    fn does_not_traverse_symlinked_directories() {
        let root = temp_root();
        let target = temp_root();
        fs::write(target.path().join("secret"), "").unwrap();
        #[cfg(unix)]
        std::os::unix::fs::symlink(target.path(), root.path().join("linked")).unwrap();
        #[cfg(unix)]
        {
            let entries = list_directory(&root.path().to_string_lossy(), "").unwrap();
            assert!(entries
                .iter()
                .any(|entry| entry.name == "linked" && entry.is_symlink && !entry.is_directory));
        }
    }
}
