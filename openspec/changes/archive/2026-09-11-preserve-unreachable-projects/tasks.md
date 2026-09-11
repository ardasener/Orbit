## 1. Rust workspace availability model

- [x] 1.1 Extend `ProjectInfo` with serialized reachability state and construct project-only fallback records for persisted paths that cannot currently be accessed.
- [x] 1.2 Preserve stored project entries in `workspace_list` while retaining existing metadata and worktree discovery for reachable projects.
- [x] 1.3 Update favorite, rename, and remove persistence operations to match and mutate unavailable paths without requiring canonicalization; keep add/fork validation strict for new filesystem-dependent operations.
- [x] 1.4 Add Rust tests covering unavailable project listing, metadata preservation, recovery after the directory returns, and mutation of missing paths.

## 2. Workspace context and refresh

- [x] 2.1 Add reachability to the frontend `ProjectInfo` type and refresh workspace state when the application window regains focus while preserving the last list on errors.
- [x] 2.2 Sort reachable projects before unreachable projects while retaining favorite-first and display-name ordering within each group.
- [x] 2.3 Add frontend tests for ordering, search visibility, refresh recovery, and failed-refresh state preservation.

## 3. Workspace sidebar presentation and actions

- [x] 3.1 Render unreachable projects as gray project-only rows with a warning tooltip and no worktree children.
- [x] 3.2 Keep copy path, rename, favorite, and remove actions available for unreachable projects while hiding filesystem-dependent fork actions.
- [x] 3.3 Ensure unavailable rows cannot become active worktrees or spawn terminals, and add UI tests for rendering and action availability.

## 4. Verification and specification sync

- [x] 4.1 Run frontend type checks, lint, tests, build, and Rust format, clippy, and test checks.
- [x] 4.2 Manually verify the removable-volume scenario with a mounted/unmounted APFS disk image and confirm rehydration after reinsertion/focus.
- [x] 4.3 Synchronize the completed workspace-management delta into `openspec/specs/` before manual review.
