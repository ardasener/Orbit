## Why

The Files sidebar can take several seconds to open on large repositories and can make the UI unresponsive while filesystem work and tree rendering complete. Switching away from Files also discards the loaded tree, forcing the same work to repeat when the user returns.

## What Changes

- Preserve loaded file-tree data, expansion state, and selection per worktree while switching sidebar modes or active worktrees.
- Refresh only the currently active worktree; retain inactive worktree caches without background refresh.
- Keep cached tree data visible while refreshes are in flight and coalesce duplicate or stale requests.
- Move blocking filesystem listing and watcher setup off the UI-blocking command path while retaining Rust-owned filesystem access and path validation.
- Reduce unnecessary frontend tree work for large repositories without changing lazy directory loading, ordering, context actions, or watcher semantics.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `file-browser`: Persist per-worktree file-tree state, refresh only the active worktree, and keep the Files UI responsive during filesystem refreshes.

## Impact

The change affects `FileBrowser` state ownership and rendering, sidebar mode/worktree lifecycle, Rust file-listing and watcher commands, IPC registration, and frontend/Rust tests. It does not change the filesystem security boundary or the user-visible file actions.
