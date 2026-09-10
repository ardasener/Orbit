## Why

The current global tab strip makes panes feel like views into one shared terminal pool, which weakens the fixed-pane workspace model. Moving tab ownership into each pane will make pane state independent, preserve each pane's sessions when splits are toggled, and provide a layout closer to an editor or game-engine workspace.

## What Changes

- **BREAKING** Replace the single worktree-wide tab strip with an independently controlled tab bar in each pane.
- Give every initialized pane its own tab collection, active tab, and tab order.
- Preserve pane tab state and live PTY sessions when a split is hidden and shown again.
- Create a shell only the first time a split pane is initialized; later toggles reuse its preserved state.
- Keep empty initialized panes visible with the existing terminal placeholder.
- Support tab creation from both the global top-bar action and each pane's local add control.
- Support reordering tabs within a pane and moving tabs across panes; moved tabs become active in the destination pane.
- Use standard neutral Ant Design tab styling; remove pane accent colors, colored tab effects, and accent-colored borders.
- Indicate pane focus through a brighter neutral tab-bar surface for the focused pane and a dimmer surface for inactive panes.
- Keep the global top bar and its non-tab actions; remove only the shared tabs from it.
- Launch all commands from a multi-command runnable into the focused pane for now, preserving command order.

## Capabilities

### New Capabilities


### Modified Capabilities

- `terminal-layout`: panes own tabs and retain their state across split visibility changes.
- `tag-tab-strip`: shared tags become pane-local Ant Design tab bars with local ordering and neutral focus styling.
- `tab-interactions`: tab movement, pane assignment, focus, and keyboard navigation become pane-local.
- `runnable-launcher`: multi-command launches place all resulting tabs in the focused pane.
- `keybindings`: tab navigation and new-tab actions target the focused pane's local tab set.

## Impact

The primary impact is in `TerminalLayoutContext`, `TerminalTabBar`, `SplitLayout`, terminal pane rendering, and related CSS. The frontend layout state and context actions will change, but the Rust PTY boundary and terminal session commands remain unchanged. Existing tab and split specs require synchronized updates, and focused layout behavior will need unit/integration coverage.
