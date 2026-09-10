## MODIFIED Requirements

### Requirement: Tab bar with one terminal per tab
The application SHALL display global top-bar chrome without a shared tab strip. Each initialized terminal pane SHALL display its own tab bar, where each tab represents one live terminal session. A pane tab bar SHALL scroll horizontally when its tabs overflow the available width.

#### Scenario: Pane-local tabs render
- **WHEN** an initialized pane contains multiple tabs
- **THEN** those tabs SHALL appear in that pane's tab bar with their titles and close controls
- **AND** tabs from another pane SHALL NOT appear in that tab bar

#### Scenario: Pane tab bar scrolls when full
- **WHEN** a pane's tabs exceed the available tab-bar width
- **THEN** that pane's tab bar SHALL scroll horizontally to reveal the overflow

### Requirement: Create and close tabs
The application SHALL create a new terminal tab in the focused pane via the global `+` action or that pane's local add control, and SHALL close a tab via its close control, killing its shell session.

#### Scenario: New tab creates a live terminal in the focused pane
- **WHEN** the user activates the global new-terminal action or a pane's add control
- **THEN** a new shell session SHALL spawn in the target pane's worktree
- **AND** the new tab SHALL become active in that pane

#### Scenario: Closing a tab kills its shell
- **WHEN** the user clicks a tab's close button
- **THEN** the tab SHALL disappear from its owning pane and its shell session SHALL be terminated

#### Scenario: Closing the last tab leaves an empty pane
- **WHEN** the last tab is closed or moved out of an initialized pane
- **THEN** the pane SHALL remain initialized with no tabs
- **AND** the pane SHALL display the empty-panel placeholder

### Requirement: Split layouts
The application SHALL support four layout states controlled by the two independent split toggles: single, vertical, bottom, and vertical-plus-bottom. Each split location SHALL own an independent pane tab workspace.

#### Scenario: First split creates a pane shell
- **WHEN** the user enables a split whose pane has never been initialized
- **THEN** that pane SHALL be initialized with one new shell tab

#### Scenario: Toggling a split hides and restores pane state
- **WHEN** the user disables a split and later enables it again
- **THEN** the pane SHALL restore its prior tabs, ordering, active tab, and live sessions
- **AND** no tab SHALL be moved automatically to another pane

#### Scenario: Split toggles remain independent
- **WHEN** the user toggles one split while the other split is enabled
- **THEN** the other split and its pane state SHALL remain unchanged

### Requirement: Sessions survive parking
When a tab is removed from the visible content of a pane, including by tab switching, cross-pane movement, or split hiding, its shell session SHALL remain alive until the tab is explicitly closed.

#### Scenario: Hidden pane session survives
- **WHEN** a split is toggled off
- **THEN** every tab and shell session owned by that pane SHALL remain alive

#### Scenario: Reopening restores the same terminal
- **WHEN** a hidden split is toggled on again
- **THEN** its previous active tab SHALL reappear with its existing session and scrollback

#### Scenario: Inactive tab preserves its session
- **WHEN** a different tab is selected within a pane
- **THEN** the previously active tab SHALL remain alive and reappear with its scrollback when selected again

### Requirement: Empty panel placeholder
An initialized pane with no tab SHALL show a placeholder inviting the user to create a terminal.

#### Scenario: Placeholder after last tab leaves
- **WHEN** the last tab in an initialized pane is closed or moved to another pane
- **THEN** that pane's tab bar SHALL remain visible
- **AND** the pane SHALL display the existing create-terminal placeholder

### Requirement: Panel color coding
The application SHALL distinguish the focused pane through neutral tab-bar surface brightness. The focused pane SHALL use the normal tab-bar surface, while visible inactive panes SHALL use a dimmed version of the same neutral surface. Pane borders and individual tab labels SHALL NOT use slot-specific accent colors.

#### Scenario: Focused pane tab bar is brighter
- **WHEN** a pane is focused
- **THEN** its tab bar SHALL use the normal neutral surface styling
- **AND** inactive visible pane tab bars SHALL use the dimmed neutral styling

#### Scenario: Pane locations share styling
- **WHEN** panes are visible in any split layout
- **THEN** all pane tab bars SHALL use the same neutral color scheme regardless of pane slot
