## Context

The Files sidebar currently stores its directory results, expansion state, and selection inside `FileBrowser`. Switching sidebar modes unmounts that component, so returning to Files clears the tree and lists the active worktree again. The Rust listing and watcher commands are synchronous filesystem operations, while the frontend builds the complete currently expanded Ant Design tree in one render.

Orbit's security boundary requires all filesystem access to remain in Rust. The existing file browser is intentionally lazy: only the root and explicitly expanded directories are listed. The change must preserve that behavior while making cached state reusable and keeping the webview responsive.

## Goals / Non-Goals

**Goals:**

- Persist file-tree state independently of the Files mode component lifecycle, keyed by worktree path.
- Restore cached entries, expansion, and selection immediately when revisiting a worktree.
- Watch and refresh only the active worktree; inactive caches remain unchanged.
- Keep stale data visible during refresh and prevent duplicate or stale responses from overwriting current state.
- Execute blocking Rust filesystem work away from the UI-sensitive command path.
- Preserve lazy loading, ordering, watcher-driven refresh, path validation, and existing file actions.

**Non-Goals:**

- Refreshing inactive projects or worktrees in the background.
- Eagerly enumerating an entire repository or changing the lazy tree model.
- Ignoring `.git`, hidden entries, symlinks, or other existing file-listing policy.
- Changing the file viewer/editor actions or Rust filesystem authorization boundary.
- Adding a new persistence file or restoring state across application launches.

## Decisions

### Keep a per-worktree in-memory cache

The file-browser state store will map each active-worktree path to its loaded directory entries, expanded keys, selected key, and request status. The store will outlive `FileBrowser` rendering so mode switches do not discard state. It remains in-memory only; application restart persistence is not required.

The cache will be updated immutably and scoped by worktree. Each request records the worktree and directory it belongs to; responses for an obsolete worktree or superseded request are ignored. A request registry prevents repeated expansion, watcher, and manual-refresh events from issuing duplicate listings for the same directory.

### Refresh only the active worktree

The existing recursive watcher remains attached only to the active worktree. On worktree changes, the previous watcher is stopped and the new active worktree is started. Loaded or expanded directories affected by a debounced event are refreshed, while cached data for inactive worktrees is retained without polling or watcher activity.

### Move blocking filesystem operations off the command path

Directory listing and watcher setup will use async Tauri commands with owned arguments. Blocking filesystem traversal and watcher registration will run in blocking tasks, returning the same serialized entries and error strings to the frontend. Path canonicalization, symlink restrictions, and worktree containment checks remain in Rust before any result is returned.

### Keep cached content visible during refresh

Refresh state will be represented separately from cached entries. The tree remains rendered when a refresh is in flight, including during manual refresh and active-worktree changes where a cache exists. A spinner or equivalent toolbar indicator communicates activity; an empty loading state is used only when no cached root exists.

### Limit frontend work to changed branches

The frontend will retain the existing lazy data shape and avoid rebuilding unrelated directory state when a single loaded directory refreshes. Tree construction will only include expanded descendants, and refresh events will be coalesced by directory. No new rendering dependency is introduced unless profiling during implementation demonstrates that Ant Design's existing virtual tree cannot meet the responsiveness requirement.

## Risks / Trade-offs

- [An in-memory cache can become stale while a worktree is inactive] → Refresh the complete loaded active view when it becomes active and keep manual refresh available.
- [Rapid watcher events can produce overlapping requests] → Deduplicate requests by worktree and directory and ignore responses with obsolete request generations.
- [Async commands can expose races during worktree switching] → Include the worktree identity in request state and discard results that no longer match the active request context.
- [Large directories can still require substantial rendering] → Preserve lazy loading, keep stale content visible, and verify large-directory behavior with focused tests and profiling before considering broader virtualization changes.
- [Watcher registration remains expensive for very large repositories] → Perform registration in a blocking task and keep only one watcher active at a time.

## Migration Plan

No on-disk migration is required. Existing in-memory state starts empty after application launch, and the current active worktree is loaded normally. Rollback is limited to restoring the previous frontend state lifecycle and synchronous command implementations.

## Open Questions

None.
