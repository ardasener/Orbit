## Why

The product is being renamed from Overlook to Orbit before public release. The app, its native bundle identity, public site, icons, and Git repository must present one coherent Orbit identity without preserving pre-release Overlook state.

## What Changes

- Rebrand all maintained application, package, Rust crate, documentation, and website identity from Overlook to Orbit.
- **BREAKING** Change the production bundle identifier to `com.ardasener.orbit` and the isolated development identifier to `com.ardasener.orbit.dev`; do not migrate Overlook configuration, local storage, or managed-worktree cache state.
- Replace Tauri-generated mobile and store icon assets with a desktop-only icon set: the supplied curated macOS `.icns` asset and desktop images derived from the supplied non-maskable web icon.
- Point the Git remote, release links, and GitHub Pages site to `ardasener/Orbit`, with the public site hosted at `/orbit/`.
- Update maintained source references and canonical specs while retaining archived OpenSpec changes as historical records.

## Capabilities

### New Capabilities

- `product-identity`: Defines the canonical Orbit product name, native bundle identifiers, icon set, and repository identity.

### Modified Capabilities

- `dev-config-isolation`: Development and production identifiers, config locations, and reset semantics change for Orbit.
- `workspace-management`: Project persistence no longer migrates legacy Overlook configuration.
- `worktree-deletion`: Managed worktree path validation moves to Orbit's cache prefix.
- `project-website`: The public site name, icon, repository/release links, and GitHub Pages base path change to Orbit.

## Impact

Tauri configuration, Cargo/package metadata and lockfiles, Rust crate references, persistence/cache/local-storage namespaces, icon assets, application and website copy, GitHub Pages configuration, release/repository URLs, developer documentation, tests, and Git remote configuration will change. Curated desktop assets will replace the Tauri-generated icon set.
