//! Persistence of the tracked project list in the app's config directory
//! (`~/Library/Application Support/com.ardasener.orbit/projects.json` or the OS
//! equivalent). The directory is identifier-based (Tauri's `app_config_dir`),
//! so dev and installed builds keep separate state.
//!
//! Entries are either plain path strings (legacy format) or structured objects
//! carrying the path plus favorite/display-name metadata; the untagged serde
//! enum loads both transparently with no migration step.

use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

/// A stored project: either a bare path string (legacy) or an object with
/// favorite/display-name metadata.
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(untagged)]
pub enum ProjectEntry {
    Path(String),
    Meta {
        path: String,
        #[serde(default)]
        favorite: bool,
        #[serde(default, rename = "displayName")]
        display_name: Option<String>,
    },
}

impl ProjectEntry {
    /// The project's absolute path.
    pub fn path(&self) -> &str {
        match self {
            ProjectEntry::Path(p) => p,
            ProjectEntry::Meta { path, .. } => path,
        }
    }

    pub fn favorite(&self) -> bool {
        match self {
            ProjectEntry::Path(_) => false,
            ProjectEntry::Meta { favorite, .. } => *favorite,
        }
    }

    pub fn display_name(&self) -> Option<&str> {
        match self {
            ProjectEntry::Path(_) => None,
            ProjectEntry::Meta { display_name, .. } => display_name.as_deref(),
        }
    }

    fn with_favorite(&self, favorite: bool) -> ProjectEntry {
        ProjectEntry::Meta {
            path: self.path().to_string(),
            favorite,
            display_name: self.display_name().map(str::to_string),
        }
    }

    fn with_display_name(&self, display_name: Option<String>) -> ProjectEntry {
        ProjectEntry::Meta {
            path: self.path().to_string(),
            favorite: self.favorite(),
            display_name,
        }
    }
}

/// The projects file lives in the given (identifier-based) config directory.
fn projects_file(config_dir: &Path) -> PathBuf {
    config_dir.join("projects.json")
}

/// Load the tracked projects. Missing or corrupt files degrade to an empty list.
pub fn load_projects(config_dir: &Path) -> Vec<ProjectEntry> {
    load_projects_file(&projects_file(config_dir))
}

fn load_projects_file(file: &Path) -> Vec<ProjectEntry> {
    let Ok(content) = fs::read_to_string(file) else {
        return Vec::new();
    };
    serde_json::from_str::<Vec<ProjectEntry>>(&content).unwrap_or_default()
}

fn save_projects(config_dir: &Path, projects: &[ProjectEntry]) -> Result<(), String> {
    fs::create_dir_all(config_dir).map_err(|e| e.to_string())?;
    let content = serde_json::to_string_pretty(projects).map_err(|e| e.to_string())?;
    fs::write(projects_file(config_dir), content).map_err(|e| e.to_string())
}

/// Validate that `path` is a directory and return its canonical form.
pub fn canonicalize(path: &str) -> Result<String, String> {
    let p = PathBuf::from(path);
    if !p.is_dir() {
        return Err(format!("not a directory: {path}"));
    }
    fs::canonicalize(&p)
        .map(|c| c.to_string_lossy().into_owned())
        .map_err(|e| e.to_string())
}

/// Add a project (deduplicated), persisting the canonical path.
pub fn add_project(config_dir: &Path, path: &str) -> Result<String, String> {
    let canonical = canonicalize(path)?;
    let mut projects = load_projects(config_dir);
    if !projects.iter().any(|p| p.path() == canonical) {
        projects.push(ProjectEntry::Path(canonical.clone()));
        save_projects(config_dir, &projects)?;
    }
    Ok(canonical)
}

/// Untrack a project. Its managed worktrees are left on disk.
pub fn remove_project(config_dir: &Path, path: &str) -> Result<(), String> {
    let canonical = canonical_or_raw(path);
    let mut projects = load_projects(config_dir);
    projects.retain(|p| !same_directory(p.path(), &canonical));
    save_projects(config_dir, &projects)
}

/// Set a project's favorite flag, persisting the updated entry.
pub fn set_favorite(config_dir: &Path, path: &str, favorite: bool) -> Result<(), String> {
    let canonical = canonical_or_raw(path);
    let mut projects = load_projects(config_dir);
    for entry in &mut projects {
        if same_directory(entry.path(), &canonical) {
            *entry = entry.with_favorite(favorite);
            return save_projects(config_dir, &projects);
        }
    }
    Err("project not found".to_string())
}

/// Set a project's display name (None/empty clears it), persisting the entry.
pub fn rename(config_dir: &Path, path: &str, display_name: &str) -> Result<(), String> {
    let canonical = canonical_or_raw(path);
    let display_name = display_name.trim();
    let display_name = if display_name.is_empty() {
        None
    } else {
        Some(display_name.to_string())
    };
    let mut projects = load_projects(config_dir);
    for entry in &mut projects {
        if same_directory(entry.path(), &canonical) {
            *entry = entry.with_display_name(display_name);
            return save_projects(config_dir, &projects);
        }
    }
    Err("project not found".to_string())
}

fn canonical_or_raw(path: &str) -> String {
    std::fs::canonicalize(path)
        .map(|canonical| canonical.to_string_lossy().into_owned())
        .unwrap_or_else(|_| path.to_string())
}

/// Whether a stored project path refers to the same directory as the input's
/// canonical form. Canonicalizing both sides handles symlinked parents (macOS
/// `/tmp` → `/private/tmp`); a stored dir that vanished falls back to the raw
/// comparison rather than failing the removal.
fn same_directory(stored: &str, canonical: &str) -> bool {
    if stored == canonical {
        return true;
    }
    let stored_canonical = std::fs::canonicalize(stored)
        .map(|c| c.to_string_lossy().into_owned())
        .unwrap_or_else(|_| stored.to_string());
    stored_canonical == canonical
}

