## Context

Overlook currently stores one tab list per worktree and a three-entry slot array that identifies which tabs are visible in the panes. Tabs not assigned to a slot are parked in the shared tab bar. `SplitLayout` keeps all terminal hosts mounted so PTY sessions survive tab switches and pane changes, while `TerminalTabBar` renders the shared Ant Design `Tag` strip and owns tab drag initiation.

The new model makes each fixed pane an independent tab workspace. The top bar remains global chrome, but tabs move into the pane that owns them. The implementation must preserve the Rust/webview boundary, the existing pointer-based drag approach required by WKWebView, and live terminal hosts across pane visibility changes.

## Goals / Non-Goals

**Goals:**

- Give each initialized pane its own ordered tabs and active tab.
- Preserve pane state and PTY sessions while a split is toggled off and on.
- Render each pane's tabs with Ant Design `Tabs`, including close and add controls.
- Support local tab reordering and cross-pane tab moves through pointer dragging.
- Use neutral tab-bar surfaces to distinguish focused and inactive panes without slot accent colors.
- Keep global top-bar actions and route tab creation to the focused pane.
- Keep the existing empty-pane placeholder behavior.

**Non-Goals:**

- Persisting pane layouts or tabs across application restarts.
- Automatically redistributing tabs between panes when splits change.
- Distributing runnable commands across multiple panes.
- Floating panes, user-created pane locations, or arbitrary dock layouts.
- Replacing the existing pointer drag implementation with HTML5 drag-and-drop.
- Adding pane resizing or new split geometries.

## Decisions

### Pane state is independent and persistent while the worktree is alive

Replace the flat active layout shape with three fixed pane records. Pane 0 is initialized with the worktree's first shell. Panes 1 and 2 start as `null`, meaning they have never been created. When a split is enabled for the first time, its pane record is created with one new shell. Disabling the split hides the pane but does not discard its record. Re-enabling it reveals the same tabs, active tab, ordering, and mounted PTY sessions.

An initialized pane may contain zero tabs after closing or moving its last tab. It remains initialized and renders the existing terminal placeholder rather than creating a replacement shell automatically.

```ts
interface PaneState {
  tabs: TerminalTab[];
  activeTabId: string | null;
}

interface WorktreeLayout {
  panes: [PaneState, PaneState | null, PaneState | null];
  focusedPane: number;
  vertical: boolean;
  bottom: boolean;
}
```

This is preferred over retaining a global tab list plus parked tabs because ownership, ordering, and active selection are all pane-local concepts in the new UI.

### Ant Design Tabs provide the pane tab bars

Each visible initialized pane renders a controlled Ant Design `Tabs` component using `type="editable-card"`. The pane supplies `activeKey`, ordered `items`, `onChange`, and `onEdit`. The `+` control creates a tab in that pane. The global top-bar New Terminal action calls the same pane-targeted creation action for the focused pane.

Inactive tab contents must remain mounted or otherwise preserve the existing host lifetime guarantees. Terminal host visibility remains controlled by the layout renderer rather than allowing tab switching to destroy PTY-backed hosts.

### Pointer drag handles both reorder and move

The current global pointer drag state remains the foundation. Dragging within a pane tab bar calculates a destination index and reorders the pane's tab array. Dragging onto another pane's tab bar inserts at the position under the pointer; dropping on the pane body appends. In either case the moved tab becomes active in the destination pane and the destination pane becomes focused.

The drag state records the source pane and destination pane/index. Native HTML5 drag events are not introduced because WKWebView does not reliably deliver custom `dataTransfer` events.

### Pane focus is represented by neutral tab-bar brightness

Remove slot accent colors from panel borders and tab labels. All pane tab bars use the same neutral theme surfaces. The focused pane uses the normal/brighter tab-bar surface, while visible inactive panes use a dimmed variant. Clicking terminal content, a pane tab, a pane add control, or completing a tab move focuses that pane.

### Actions target the focused pane

New tabs, runnable launches, close-tab shortcuts, and next/previous-tab shortcuts operate on the focused pane. A multi-command runnable creates all command tabs in the focused pane in command order; it does not distribute commands to other panes. Closing the active tab selects a deterministic remaining tab in that pane, or leaves the pane empty if none remain.

### Rendering keeps terminal hosts alive

`SplitLayout` will render pane containers for the fixed slots and render each pane's terminal hosts keyed by tab ID. A tab is visible only when it is the active tab of a visible pane. Non-active tabs remain mounted but hidden, preserving xterm state and PTY sessions. Tabs moved between panes retain their tab ID and host identity.

## Risks / Trade-offs

- [Ant Design Tabs may normally manage tab content visibility] → Keep host rendering under `SplitLayout`/pane components and use controlled tab headers for selection; verify inactive terminal hosts are not unmounted.
- [Pointer hit-testing may confuse tab insertion and pane-body drops] → Add explicit pane/tab-bar data attributes and calculate insertion indexes from tab element bounds; retain pane-body append as the fallback.
- [A pane can be hidden while retaining live processes] → Preserve the current session-lifetime behavior and only close a PTY when its tab is explicitly closed or a runnable exits.
- [The global top-bar tab strip disappears, changing keyboard and visual expectations] → Keep all global actions, route them through focused-pane APIs, and add focused/inactive tab-bar styling plus focused-pane interaction tests.
- [Existing specs describe parked tabs and slot accent colors] → Update the affected canonical requirements through this change's delta specs before archiving.

## Migration Plan

This is an in-memory session model change with no persisted tab-layout migration. Replace the layout state and consumers together, update the canonical OpenSpec requirements after verification, and remove obsolete shared-tab-strip styling. Existing project/worktree persistence is unaffected. If implementation must be rolled back, restore the previous layout context and shared tab-bar renderer; no on-disk data conversion is required.
