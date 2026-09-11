## MODIFIED Requirements

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

### Requirement: Projects persist across restarts
The application SHALL restore every persisted project from the identifier-based config directory (e.g. `~/Library/Application Support/com.overlook.app/projects.json`), including projects whose directories are temporarily unavailable, while migrating the legacy `{config_dir}/overlook/projects.json` file on first load when present.

#### Scenario: Projects survive a missing volume
- **WHEN** a persisted project is on an unmounted or unavailable volume and the application restarts
- **THEN** the project SHALL remain in the workspace tree as an unavailable project row
- **AND** its path, display name, and favorite state SHALL be preserved

#### Scenario: Project recovers after reinsertion
- **WHEN** the project volume is mounted again and the workspace list is refreshed
- **THEN** the project SHALL be marked reachable
- **AND** its default and discovered managed worktrees SHALL be shown again

## ADDED Requirements

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
