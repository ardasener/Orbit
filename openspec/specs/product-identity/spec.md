## Purpose

Defines Orbit's canonical product name, native bundle identifiers, icon assets, and Git repository identity.

## Requirements

### Requirement: Orbit product identity
The maintained application SHALL identify itself as `Orbit` in user-facing titles, product metadata, and documentation. Its machine-readable package and runtime namespaces SHALL use the lowercase `orbit` identity.

#### Scenario: Application identity is displayed
- **WHEN** the application or its packaged metadata is inspected
- **THEN** the product name SHALL be `Orbit`
- **AND** its maintained package/crate identity SHALL use `orbit`

#### Scenario: Native bundle identity is Orbit
- **WHEN** a production bundle is built
- **THEN** its identifier SHALL be `com.ardasener.orbit`

#### Scenario: Orbit-owned runtime namespaces are used
- **WHEN** Orbit persists settings or creates managed worktree cache entries
- **THEN** it SHALL use Orbit-owned namespace names
- **AND** it SHALL NOT read or migrate Overlook state

### Requirement: Orbit desktop platform icons
The application SHALL package only curated desktop platform icons. macOS SHALL use the approved macOS `.icns` source, and Windows/Linux assets SHALL derive from the approved non-maskable web icon source.

#### Scenario: Native desktop bundle uses Orbit icon assets
- **WHEN** a macOS, Windows, or Linux bundle is created
- **THEN** the bundle SHALL use the curated Orbit icon asset for its configured platform format

#### Scenario: Mobile and store assets are absent
- **WHEN** the Tauri icon directory is inspected
- **THEN** it SHALL NOT contain Android, iOS, or AppX/store icon assets

### Requirement: Orbit Git repository identity
The repository SHALL use `git@github.com:ardasener/Orbit.git` as its `origin` remote, and maintained repository/release links SHALL target `https://github.com/ardasener/Orbit`.

#### Scenario: Origin targets Orbit
- **WHEN** the repository's `origin` remote is inspected
- **THEN** its fetch and push URLs SHALL be `git@github.com:ardasener/Orbit.git`

#### Scenario: Published links target Orbit
- **WHEN** a maintained documentation or website repository/release link is followed
- **THEN** it SHALL target the Orbit GitHub repository or its releases
