## MODIFIED Requirements

### Requirement: Settings modal is accessible
The application SHALL provide a settings modal reachable from the global settings action and SHALL include Appearance, Terminal, and File tools sections.

#### Scenario: Open settings
- **WHEN** the user activates the settings action
- **THEN** a settings modal SHALL open with Appearance, Terminal, and File tools sections

## ADDED Requirements

### Requirement: File tool settings
The settings modal SHALL provide persisted executable settings for the terminal file viewer and editor, plus a persisted default file left-click action. Blank viewer and editor values SHALL mean use the defaults `view` and `vim`.

#### Scenario: Configure viewer and editor
- **WHEN** the user changes the viewer, editor, or default file click action
- **THEN** the setting SHALL apply to subsequent file actions
- **AND** the setting SHALL persist across application restarts

#### Scenario: Default file tool settings
- **WHEN** no file tool settings exist
- **THEN** the viewer SHALL default to `view`
- **AND** the editor SHALL default to `vim`
- **AND** the default file click action SHALL be Copy Abs. Path

#### Scenario: Invalid click action repairs
- **WHEN** a stored default file click action is not one of the supported actions
- **THEN** the application SHALL use Copy Abs. Path without crashing
