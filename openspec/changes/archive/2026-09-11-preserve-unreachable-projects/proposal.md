## Why

Projects stored on removable volumes currently disappear from the workspace tree whenever the volume is unavailable. This makes persisted project state look lost and prevents the project from naturally returning when the volume is mounted again.

## What Changes

- Preserve persisted projects in the workspace list even when their directories cannot currently be reached.
- Mark unavailable projects as unreachable and render only their project row in a muted/gray style.
- Show a warning tooltip explaining that the project directory could not be reached.
- Sort reachable projects before unreachable projects while retaining existing favorite and name ordering within each group.
- Restore the project's normal metadata and worktree children after a workspace refresh once its volume is available again.
- Keep path copy, rename, favorite, and remove actions available for unreachable projects; disable actions that require filesystem access, such as forking.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `workspace-management`: Persisted unreachable projects remain visible and recover when their directories become available again.

## Impact

The Rust workspace listing API and project-info serialization will gain reachability state and will no longer discard missing directories. The React workspace context and sidebar will update sorting, unavailable-row presentation, tooltip messaging, and action availability. Tests will cover missing-volume persistence, ordering, and rehydration after the path returns; no new dependency is expected.
