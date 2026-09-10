## ADDED Requirements

### Requirement: Sidebar file mode
The application SHALL provide a Files mode beside the existing Workspaces mode in the left sidebar using a visually distinct mutually exclusive radio-button selector.

#### Scenario: Switch to Files mode
- **WHEN** the user selects Files in the sidebar mode selector
- **THEN** the workspace tree SHALL be replaced by the active worktree's file tree
- **AND** the selector SHALL show Files as selected

#### Scenario: Switch back to Workspaces mode
- **WHEN** the user selects Workspaces
- **THEN** the existing project/worktree tree SHALL be shown again

#### Scenario: No active worktree
- **WHEN** Files mode is selected without an active worktree
- **THEN** the sidebar SHALL show an empty state explaining that a worktree must be selected

### Requirement: Lazy collapsed file tree
The Files mode SHALL show the active worktree's immediate children without an artificial root row. Directories SHALL begin collapsed and load their children only when expanded.

#### Scenario: Initial file tree
- **WHEN** Files mode opens for an active worktree
- **THEN** the worktree's immediate files and directories SHALL be listed
- **AND** all directories SHALL be collapsed

#### Scenario: Expand a directory
- **WHEN** the user expands a directory
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

### Requirement: File context actions
The application SHALL provide View, Edit, Copy Abs. Path, and Copy Rel. Path actions for file rows. Directory rows SHALL provide only Copy Abs. Path and Copy Rel. Path actions.

#### Scenario: File context menu
- **WHEN** the user right-clicks a file
- **THEN** the context menu SHALL show View, Edit, Copy Abs. Path, and Copy Rel. Path

#### Scenario: Directory context menu
- **WHEN** the user right-clicks a directory
- **THEN** the context menu SHALL show Copy Abs. Path and Copy Rel. Path
- **AND** it SHALL NOT offer View or Edit

#### Scenario: Copy absolute path
- **WHEN** the user chooses Copy Abs. Path
- **THEN** the absolute path SHALL be copied to the system clipboard

#### Scenario: Copy relative path
- **WHEN** the user chooses Copy Rel. Path
- **THEN** the path relative to the active worktree root SHALL be copied to the system clipboard

### Requirement: Default file click action
The application SHALL execute the configured default action when the user left-clicks a file. The default action SHALL be Copy Abs. Path.

#### Scenario: Default click copies absolute path
- **WHEN** a file is left-clicked with default settings
- **THEN** its absolute path SHALL be copied to the system clipboard

#### Scenario: Directory click toggles expansion
- **WHEN** a directory is left-clicked
- **THEN** the directory SHALL expand or collapse
- **AND** the default file action SHALL NOT run

### Requirement: Terminal file tools
The application SHALL launch configured view and edit executables as dedicated runnable terminal tabs in the focused pane, passing the selected file's absolute path as the only argument after `--`. Empty viewer and editor settings SHALL resolve to `view` and `vim` respectively. The command SHALL execute through the existing interactive-shell PTY path with the active worktree as its working directory.

#### Scenario: View a file
- **WHEN** the user chooses View for a file
- **THEN** a dedicated runnable terminal tab SHALL open in the focused pane
- **AND** the configured viewer, or `view` when unset, SHALL run with the safely quoted file path

#### Scenario: Edit a file
- **WHEN** the user chooses Edit for a file
- **THEN** a dedicated runnable terminal tab SHALL open in the focused pane
- **AND** the configured editor, or `vim` when unset, SHALL run with the safely quoted file path

#### Scenario: Tool cannot launch
- **WHEN** the configured executable cannot be spawned
- **THEN** the resulting runnable terminal tab SHALL expose the normal terminal spawn error
- **AND** other terminal sessions SHALL remain unchanged

#### Scenario: File tool tab closes on exit
- **WHEN** the view or edit process exits
- **THEN** its dedicated runnable terminal tab SHALL close using the existing runnable close-on-exit behavior

### Requirement: Worktree filesystem watcher
The application SHALL watch the active worktree recursively, including `.git`, and SHALL emit debounced batches of file changes to the Files mode.

#### Scenario: Watch active worktree
- **WHEN** Files mode is active for a worktree
- **THEN** Rust SHALL maintain a recursive watcher for that worktree
- **AND** watcher events SHALL be delivered as debounced batches

#### Scenario: Switch watched worktree
- **WHEN** the active worktree changes
- **THEN** the previous watcher SHALL stop
- **AND** a watcher for the new worktree SHALL start

#### Scenario: Refresh loaded directories
- **WHEN** a watched change affects a loaded or expanded directory
- **THEN** that directory SHALL refresh while preserving expansion and selection when possible

#### Scenario: Ignore collapsed directory refreshes
- **WHEN** a watched change occurs only beneath a collapsed directory
- **THEN** the frontend SHALL NOT eagerly enumerate that directory

#### Scenario: Watcher error
- **WHEN** the watcher reports an error
- **THEN** the last known tree SHALL remain visible
- **AND** the user SHALL be notified
- **AND** manual refresh SHALL remain available

### Requirement: Manual file refresh
The Files mode SHALL provide a manual refresh action for the active worktree tree.

#### Scenario: Refresh files manually
- **WHEN** the user activates refresh
- **THEN** loaded/expanded directories SHALL be re-enumerated
- **AND** the current expansion state SHALL be preserved where possible

### Requirement: Path validation and filesystem boundary
All file listings and path operations SHALL be performed by Rust. Rust SHALL reject requested paths that resolve outside the active worktree. View/edit commands SHALL use a Rust-validated absolute path before entering the existing terminal command path.

#### Scenario: Valid worktree-relative path
- **WHEN** the frontend requests a path within the active worktree
- **THEN** Rust SHALL perform the requested operation and return the result

#### Scenario: Escaping path rejected
- **WHEN** the frontend requests a path containing traversal or a symlink that resolves outside the active worktree
- **THEN** Rust SHALL reject the request
- **AND** no filesystem operation or terminal file-tool command SHALL be started