#[cfg(test)]
mod tests {
    use super::*;

    /// A project stored under a symlinked parent (e.g. `/tmp` → `/private/tmp`
    /// on macOS) must still be removed when the input is the canonical form.
    #[test]
    fn same_directory_matches_symlinked_forms() {
        // /tmp is a symlink to /private/tmp on macOS; on other platforms it
        // may not be, so compare against whatever canonicalize produces.
        let input = "/tmp";
        let Ok(canonical) = canonicalize(input) else {
            return; // no /tmp here — nothing meaningful to assert
        };
        // stored as the non-canonical form, input as canonical (or vice versa)
        assert!(same_directory(input, &canonical));
        assert!(same_directory(&canonical, &canonical));
    }

    #[test]
    fn same_directory_rejects_different_dirs() {
        let a = canonicalize("/tmp").unwrap_or_else(|_| "/tmp".to_string());
        let b = canonicalize("/").unwrap_or_else(|_| "/".to_string());
        assert!(!same_directory(&a, &b));
    }

    #[test]
    fn missing_project_can_be_updated_and_removed() {
        let base =
            std::env::temp_dir().join(format!("orbit-missing-project-{}", std::process::id()));
        let config = base.join("config");
        let missing = base.join("offline");
        fs::create_dir_all(&config).unwrap();
        save_projects(
            &config,
            &[ProjectEntry::Path(missing.to_string_lossy().into_owned())],
        )
        .unwrap();

        set_favorite(&config, missing.to_string_lossy().as_ref(), true).unwrap();
        rename(&config, missing.to_string_lossy().as_ref(), "Offline").unwrap();
        assert_eq!(load_projects(&config)[0].display_name(), Some("Offline"));
        assert!(load_projects(&config)[0].favorite());

        remove_project(&config, missing.to_string_lossy().as_ref()).unwrap();
        assert!(load_projects(&config).is_empty());
        fs::remove_dir_all(base).unwrap();
    }

    /// A missing Orbit projects file starts empty and does not create config.
    #[test]
    fn missing_projects_file_loads_empty_without_creating_config() {
        let base = std::env::temp_dir().join(format!("orbit-test-{}", std::process::id()));
        let file = base.join("projects.json");
        assert!(load_projects_file(&file).is_empty());
        assert!(!file.exists());
        fs::remove_dir_all(&base).ok();
    }

    /// A legacy string-only file deserializes as plain entries.
    #[test]
    fn legacy_string_entries_load() {
        let entries: Vec<ProjectEntry> = serde_json::from_str(r#"["/a", "/b"]"#).unwrap();
        assert_eq!(entries.len(), 2);
        assert_eq!(entries[0].path(), "/a");
        assert!(!entries[0].favorite());
        assert_eq!(entries[0].display_name(), None);
    }

    /// Structured entries round-trip through serialization.
    #[test]
    fn structured_entries_round_trip() {
        let entries: Vec<ProjectEntry> =
            serde_json::from_str(r#"[{"path":"/a","favorite":true,"displayName":"Alpha"}]"#)
                .unwrap();
        assert!(entries[0].favorite());
        assert_eq!(entries[0].display_name(), Some("Alpha"));

        let json = serde_json::to_string(&entries).unwrap();
        let back: Vec<ProjectEntry> = serde_json::from_str(&json).unwrap();
        assert_eq!(back[0].path(), "/a");
        assert!(back[0].favorite());
        assert_eq!(back[0].display_name(), Some("Alpha"));
    }

    /// Missing metadata fields default to false/None.
    #[test]
    fn structured_entry_defaults() {
        let entries: Vec<ProjectEntry> = serde_json::from_str(r#"[{"path":"/a"}]"#).unwrap();
        assert!(!entries[0].favorite());
        assert_eq!(entries[0].display_name(), None);
    }

    /// with_favorite preserves the display name; with_display_name preserves
    /// the favorite flag.
    #[test]
    fn metadata_mutations_are_lossless() {
        let e: ProjectEntry =
            serde_json::from_str(r#"{"path":"/a","favorite":true,"displayName":"Alpha"}"#).unwrap();
        assert!(!e.with_favorite(false).favorite());
        assert_eq!(e.with_favorite(false).display_name(), Some("Alpha"));
        assert!(e.with_display_name(None).favorite());
        assert_eq!(e.with_display_name(None).display_name(), None);
    }

    /// set_favorite and rename persist through save/load.
    #[test]
    fn favorite_and_rename_persist() {
        let base = std::env::temp_dir().join(format!("orbit-meta-test-{}", std::process::id()));
        let _ = fs::remove_dir_all(&base);
        fs::create_dir_all(&base).unwrap();
        let dir = base.join("proj");
        fs::create_dir_all(&dir).unwrap();

        add_project(&base, dir.to_str().unwrap()).unwrap();
        set_favorite(&base, dir.to_str().unwrap(), true).unwrap();
        rename(&base, dir.to_str().unwrap(), "My Project").unwrap();

        let loaded = load_projects(&base);
        assert_eq!(loaded.len(), 1);
        assert!(loaded[0].favorite());
        assert_eq!(loaded[0].display_name(), Some("My Project"));

        // Clearing the display name reverts to None.
        rename(&base, dir.to_str().unwrap(), "  ").unwrap();
        assert_eq!(load_projects(&base)[0].display_name(), None);

        fs::remove_dir_all(&base).ok();
    }
}
