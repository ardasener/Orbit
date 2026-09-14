## Why

Terminal users commonly drag files and folders from the desktop or file browser into a terminal to insert their paths. Overlook currently lacks that native desktop interaction, making common shell workflows slower than iTerm and Terax.

## What Changes

- Accept native file and folder drops over visible terminal panes.
- Insert all dropped paths, separated by spaces, into the terminal as shell-safe text.
- Preserve the existing xterm-to-PTY input path and bracketed-paste behavior.
- Ignore drops outside terminal panes and on hidden terminal hosts.
- Leave Overlook's pointer-based tab drag-and-drop behavior unchanged.

## Capabilities

### New Capabilities

<!-- None: this modifies the existing terminal-session behavior. -->

### Modified Capabilities

- `terminal-session`: Native file drops insert shell-safe absolute paths into the targeted terminal.

## Impact

The frontend terminal host will subscribe to Tauri 2 native drag-drop events, hit-test the drop position against its terminal container, quote POSIX paths, and pass the resulting text through xterm's paste API. No new Rust command or dependency is expected. Tests will cover path quoting, multiple paths, target selection, and ignored drops.
