## MODIFIED Requirements

### Requirement: Landing page
The website SHALL provide a landing page with the Orbit app identity, a features summary, and download links for all supported platforms.

#### Scenario: Hero shows the app identity
- **WHEN** the site is opened
- **THEN** the landing page SHALL show the Orbit app icon, the name `Orbit`, and a short tagline

#### Scenario: Download links for all platforms
- **WHEN** the landing page is shown
- **THEN** it SHALL link to the latest GitHub release for `ardasener/Orbit` for macOS, Linux, and Windows (a single link to the releases page is sufficient per platform)

#### Scenario: Features section
- **WHEN** the landing page is shown
- **THEN** it SHALL summarize the app's key features as static content

### Requirement: GitHub Pages deployment
The site SHALL be deployed to GitHub Pages at `ardasener.github.io/orbit/` automatically when the `main` branch is updated.

#### Scenario: Push to main deploys
- **WHEN** a change is pushed to `main`
- **THEN** the site SHALL be rebuilt and deployed to GitHub Pages

#### Scenario: Site served under /orbit/
- **WHEN** the deployed site is visited
- **THEN** it SHALL be available at `ardasener.github.io/orbit/`
