## MODIFIED Requirements

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
