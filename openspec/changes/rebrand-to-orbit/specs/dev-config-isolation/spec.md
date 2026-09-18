## MODIFIED Requirements

### Requirement: Dev builds use an isolated config identity
Development builds SHALL run with the distinct bundle identifier `com.ardasener.orbit.dev` so their configuration, wallpaper, and webview data are stored separately from the installed Orbit application.

#### Scenario: Dev identifier differs from prod
- **WHEN** the app is launched via the dev script (`bun run tauri:dev`)
- **THEN** the bundle identifier SHALL be `com.ardasener.orbit.dev` and the config directory SHALL resolve under that identifier (e.g. `~/Library/Application Support/com.ardasener.orbit.dev`)

#### Scenario: Installed app keeps the prod identifier
- **WHEN** the app is built and installed for release
- **THEN** the bundle identifier SHALL be `com.ardasener.orbit` and its config directory SHALL resolve under `~/Library/Application Support/com.ardasener.orbit`

#### Scenario: Dev and prod state do not collide
- **WHEN** both a dev build and the installed app run on the same machine
- **THEN** tracked projects and wallpaper SHALL be read and written to separate directories per identifier, so each build keeps its own state

### Requirement: Dev launch command
The project SHALL provide a single documented command that launches the dev build with the Orbit dev identifier applied.

#### Scenario: Dev script exists
- **WHEN** the developer runs `bun run tauri:dev`
- **THEN** `tauri dev` SHALL be invoked with `--config src-tauri/tauri.dev.conf.json`

#### Scenario: Dev config file exists
- **WHEN** the repository is inspected
- **THEN** a `src-tauri/tauri.dev.conf.json` SHALL exist that merges `identifier` = `com.ardasener.orbit.dev` over the base configuration
