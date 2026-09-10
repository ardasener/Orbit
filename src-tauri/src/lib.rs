mod modules;

use modules::appearance::{self};
use modules::files::{self, FileWatcherState};
use modules::fonts;
use modules::pty::{self, PtyManager};
use modules::workspace::{self};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .manage(PtyManager::default())
        .manage(FileWatcherState::default())
        .invoke_handler(tauri::generate_handler![
            pty::pty_open,
            pty::pty_write,
            pty::pty_resize,
            pty::pty_close,
            pty::pty_foreground_process,
            pty::pty_shell_name,
            workspace::workspace_list,
            workspace::workspace_add_project,
            workspace::workspace_remove_project,
            workspace::workspace_set_project_favorite,
            workspace::workspace_rename_project,
            workspace::workspace_branch_exists,
            workspace::workspace_fork,
            workspace::workspace_worktree_is_dirty,
            workspace::workspace_remove_worktree,
            appearance::appearance_set_background,
            appearance::appearance_clear_background,
            files::files_list_directory,
            files::files_resolve_path,
            files::files_watch_start,
            files::files_watch_stop,
            fonts::font_list,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
