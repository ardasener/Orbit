## Context

The left sidebar currently renders the project/worktree tree through `WorkspaceSidebar`, while Rust owns all filesystem access and exposes workspace commands through Tauri IPC. The terminal layout is independent and remains unchanged by this feature. The file view should provide navigation and path actions without reading file contents into the webview or becoming an editor.

The watcher must support macOS, Linux, and Windows behavior through a Rust filesystem notification library. Tauri's shell plugin is not required: configurable tools are executable names/paths and are launched through the existing terminal PTY command path.

## Goals / Non-Goals

**Goals:**

- Add a Files mode beside Workspaces in the existing sidebar.
- Browse the active worktree as a lazy, initially collapsed tree, including hidden files and `.git`.
- Keep all filesystem enumeration, path validation, and watching in Rust; reuse the existing terminal PTY boundary for view/edit processes.
- Support view/edit/copy actions with persisted settings and a configurable file left-click action.
- Keep expanded directories and selected paths stable while refreshing affected nodes.
- Watch the active worktree recursively and emit debounced change batches.

**Non-Goals:**

- Reading, previewing, editing, or rendering file contents in Overlook.
- Creating, deleting, renaming, moving, or modifying files from the file browser.
- Shell command templates, argument parsing, or environment-variable fallback for tools.
- Git-aware filtering, ignore-file parsing, or special branch/ref UI.
- Filesystem watcher persistence across restarts.
- Following symlinks during tree expansion.

## Decisions

### Sidebar mode uses a radio-button group

The sidebar header will contain a controlled Ant Design `Radio.Group` with `optionType="button"`, `buttonStyle="solid"`, and small sizing for `Workspaces` and `Files`. This deliberately differs from terminal tabs and represents mutually exclusive sidebar modes rather than documents. The selected mode remains session-local.

### The active worktree is the file root

The Files mode lists the active worktree's immediate children as its top-level entries without an artificial root row. Switching worktrees clears the loaded directory cache, resets expansion and selection, and starts a watcher for the new root. When no worktree is active, the browser shows an empty explanatory state.

Directory contents are loaded on first expansion through a Rust `files_list_directory` command. Entries include name, relative path, kind, and symlink status. Directories sort before files, then entries sort case-insensitively by display name. Hidden entries, including `.git`, are included. Symlinks are displayed but never recursively traversed.

### File actions use validated Rust commands

The frontend sends a worktree root and relative path; Rust validates that the resolved path remains within the active root before listing or copying. Copy actions use the existing clipboard plugin from the frontend after receiving the validated absolute/relative path. View/edit actions use the validated absolute path to create a dedicated runnable terminal tab in the focused pane through the existing terminal layout API.

The configured tool values are executable names or paths only. Empty values resolve to `view` for viewing and `vim` for editing. The command is built as a safely shell-quoted executable plus `--` plus the safely shell-quoted absolute path, then executed through the existing interactive-shell runnable path. The resulting tab inherits normal PTY behavior, process-title polling, and close-on-exit semantics.

### Context menus and default click action

File rows expose View, Edit, Copy Abs. Path, and Copy Rel. Path from a right-click menu. Directory rows expose only the two copy actions. Clicking a directory toggles expansion. Clicking a file executes the persisted default action, whose choices are View, Edit, Copy absolute path, and Copy relative path; the default is Copy absolute path.

Relative paths are computed from the active worktree root using native path semantics and use the path string returned by Rust. The selected file path is retained when a refresh still finds it and cleared when it is removed.

### Watcher lifetime and event flow

Add a managed Rust watcher using `notify` with the full debouncer. `files_watch_start` stops and replaces the prior watcher, recursively watches the active worktree including `.git`, and emits a debounced `files-changed` Tauri event containing the worktree root and changed relative paths. `files_watch_stop` removes the watcher when the file mode is unmounted or the worktree changes.

The frontend batches event handling and invalidates only loaded/expanded directories that contain or are parents of changed paths. Collapsed directories are not enumerated in response to events. A watcher error leaves the last tree state visible, shows an error notification, and keeps manual refresh available. Rename, atomic-save, and remove events invalidate both old and new parent directories when available.

### Settings are persisted with repairable defaults

Extend the existing local settings object with `fileViewer`, `fileEditor`, and `fileClickAction`. Loading settings validates the action enum and treats missing/blank commands as unset, preserving compatibility with existing stored settings. The settings UI adds a File tools section with executable inputs and a default-click-action selector. File tool actions target the focused terminal pane and create one runnable tab per action.

## Risks / Trade-offs

- [Recursive watching `.git` can produce noisy Git-operation events] → Debounce events, send batches, and refresh only loaded/expanded directories in the frontend.
- [Filesystem events differ across OS backends and editors] → Use the full debouncer, invalidate parent directories for all create/remove/rename/modify events, and fall back to manual refresh after watcher errors.
- [A worktree `.git` entry may be a `gitdir:` file rather than a directory] → Display it as a regular file and do not attempt to expand it.
- [Configured executables may not exist] → The runnable terminal tab reports the normal PTY/shell spawn error without affecting other terminal sessions.
- [A filesystem path may contain shell metacharacters] → Build the command with a tested POSIX shell-quoting helper before passing it to the existing shell-backed runnable path.
- [A relative path could escape the worktree through `..` or a symlink] → Rust canonicalizes/validates requested paths and rejects paths outside the worktree before performing operations.
- [Large directories can produce expensive initial responses] → List only one directory level per request and load children on expansion.

## Migration Plan

No existing persisted settings are invalidated. Add optional settings fields with empty defaults and repair missing values at load time. Add the Rust dependency, commands, watcher state, and event registration together with the frontend Files mode. If rolled back, existing Workspaces behavior and settings remain usable; file-browser settings are ignored by the older build.

## Open Questions

None. The initial design intentionally excludes environment-variable lookup, shell argument templates, detached process launching, and content rendering.
