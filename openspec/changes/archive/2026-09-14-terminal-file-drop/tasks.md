## 1. Shell-safe path formatting

- [x] 1.1 Add a focused POSIX path-quoting helper that preserves each dropped path as one shell argument, including embedded single quotes and control characters.
- [x] 1.2 Add unit tests for ordinary paths, spaces, shell metacharacters, embedded single quotes, newlines, and multiple-path joining.

## 2. Native terminal drop integration

- [x] 2.1 Subscribe each `TerminalHost` to Tauri's native webview drag-drop event and clean up the listener when the host unmounts.
- [x] 2.2 Hit-test native drop coordinates against the host's visible terminal container, including the platform/display scale conversion required by the Tauri payload.
- [x] 2.3 Paste all dropped paths, joined by spaces, through xterm's `terminal.paste()` API without appending Enter or bypassing the existing PTY input handler.
- [x] 2.4 Ignore drops outside terminal bounds and on hidden hosts while leaving pointer-based tab dragging unchanged.

## 3. Verification

- [x] 3.1 Run frontend type checks, lint, unit tests, and production build; run Rust checks to confirm no backend or capability changes are required.
- [x] 3.2 Manually verify single and multiple Finder file/folder drops, paths containing spaces, drops into multiple panes, ignored drops outside terminals, and existing tab dragging.
- [x] 3.3 Synchronize the completed terminal-session delta into `openspec/specs/` before manual review.
