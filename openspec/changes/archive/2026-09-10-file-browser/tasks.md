## 1. Rust filesystem API and watcher

- [x] 1.1 Add the cross-platform filesystem watcher/debouncer dependency and create a Rust files module with typed directory-entry and change-event payloads.
- [x] 1.2 Implement validated active-worktree-relative directory listing with directories-first, case-insensitive sorting, hidden entries, symlink detection, and no symlink traversal.
- [x] 1.3 Implement Rust path resolution/validation for absolute and relative copies, rejecting traversal or paths outside the worktree.
- [x] 1.4 Implement safe shell quoting for validated file paths and a frontend/context action that creates view/edit commands as focused-pane runnable terminal tabs with `view`/`vim` fallbacks.
- [x] 1.5 Implement managed recursive watcher start/stop commands for the active worktree, including `.git`, debounced event batches, rename/remove handling, and watcher errors.
- [x] 1.6 Register files commands/events in `src-tauri/src/lib.rs`, update module wiring and required capabilities, and add Rust tests for listing, sorting, symlinks, path validation, and watcher lifecycle.

## 2. Settings and persistence

- [x] 2.1 Extend `Settings` with file viewer, editor, and default-click-action fields using repairable defaults.
- [x] 2.2 Update settings loading/persistence to accept existing stored settings and repair invalid file action values or blank tool values.
- [x] 2.3 Add a File tools section to the settings modal with executable inputs and the default file click-action selector.
- [x] 2.4 Add frontend tests for file-tool defaults, persistence shape, and invalid-action repair.

## 3. Sidebar file mode

- [x] 3.1 Add a controlled Ant Design `Radio.Group` mode selector for Workspaces and Files without changing terminal tab styling.
- [x] 3.2 Create a lazy `FileBrowser` component rooted at the active worktree, with initially collapsed entries, loading/error/empty states, refresh control, and preserved expansion/selection state.
- [x] 3.3 Implement directory expansion/collapse and file-entry sorting using Rust directory-list responses; include hidden entries and display symlinks without traversing them.
- [x] 3.4 Reset the file cache, expansion, selection, and watcher when the active worktree changes; handle the no-active-worktree state.
- [x] 3.5 Implement file and directory context menus, absolute/relative clipboard actions, default file left-click behavior, and directory expansion clicks.
- [x] 3.6 Implement View/Edit actions as focused-pane runnable terminal tabs, safely quote paths, and preserve normal runnable close-on-exit behavior without loading file contents into the webview.
- [x] 3.7 Add CSS for the sidebar mode selector and compact file-tree rows consistent with the existing workspace sidebar.

## 4. Live refresh integration

- [x] 4.1 Subscribe the FileBrowser to debounced Rust file-change events and coalesce refresh requests in the frontend.
- [x] 4.2 Refresh only loaded/expanded affected directories while preserving expansion and selected paths when entries remain.
- [x] 4.3 Add manual refresh behavior and watcher-error notification/fallback handling.
- [x] 4.4 Verify `.git` directory listing behavior and `.git` pointer-file behavior for linked worktrees.

## 5. Verification and canonical specs

- [x] 5.1 Add frontend unit tests for path-action selection, directory/file click behavior, entry sorting, lazy expansion, and change-to-directory invalidation.
- [x] 5.2 Add integration coverage for active-worktree switching, watcher start/stop, external tool fallback/error behavior, and settings actions where the existing test setup permits.
- [x] 5.3 Run `bun check-types`, `bun lint`, `bun run test`, `cd src-tauri && cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, and `cargo test`.
- [x] 5.4 Synchronize the completed file-browser and appearance-settings deltas into `openspec/specs/` before manual review.
