## 1. File-tree state ownership

- [x] 1.1 Extract a per-worktree in-memory file-tree store or hook that owns directory entries, expansion, selection, loading, errors, request generations, and in-flight deduplication.
- [x] 1.2 Integrate the store with `WorkspaceSidebar`/`FileBrowser` so mode switches and active-worktree changes restore cached state without losing the existing Files UI behavior.
- [x] 1.3 Apply only current, matching responses and coalesce duplicate directory and watcher refresh requests.

## 2. Rust asynchronous filesystem operations

- [x] 2.1 Convert directory listing IPC to an async Tauri command that performs blocking filesystem traversal in a blocking task and preserves current ordering and validation behavior.
- [x] 2.2 Move recursive watcher setup off the UI-sensitive command path while preserving single-active-watcher lifecycle, debounced events, and watcher error reporting.
- [x] 2.3 Verify command registration, capability access, serialization, and error propagation remain compatible with the typed frontend calls.

## 3. Active refresh and responsive rendering

- [x] 3.1 Refresh only the active worktree and preserve inactive worktree caches without background watcher or polling activity.
- [x] 3.2 Keep cached tree content visible during initial refreshes of cached worktrees, manual refreshes, and watcher-driven updates; expose progress through the existing toolbar affordance.
- [x] 3.3 Limit tree-state updates and tree construction to affected loaded branches while preserving lazy expansion, selection, context actions, ordering, hidden entries, and symlink behavior.
- [x] 3.4 Handle active-worktree switches and unmount cleanup without leaking listeners, watchers, or pending state updates.

## 4. Tests and verification

- [x] 4.1 Add frontend tests for per-worktree cache persistence, restoration, active-only refresh, duplicate request coalescing, and stale response rejection.
- [x] 4.2 Add Rust tests for async listing behavior through the existing path, ordering, hidden-entry, traversal, and symlink protection coverage.
- [x] 4.3 Add regression coverage for watcher lifecycle, active-worktree switching, and refresh preservation/error behavior.
- [ ] 4.4 Run frontend tests, type checks, lint, Rust formatting, clippy, and Rust tests; manually verify responsiveness on a large repository. Automated checks pass; large-repository GUI verification remains pending.
- [x] 4.5 Synchronize the completed file-browser delta spec into `openspec/specs/file-browser/spec.md` before manual review.
