## MODIFIED Requirements

### Requirement: Keyboard shortcuts for all actions
The application SHALL support keyboard shortcuts for focusing each panel slot and the workspace sidebar, moving between tabs within the focused pane, toggling the vertical and bottom splits, toggling the workspace sidebar, opening a new terminal in the focused pane, opening the runnable launcher, closing the active tab in the focused pane, and zooming the terminal font in/out.

#### Scenario: Tab shortcuts stay within the focused pane
- **WHEN** the user presses next-tab or previous-tab
- **THEN** the application SHALL select the adjacent tab in the focused pane
- **AND** tabs owned by other panes SHALL NOT be selected

#### Scenario: New and close shortcuts target the focused pane
- **WHEN** the user presses the new-terminal or close-tab shortcut
- **THEN** the action SHALL create or close a tab in the focused pane

#### Scenario: Shortcuts dispatch actions
- **WHEN** the user presses a configured shortcut
- **THEN** the corresponding action SHALL run (focus, tab switch, toggle, open, close, or zoom)

#### Scenario: Shortcuts never reach TUIs
- **WHEN** a configured shortcut is pressed while a terminal is focused
- **THEN** the shortcut SHALL be handled by the app
- **AND** the terminal SHALL NOT receive the key events
