## MODIFIED Requirements

### Requirement: Tag-based tab strip
The application SHALL render each initialized pane's tabs as a pane-local Ant Design `Tabs` bar rather than a shared Ant Design `Tag` strip. Each tab SHALL show its title and close control using standard neutral tab styling. The focused pane's tab bar SHALL be visually brighter than inactive pane tab bars.

#### Scenario: Tabs render in their owning pane
- **WHEN** pane tab bars are shown
- **THEN** each tab SHALL appear only in the bar of its owning pane
- **AND** the tab SHALL have a title and close control

#### Scenario: Click selects the tab and pane
- **WHEN** the user clicks a tab
- **THEN** that tab SHALL become active in its pane
- **AND** its pane SHALL become focused

#### Scenario: Close button closes the tab
- **WHEN** the user clicks a tab's close button
- **THEN** the tab SHALL be closed and its session terminated

### Requirement: Overflow scrolling without scrollbars
Each pane tab bar SHALL keep a single horizontal row. When tabs overflow the available width, that pane's tab bar SHALL scroll horizontally with no visible scrollbar, and the mouse wheel SHALL scroll the bar naturally.

#### Scenario: Wheel scrolls an overflowing pane bar
- **WHEN** the mouse wheel is used over a pane tab bar whose content overflows
- **THEN** that pane's tab bar SHALL scroll horizontally in the wheel's direction
- **AND** no scrollbar SHALL be visible

#### Scenario: Non-overflowing pane bar ignores wheel
- **WHEN** the mouse wheel is used over a pane tab bar whose content fits
- **THEN** that pane tab bar SHALL NOT scroll

### Requirement: Active tab scrolls into view
Each pane tab bar SHALL bring its newly active tab into view whenever that pane's active tab changes.

#### Scenario: Focused tab auto-scrolls into view
- **WHEN** the active tab changes through selection, creation, or a cross-pane move
- **THEN** the owning pane's tab bar SHALL scroll so the active tab is visible

### Requirement: Drag disables window-wide text selection
While a tab drag is active, the application SHALL prevent native text selection anywhere in the window so the drag is not interrupted.

#### Scenario: No text selection during drag
- **WHEN** a tab drag is in progress and the pointer moves over selectable text
- **THEN** no text SHALL become selected
- **AND** the drag SHALL continue tracking the pointer and complete normally
