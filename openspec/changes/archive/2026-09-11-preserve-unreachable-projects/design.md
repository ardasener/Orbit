## Context

The workspace configuration persists project paths, but `project_info` currently returns no record when a stored path is not an accessible directory. `workspace_list` filters those records out, so the frontend cannot distinguish an unavailable removable volume from a project that was intentionally removed. Several project mutations also canonicalize the path before operating, which prevents actions on a temporarily missing path.

## Goals / Non-Goals

**Goals:**

- Preserve unavailable persisted project entries in the Rust workspace response.
- Expose explicit reachability state to the frontend.
- Render unavailable projects as gray, tooltip-marked project-only rows.
- Sort unavailable projects after reachable projects while retaining existing favorite/name ordering within each group.
- Restore full project metadata and discovered worktrees after a refresh when the path becomes reachable again.
- Permit metadata-safe actions on unavailable entries and prevent filesystem-dependent actions.

**Non-Goals:**

- Monitoring mount points with a native filesystem-volume watcher.
- Automatically mounting removable media.
- Discovering or preserving managed worktree children while the project root is unavailable.
- Changing project persistence format beyond the in-memory/API reachability field.

## Decisions

### Represent reachability in `ProjectInfo`

Add a serialized `reachable` boolean. When the stored directory is accessible, retain the existing git detection, branch lookup, and worktree discovery. When it is unavailable, construct a project-only `ProjectInfo` from persisted metadata: derive the basename where possible, preserve display name and favorite state, set `is_git` and `branch` to false/none, and return an empty worktree list. This keeps persistence authoritative while making availability explicit.

An alternative was to have the frontend retain projects from its previous response. That would fail across application restarts and would make Rust's persisted project list inconsistent, so the backend remains the source of truth.

### Make unavailable metadata actions path-safe

Favorite, rename, and remove operations will match the stored path directly first and canonicalize only when the path currently exists. They can therefore update or remove an unreachable entry without touching its filesystem. Forking remains unavailable because it requires a live git repository. An alternative was to disable all actions, but path copy and metadata management remain useful while a volume is offline.

### Refresh availability on workspace refresh and window focus

The existing initial workspace load remains the primary refresh. The workspace provider will also refresh when the application window regains focus, allowing a reinserted volume to recover without requiring an application restart or a native volume watcher. Refresh failures preserve the last known project list.

### Sort reachability before existing ordering

The frontend filter will compare `reachable` before `favorite`, then use the existing display-name ordering. Search behavior remains unchanged: an unavailable project can still be found by path or display name, but it remains at the end of the result set.

## Risks / Trade-offs

- [A volume is present but temporarily unreadable] → Treat it as unreachable, preserve the row, and retry on the next refresh/focus event.
- [A missing project path has no basename] → Use the stored path as the display fallback rather than dropping the record.
- [Repeated focus events cause extra IPC calls] → Reuse the existing lightweight workspace listing and preserve the last list if a refresh fails; no polling loop is introduced.
- [A stale path is intentionally removed] → The existing Remove project action remains available so the user can clean it up explicitly.
