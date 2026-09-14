## ADDED Requirements

### Requirement: Native file drops insert shell-safe paths
The terminal SHALL accept native file and directory drops over a visible terminal pane and insert every dropped absolute path as one shell-safe argument, with arguments separated by a single space and no command submission.

#### Scenario: Single file is dropped into a terminal
- **WHEN** a file is dropped within the bounds of a visible terminal pane
- **THEN** its absolute path SHALL be inserted into that terminal's input
- **AND** the path SHALL be delivered through the existing terminal-to-PTY input flow
- **AND** no Enter or other command-submission character SHALL be appended

#### Scenario: Multiple files are dropped into a terminal
- **WHEN** multiple files or directories are dropped within the bounds of a visible terminal pane
- **THEN** all dropped absolute paths SHALL be inserted in drop order
- **AND** exactly one space SHALL separate adjacent path arguments

#### Scenario: Path characters are shell-safe
- **WHEN** a dropped path contains spaces, single quotes, shell metacharacters, or newlines
- **THEN** the inserted text SHALL represent that path as one POSIX shell argument without interpreting those characters as shell syntax

#### Scenario: Drop outside a terminal is ignored
- **WHEN** files or directories are dropped outside every visible terminal pane
- **THEN** no terminal SHALL receive the dropped paths

#### Scenario: Hidden terminal does not receive a drop
- **WHEN** files or directories are dropped over a terminal host that is not visible
- **THEN** that host SHALL NOT receive the dropped paths

#### Scenario: File drop does not alter tab dragging
- **WHEN** the user performs the existing pointer-based tab drag interaction
- **THEN** tab hit-testing and reordering SHALL continue to work unchanged
