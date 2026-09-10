## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Reorder tabs within a pane
The application SHALL allow a user to reorder tabs within a pane by dragging a tab to another position in that pane's tab bar.

#### Scenario: Reorder a tab
- **WHEN** a tab is dropped at a different position in its owning pane's tab bar
- **THEN** the pane's tab order SHALL update to place the tab at that position
- **AND** the reordered tab SHALL remain active
