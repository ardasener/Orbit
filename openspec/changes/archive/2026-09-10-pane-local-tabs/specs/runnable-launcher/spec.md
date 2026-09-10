## MODIFIED Requirements

### Requirement: Runnable launch behavior
Launching a runnable SHALL create one tab per command in the runnable's command list in the active worktree's focused pane, preserving command order. The first created tab SHALL become active; additional tabs SHALL remain in that pane's tab bar. Each command SHALL be executed through the interactive shell (`<resolved-shell> -i -c "<command>"`), passed whole rather than split into argv, so shell functions, aliases, and the shell's environment are available.

#### Scenario: Single-command runnable opens one tab
- **WHEN** the user launches a runnable with one command
- **THEN** one tab SHALL open in the focused pane running that command in the active worktree's directory

#### Scenario: Multi-command runnable opens local tabs
- **WHEN** the user launches a runnable with multiple commands
- **THEN** one tab per command SHALL be created in the focused pane in command order
- **AND** the first tab SHALL be active
- **AND** no command SHALL be assigned to another pane automatically

#### Scenario: Launch target is the active worktree
- **WHEN** a runnable launches
- **THEN** every spawned command SHALL run with its working directory set to the active worktree's path

#### Scenario: Runnable tab titled by foreground process
- **WHEN** a runnable tab is shown and its command is running
- **THEN** the tab title SHALL be the foreground process name, updated as the foreground process changes

#### Scenario: Deterministic exe-name titles removed
- **WHEN** a runnable tab is created
- **THEN** its title SHALL NOT be a fixed executable basename derived from the command
- **AND** it SHALL be managed by the auto-title poller like shell tabs

#### Scenario: Runnable tab closes on process exit
- **WHEN** a runnable's process exits
- **THEN** its tab SHALL be removed from its owning pane

#### Scenario: Spawn failure shows an inline error
- **WHEN** a runnable command cannot be spawned
- **THEN** the tab SHALL show an inline error message instead of a terminal
