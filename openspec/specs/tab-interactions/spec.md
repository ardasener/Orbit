## Purpose

Defines pane-local tab drag-and-drop, pane focus, terminal zoom, and automatic tab titles without HTML5 drag events.

## Requirements

### Requirement: Drag tabs onto panes
The application SHALL let the user drag a tab from one pane's tab bar to another pane or its tab bar. Dropping onto a pane tab bar at a tab position SHALL insert the tab at that position; dropping onto the pane body SHALL append it. The moved tab SHALL become active in the destination pane and SHALL be removed from the source pane.

#### Scenario: Move a tab to another pane
- **WHEN** the user drags a tab from pane A onto pane B
- **THEN** the tab SHALL be removed from pane A
- **AND** the tab SHALL be inserted into pane B
- **AND** the tab SHALL become active in pane B

#### Scenario: Insert at a tab position
- **WHEN** the user drops a tab over a position between tabs in another pane's tab bar
- **THEN** the tab SHALL be inserted at that position in the destination pane's order

#### Scenario: Drop on pane body appends
- **WHEN** the user drops a tab onto a pane body outside its tab headers
- **THEN** the tab SHALL be appended to the destination pane's tab order
- **AND** the tab SHALL become active there

#### Scenario: Empty source pane remains available
- **WHEN** moving the last tab out of a pane
- **THEN** the source pane SHALL remain initialized
- **AND** it SHALL display the empty-panel placeholder

#### Scenario: Drop target highlights
- **WHEN** the user drags a tab over a pane or tab insertion position
- **THEN** the destination SHALL show a drop highlight until the drag leaves or the tab is dropped

### Requirement: Active pane indication
The application SHALL visually distinguish the focused pane by using a brighter neutral tab-bar surface for the focused pane and a dimmer neutral surface for other visible panes. Clicking inside a pane SHALL make it focused.

#### Scenario: Clicking a terminal focuses its pane
- **WHEN** the user clicks inside a pane's terminal
- **THEN** that pane SHALL become focused
- **AND** its tab bar SHALL use the focused styling

#### Scenario: Moving a tab focuses its destination
- **WHEN** a tab is dropped into another pane
- **THEN** the destination pane SHALL become focused

### Requirement: Reorder tabs within a pane
The application SHALL allow a user to reorder tabs within a pane by dragging a tab to another position in that pane's tab bar.

#### Scenario: Reorder a tab
- **WHEN** a tab is dropped at a different position in its owning pane's tab bar
- **THEN** the pane's tab order SHALL update to place the tab at that position
- **AND** the reordered tab SHALL remain active

### Requirement: Per-pane font zoom
The application SHALL zoom the terminal font of the pane under the pointer with Ctrl/Cmd + mouse wheel (or the equivalent trackpad pinch), relative to a configurable default font size.

#### Scenario: Zoom in and out
- **WHEN** the user holds Ctrl or Cmd and scrolls up over a pane
- **THEN** that pane's terminal font SHALL increase by one step; scrolling down SHALL decrease it by one step

#### Scenario: Zoom is bounded
- **WHEN** zooming reaches the bounds of the allowed font size range (8–24)
- **THEN** further zoom in the same direction SHALL be a no-op

#### Scenario: Zoom is per-pane and relative to the default
- **WHEN** the user zooms a pane's font
- **THEN** only that pane's font SHALL change, and changing the default font size in settings SHALL shift every pane's size while preserving each pane's relative zoom

#### Scenario: Zoom does not zoom the page
- **WHEN** the user zooms with Ctrl/Cmd + wheel over a terminal
- **THEN** the application page SHALL NOT zoom

### Requirement: Font zoom works inside TUIs
The per-pane font zoom SHALL work while a TUI application with mouse reporting (e.g. htop, vim, opencode) is running in the terminal.

#### Scenario: Zoom inside a TUI
- **WHEN** a TUI with mouse reporting is running and the user zooms with Ctrl/Cmd + wheel over the terminal
- **THEN** the pane's font SHALL zoom in/out per the wheel direction
- **AND** the TUI SHALL NOT receive the modifier-wheel as a mouse report

#### Scenario: Plain wheel still reaches the TUI
- **WHEN** a TUI with mouse reporting is running and the user scrolls with a plain (no-modifier) wheel
- **THEN** the TUI SHALL receive the wheel event for its native scrolling

#### Scenario: Bare-shell zoom unchanged
- **WHEN** no TUI is running and the user zooms with Ctrl/Cmd + wheel
- **THEN** the pane's font SHALL zoom as before

#### Scenario: Zoom remains bounded and per-pane
- **WHEN** zooming inside a TUI
- **THEN** the same bounds (8-24px) and per-pane, relative-to-default semantics SHALL apply

### Requirement: Default font size setting
The settings option for the terminal font size SHALL be labeled "Default font size" and SHALL define the baseline that per-pane zoom is relative to.

#### Scenario: Label is Default font size
- **WHEN** the settings modal is opened
- **THEN** the terminal size control SHALL be labeled "Default font size"

### Requirement: Automatic tab titles
The application SHALL title tabs from the process running in them, falling back to the default shell name when the terminal is idle. New tabs SHALL default to the shell name.

#### Scenario: Title follows the running process
- **WHEN** a process is running in the foreground of a terminal
- **THEN** the tab's title SHALL reflect that process's name

#### Scenario: Idle terminals keep the default title
- **WHEN** a terminal is idle
- **THEN** the tab SHALL keep its shell-name title

#### Scenario: New tabs default to the shell name
- **WHEN** a tab is created via a pane add control, the global new-terminal action, or by opening a split
- **THEN** the new tab SHALL be titled with the shell name, not a numeric placeholder
