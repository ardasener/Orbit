## 1. Pane-local layout state

- [x] 1.1 Refactor `TerminalLayoutContext` worktree state from a shared tab list and slot assignments to three persistent pane records with ordered tabs and active tab IDs.
- [x] 1.2 Preserve uninitialized versus initialized empty panes so the first split creates one shell while later split toggles restore prior pane state without automatic tab movement.
- [x] 1.3 Update tab creation, closing, selection, focus, split toggles, runnable launch, tab renaming, and font zoom actions to target pane-owned tabs.
- [x] 1.4 Define deterministic active-tab fallback when a pane's active tab is closed or moved away, including the empty-pane case.
- [x] 1.5 Update keyboard shortcut integration so new, close, next, and previous tab actions operate within the focused pane.

## 2. Pane rendering and tab bars

- [x] 2.1 Refactor `SplitLayout` into fixed pane containers that render a pane-local Ant Design `Tabs` bar and preserve all terminal hosts by tab ID.
- [x] 2.2 Replace the shared `TerminalTabBar` tag strip with global-only chrome while retaining workspace, settings, cleanup, runnable, split, and window-control actions.
- [x] 2.3 Add pane-local Ant Design editable tabs with local add, close, active-selection, overflow, and active-tab auto-scroll behavior.
- [x] 2.4 Route the global New Terminal action and each pane's local add control through the focused/target pane creation API.
- [x] 2.5 Keep empty initialized pane tab bars visible and render the existing create-terminal placeholder below them.
- [x] 2.6 Apply neutral tab-bar surface styling, with a brighter focused pane and dimmer inactive panes; remove slot accent borders and per-tab accent styling.

## 3. Dragging and ordering

- [x] 3.1 Extend pointer drag state and hit-testing to identify source pane, destination pane, and tab insertion index without using HTML5 drag-and-drop.
- [x] 3.2 Implement same-pane tab reordering and preserve the reordered tab as active.
- [x] 3.3 Implement cross-pane insertion, pane-body append fallback, destination activation/focus, and source-pane empty placeholder behavior.
- [x] 3.4 Render insertion/drop feedback for pane tab bars and pane bodies while preserving window-wide text-selection suppression.

## 4. Terminal and runnable integration

- [x] 4.1 Update `TerminalHost` visibility and pane focus wiring so only the active tab in each visible pane is shown while inactive hosts remain mounted.
- [x] 4.2 Ensure tabs moved between panes retain their terminal host identity, xterm state, process-title polling, zoom, and PTY session.
- [x] 4.3 Update multi-command runnable launch behavior so all commands create ordered tabs in the focused pane, with the first active.
- [x] 4.4 Verify runnable close-on-exit removes the correct pane-owned tab without affecting other pane sessions.

## 5. Tests and verification

- [x] 5.1 Add unit tests for pane initialization, split hide/show preservation, empty initialized panes, focused-pane tab creation, closing, selection, and fallback activation.
- [x] 5.2 Add unit tests for same-pane reordering and cross-pane moves, including insertion indexes, append drops, focus updates, and source-pane emptiness.
- [x] 5.3 Add tests for focused-pane keyboard tab navigation and multi-command runnable placement.
- [x] 5.4 Add component/integration coverage for pane-local tab rendering, close/add behavior, overflow auto-scroll, neutral focus styling, and placeholder rendering where the existing test setup permits.
- [x] 5.5 Run `bun check-types`, `bun lint`, and `bun run test`; run the relevant Rust checks if terminal integration changes require them.
- [x] 5.6 Review and synchronize the canonical specs under `openspec/specs/` with the completed implementation before manual review.
