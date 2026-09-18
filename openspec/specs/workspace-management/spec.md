## Purpose

Owns the project list: adding/removing project directories, persistence, and rendering the workspace tree.

## Requirements

### Requirement: Project tree
The application SHALL display every persisted project as a tree row. Reachable projects SHALL contain a default worktree and any discovered managed git worktrees. Unreachable projects SHALL appear as project-only rows with no worktree children and SHALL be marked unavailable to the frontend.

#### Scenario: Projects render with worktrees
- **WHEN** the sidebar is shown and a project directory is reachable
- **THEN** the project SHALL appear with its default worktree and its managed git worktrees nested beneath it

#### Scenario: Unreachable project remains visible
- **WHEN** the sidebar is shown and a persisted project directory cannot be reached
- **THEN** the project SHALL still appear as a project row
- **AND** it SHALL have no worktree children
- **AND** its reachability state SHALL be false

#### Scenario: Unreachable project is visually distinct
- **WHEN** an unreachable project row is rendered
- **THEN** the row SHALL use muted/gray styling
- **AND** hovering the row SHALL show a warning that the project directory could not be reached

#### Scenario: Default worktree for every project
- **WHEN** a project is listed
- **THEN** it SHALL include a default worktree representing the project directory itself, regardless of whether the project is a git repository

### Requirement: Project actions move to a context menu
The application SHALL surface per-row actions through a right-click context menu instead of inline buttons: fork, rename, copy path, and remove for projects; copy path and delete for non-default worktrees. Favorites are toggled by a star button on the project row.

#### Scenario: Project row has a star and no inline action buttons
- **WHEN** a project row is rendered
- **THEN** it SHALL show a star button and SHALL NOT show inline fork/remove buttons

#### Scenario: Worktree row has no inline delete button
- **WHEN** a non-default worktree row is rendered
- **THEN** it SHALL NOT show an inline delete button (delete moves to the context menu)
### Requirement: Add and remove projects
The application SHALL let the user add a project directory via the `+` button and remove a project via the context menu (with confirmation).

#### Scenario: Add a valid directory
- **WHEN** the user enters an existing directory path via the `+` popover
- **THEN** the project SHALL be added to the list and appear in the tree

#### Scenario: Add rejects invalid paths
- **WHEN** the user enters a path that does not exist or is not a directory
- **THEN** an inline error SHALL be shown and the project SHALL NOT be added

#### Scenario: Remove confirms and untracks
- **WHEN** the user chooses Remove project from the context menu and confirms
- **THEN** the project SHALL be removed from the list, and its managed worktrees SHALL remain on disk but no longer be listed

#### Scenario: Projects persist across restarts
- **WHEN** the application restarts
- **THEN** every persisted project SHALL be restored from Orbit's identifier-based config directory (e.g. `~/Library/Application Support/com.ardasener.orbit/projects.json`), including temporarily unavailable projects
- **AND** no Overlook project configuration SHALL be migrated or loaded

#### Scenario: Projects survive a missing volume
- **WHEN** a persisted project is on an unmounted or unavailable volume and the application restarts
- **THEN** the project SHALL remain in the workspace tree as an unavailable project row
- **AND** its path, display name, and favorite state SHALL be preserved

#### Scenario: Project recovers after reinsertion
- **WHEN** the project volume is mounted again and the workspace list is refreshed
- **THEN** the project SHALL be marked reachable
- **AND** its default and discovered managed worktrees SHALL be shown again

### Requirement: Live search
The application SHALL filter the tree as the user types, matching project paths and worktree branch names.

#### Scenario: Project path matches
- **WHEN** the search matches a project's path
- **THEN** that project SHALL be shown with all of its worktrees

#### Scenario: Branch name matches
- **WHEN** the search matches a worktree's branch name
- **THEN** the owning project SHALL be shown with only the matching worktrees

### Requirement: Unreachable project ordering and actions
The workspace tree SHALL sort reachable projects before unreachable projects. Within each reachability group, existing favorite-first and display-name ordering SHALL remain in effect. Unreachable projects SHALL allow path copy, rename, favorite, and removal actions, but SHALL not offer filesystem-dependent fork actions.

#### Scenario: Unreachable projects sort last
- **WHEN** both reachable and unreachable projects are present
- **THEN** all reachable projects SHALL appear before unreachable projects
- **AND** favorite/name ordering SHALL apply within each group

#### Scenario: Unreachable project supports metadata actions
- **WHEN** the user opens an unreachable project's context menu
- **THEN** copy path, rename, favorite, and remove actions SHALL remain available
- **AND** fork SHALL not be offered

### Requirement: Workspace availability refresh
The application SHALL refresh workspace availability on initial load and when the application window regains focus. A failed refresh SHALL preserve the last known project list.

#### Scenario: Focus refresh rehydrates a project
- **WHEN** a previously unreachable project's volume is reinserted and the application regains focus
- **THEN** the workspace list SHALL be refreshed
- **AND** the project SHALL return to its reachable state when the directory is accessible

#### Scenario: Refresh failure preserves state
- **WHEN** a workspace refresh fails
- **THEN** the current project list SHALL remain visible

### Requirement: Worktree forking
The application SHALL create new git worktrees for a project via the context-menu fork action, prompting for a branch name in a dialog.

#### Scenario: Fork creates a new branch
- **WHEN** the user enters a branch name that does not exist and confirms
- **THEN** a new branch SHALL be created from the project's default worktree HEAD and a managed worktree SHALL be created for it

#### Scenario: Fork with an existing branch requires confirmation
- **WHEN** the user enters a branch name that already exists
- **THEN** the user SHALL be asked whether to attach the worktree to the existing branch or cancel

#### Scenario: Fork disabled for non-git projects
- **WHEN** a project is not a git repository
- **THEN** no fork action SHALL be offered for it

### Requirement: Worktree discovery and pruning
The application SHALL discover managed worktrees by scanning the cache directory and prune stale entries.

#### Scenario: Externally created worktrees are adopted
- **WHEN** a directory matching a project's managed-worktree naming appears in the cache
- **THEN** it SHALL appear in that project's tree

#### Scenario: Vanished worktrees are pruned
- **WHEN** a managed worktree's directory no longer exists
- **THEN** it SHALL be removed from the tree (and git worktree metadata pruned)

### Requirement: Active worktree and per-worktree layouts
Selecting a worktree SHALL make it active: new terminals SHALL spawn in its directory, and each worktree SHALL retain its own tabs and split layout within the session.

#### Scenario: Selecting a worktree activates it
- **WHEN** the user clicks a worktree in the tree
- **THEN** it SHALL become the active worktree and its saved tabs and layout SHALL be shown

#### Scenario: New terminals spawn in the active worktree
- **WHEN** a new terminal is created while a worktree is active
- **THEN** its shell SHALL start with its working directory set to that worktree's path

#### Scenario: Switching worktrees preserves live sessions
- **WHEN** the user switches from one worktree to another
- **THEN** the previous worktree's shell sessions SHALL keep running and its layout SHALL be restored when switching back

#### Scenario: Layouts are session-scoped
- **WHEN** the application restarts
- **THEN** tabs and layouts SHALL reset (only the project list persists)
