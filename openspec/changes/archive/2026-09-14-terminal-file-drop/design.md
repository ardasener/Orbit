## Context

Overlook renders live `@xterm/xterm` terminals inside React `TerminalHost` components. Keyboard and paste input already flows through xterm's `onData` event into the Rust PTY command, while the repository explicitly avoids HTML5 drag-and-drop because WKWebView does not reliably deliver custom `dataTransfer` drops.

Tauri 2 exposes native file drag-and-drop events through the current webview. The event includes absolute dropped paths and the native pointer position, so the renderer can target the correct visible terminal without granting the webview filesystem access or adding a Rust command.

## Goals / Non-Goals

**Goals:**

- Insert every dropped file or directory path into the terminal, separated by spaces.
- Make each path safe as one POSIX shell argument, including spaces, quotes, shell metacharacters, and newlines.
- Route inserted text through xterm's paste API and the existing PTY input path.
- Target only the visible terminal under the native drop position.
- Preserve existing pointer-based tab dragging and terminal focus behavior.
- Unit-test path quoting and drop-target decisions without requiring a GUI test harness.

**Non-Goals:**

- Supporting HTML5 `DragEvent`/`DataTransfer` file handling.
- Copying file contents or uploading files to the PTY.
- Automatically executing a command after inserting paths.
- Adding Windows/PowerShell-specific quoting while Windows support remains deferred.
- Adding a drag-over overlay or other visual treatment in this change.

## Decisions

### Use Tauri native drop events

Subscribe to `getCurrentWebview().onDragDropEvent` from each mounted terminal host. Native events work around WKWebView's broken custom `dataTransfer` delivery and provide host-resolved paths. A per-host subscription keeps terminal ownership local and avoids a global registry of terminal instances; each handler ignores events when its host is hidden or its bounds do not contain the drop point.

### Hit-test native coordinates against the terminal container

Use the host's `getBoundingClientRect()` and the event's desktop-relative physical position to determine the target terminal. Query the current window's client-area origin with `innerPosition()`, subtract it from the event position, then convert the result to CSS pixels using the webview scale factor. Treat boundary points consistently as inside. Do not use `document.elementFromPoint` as the sole mechanism because native drop events are not DOM drop events.

### Use xterm's paste API

Call `terminal.paste(insertedPaths)` rather than writing directly to the PTY. This preserves xterm's terminal input semantics, including bracketed paste wrapping and the existing `onData` subscription. The PTY remains the only process boundary.

### Quote paths as POSIX shell arguments

Format each native path as a single-quoted POSIX shell word, replacing each embedded single quote with the standard shell sequence `\\'` (close quote, backslash-quote, reopen quote). Join formatted paths with one ASCII space and do not append Enter. This matches iTerm's multi-path insertion behavior while preventing spaces and shell metacharacters from changing command structure.

### Keep the feature frontend-only

The native drop payload already contains absolute paths. No filesystem reads, path canonicalization, or new Tauri command is needed, preserving the Rust-owned OS boundary and minimizing permissions/capability changes.

## Risks / Trade-offs

- [Native event coordinates differ by display scale] → Normalize against the webview's reported scale factor and cover target selection with boundary/scale tests where practical.
- [A dropped path contains unusual POSIX characters] → Use tested single-quote escaping rather than ad hoc backslash replacement.
- [Multiple mounted terminal hosts receive the same native event] → Require visibility and bounds containment so only one host pastes the paths.
- [A terminal is running a full-screen application] → The input is intentionally treated as normal terminal paste; the application decides how to handle it.
- [Tauri or xterm APIs change] → Pin usage to the installed Tauri 2 and xterm 6 APIs and verify with type checks/builds.

## Migration Plan

No persisted data or backend protocol changes are required. Ship the frontend listener and helper, then verify manually by dragging single and multiple files from Finder into separate terminal panes. Removing the listener and helper fully rolls the feature back.

## Open Questions

None for this scoped macOS/POSIX implementation.
