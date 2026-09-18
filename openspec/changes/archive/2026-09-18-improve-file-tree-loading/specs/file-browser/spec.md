## ADDED Requirements

### Requirement: Per-worktree file-tree state
The Files mode SHALL retain each worktree's loaded directory entries, expansion state, and selection in memory when the user switches sidebar modes or changes the active worktree.

#### Scenario: Return to Files mode
- **WHEN** the user switches away from Files and later returns to Files for the same worktree
- **THEN** the previously loaded tree SHALL be shown without requiring previously loaded directories to be listed again
- **AND** the previous expansion and selection state SHALL be restored

#### Scenario: Switch back to a worktree
- **WHEN** the user changes to a worktree whose file tree was previously loaded
- **THEN** that worktree's cached tree SHALL be shown immediately
- **AND** its active refresh SHALL run without clearing the cached tree

#### Scenario: First visit to a worktree
- **WHEN** the user opens Files for a worktree with no cached state
- **THEN** the root directory SHALL be loaded using the existing lazy tree behavior

### Requirement: Active-worktree refresh scope
The Files mode SHALL watch and refresh only the currently active worktree. Cached state for inactive worktrees SHALL remain available but SHALL NOT be refreshed or watched in the background.

#### Scenario: Active worktree changes
- **WHEN** the active worktree changes
- **THEN** the watcher for the previous worktree SHALL stop
- **AND** a watcher for the new active worktree SHALL start
- **AND** the new worktree's cached tree SHALL remain visible while its loaded directories refresh

#### Scenario: Inactive worktree remains cached
- **WHEN** a filesystem change occurs in an inactive worktree
- **THEN** the Files mode SHALL NOT enumerate or refresh that worktree
- **AND** its last cached tree SHALL remain available for the next visit

### Requirement: Non-blocking file-tree loading
Filesystem listing and watcher setup SHALL execute without blocking frontend interaction while the operation is in progress.

#### Scenario: Load a directory
- **WHEN** a directory listing is requested
- **THEN** the UI SHALL remain responsive while Rust performs the filesystem work
- **AND** the resulting entries SHALL be applied to the matching worktree and directory only when the request completes

#### Scenario: Refresh with cached content
- **WHEN** a loaded directory is refreshed
- **THEN** its existing entries SHALL remain visible during the request
- **AND** the UI SHALL expose loading progress without replacing the tree with a blocking full-screen state

#### Scenario: Obsolete request completes
- **WHEN** a listing response completes after the user has switched worktrees or a newer request replaced it
- **THEN** the response SHALL be discarded
- **AND** it SHALL NOT overwrite the current cache or active tree

### Requirement: Refresh request coalescing
The Files mode SHALL avoid issuing duplicate concurrent listings for the same worktree-relative directory and SHALL coalesce repeated watcher refreshes for a directory.

#### Scenario: Duplicate directory expansion
- **WHEN** the same directory is expanded while its listing is already in flight
- **THEN** only one listing request SHALL remain active for that directory
- **AND** all callers SHALL use its resulting entries

#### Scenario: Burst of file events
- **WHEN** multiple debounced file events affect the same loaded directory before refresh completes
- **THEN** the directory SHALL be refreshed no more than once for that pending batch

## MODIFIED Requirements

### Requirement: Lazy collapsed file tree
The Files mode SHALL show the active worktree's immediate children without an artificial root row. Directories SHALL begin collapsed and load their children only when expanded. Loaded directory data SHALL be retained in the per-worktree in-memory cache and SHALL be reused when the directory remains valid.

#### Scenario: Initial file tree
- **WHEN** Files mode opens for an active worktree with no cached root
- **THEN** the worktree's immediate files and directories SHALL be listed
- **AND** all directories SHALL be collapsed

#### Scenario: Restore cached tree
- **WHEN** Files mode opens for an active worktree with cached entries
- **THEN** the cached immediate files and directories SHALL be displayed immediately
- **AND** cached expanded directories SHALL remain expanded while refreshes run

#### Scenario: Expand a directory
- **WHEN** the user expands a directory that has not been loaded for the active worktree
- **THEN** its immediate children SHALL be requested from Rust and displayed
- **AND** descendants SHALL remain unloaded until their directories are expanded

#### Scenario: Entry ordering
- **WHEN** a directory's children are displayed
- **THEN** directories SHALL appear before files
- **AND** entries within each group SHALL be sorted case-insensitively by name

#### Scenario: Hidden and Git entries
- **WHEN** a directory contains hidden entries or `.git`
- **THEN** those entries SHALL appear in the tree like other entries

#### Scenario: Symlink entry
- **WHEN** a directory contains a symlink
- **THEN** the symlink SHALL be displayed
- **AND** expanding it SHALL NOT traverse its target

### Requirement: Worktree filesystem watcher
The application SHALL watch the active worktree recursively, including `.git`, and SHALL emit debounced batches of file changes to the Files mode. Watcher setup SHALL not block frontend interaction, and only the active worktree SHALL have an active watcher.

#### Scenario: Watch active worktree
- **WHEN** Files mode is active for a worktree
- **THEN** Rust SHALL maintain a recursive watcher for that worktree
- **AND** watcher events SHALL be delivered as debounced batches
- **AND** watcher registration SHALL execute without freezing the frontend

#### Scenario: Switch watched worktree
- **WHEN** the active worktree changes
- **THEN** the previous watcher SHALL stop
- **AND** a watcher for the new worktree SHALL start

#### Scenario: Refresh loaded directories
- **WHEN** a watched change affects a loaded or expanded directory in the active worktree
- **THEN** that directory SHALL refresh while preserving expansion and selection when possible

#### Scenario: Ignore inactive worktree changes
- **WHEN** a watched change occurs in a worktree that is not active
- **THEN** the Files mode SHALL NOT refresh that worktree in the background

#### Scenario: Ignore collapsed directory refreshes
- **WHEN** a watched change occurs only beneath a collapsed directory
- **THEN** the frontend SHALL NOT eagerly enumerate that directory

#### Scenario: Watcher error
- **WHEN** the watcher reports an error
- **THEN** the last known tree SHALL remain visible
- **AND** the user SHALL be notified
- **AND** manual refresh SHALL remain available

### Requirement: Manual file refresh
The Files mode SHALL provide a manual refresh action for the active worktree tree without discarding cached entries or expansion state.

#### Scenario: Refresh files manually
- **WHEN** the user activates refresh
- **THEN** loaded/expanded directories SHALL be re-enumerated
- **AND** the current expansion and selection state SHALL remain visible where possible
- **AND** cached entries SHALL remain visible while enumeration is in progress
