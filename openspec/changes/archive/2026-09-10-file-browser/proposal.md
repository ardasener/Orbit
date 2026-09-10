## Why

Overlook needs a lightweight way to navigate project files without becoming an editor or file viewer. A worktree-rooted file tree with external view/edit actions provides path-oriented file management while preserving the terminal-first architecture and keeping file contents out of the webview.

## What Changes

- Add a Files mode beside the existing Workspaces mode in the left sidebar, selected with a visually distinct Ant Design radio-button group.
- Show the active worktree's files and directories in a lazy, initially collapsed tree.
- Include hidden files and `.git`; show symlinks without traversing them; sort directories before files and entries alphabetically.
- Add file context-menu actions for View, Edit, Copy absolute path, and Copy relative path.
- Make directory clicks expand/collapse and limit directory context menus to path-copy actions.
- Make file left-click behavior configurable, defaulting to Copy absolute path.
- Add configurable view and edit executable settings, defaulting to `view` and `vim` when unset.
- Launch view/edit programs as dedicated runnable terminal tabs in the focused pane, using the existing PTY/shell lifecycle; do not read or render file contents.
- Add a Rust-backed recursive filesystem watcher for the active worktree, including `.git`, with debounced batched change notifications.
- Refresh only expanded/visible affected directories after file events, preserving expansion and selection state.
- Add manual refresh and watcher-error handling.

## Capabilities

### New Capabilities

- `file-browser`: Worktree-rooted file navigation, file actions, external tool launching, and filesystem watching.

### Modified Capabilities

- `appearance-settings`: Add persisted file view/edit tool and default left-click action settings.

## Impact

The change affects the left-sidebar composition and styling, settings state and modal UI, Rust workspace/filesystem modules, Tauri command registration and event delivery, capabilities, and Cargo dependencies. The webview will only receive directory entries and change notifications; filesystem access remains owned by Rust, while view/edit commands reuse the existing terminal PTY boundary. No terminal or workspace project persistence format is changed.
