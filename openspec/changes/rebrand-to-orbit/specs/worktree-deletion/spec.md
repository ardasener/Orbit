## MODIFIED Requirements

### Requirement: Worktree deletion
The workspace SHALL let the user delete a managed (non-default) worktree while keeping the project.

#### Scenario: Delete button on non-default worktrees
- **WHEN** a non-default worktree row is shown
- **THEN** it SHALL have a delete action

#### Scenario: Default worktree has no delete action
- **WHEN** the default worktree (the project directory itself) is shown
- **THEN** it SHALL NOT have a delete action (removal happens via project removal)

#### Scenario: Clean worktree removes immediately
- **WHEN** the user deletes a worktree with no uncommitted changes
- **THEN** the worktree SHALL be removed and the workspace list SHALL refresh

#### Scenario: Dirty worktree prompts for force removal
- **WHEN** the user deletes a worktree with uncommitted changes
- **THEN** a confirmation SHALL be shown offering Force remove and Cancel
- **AND** the worktree SHALL NOT be removed until the user confirms

#### Scenario: Force remove deletes the worktree
- **WHEN** the user confirms Force remove on a dirty worktree
- **THEN** the worktree SHALL be removed (including its cache directory) and the workspace list SHALL refresh

#### Scenario: Removing a worktree validates its location
- **WHEN** a worktree path is removed
- **THEN** the command SHALL only act on paths under Orbit's cache directory with the project's `orbit-<hash>-` prefix
