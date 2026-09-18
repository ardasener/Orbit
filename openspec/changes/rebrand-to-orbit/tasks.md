## 1. Native and repository identity

- [x] 1.1 Change the production and dev Tauri product names, window titles, and identifiers to Orbit / `com.ardasener.orbit` / `com.ardasener.orbit.dev`.
- [x] 1.2 Rename maintained npm and Cargo package/crate identities and references to Orbit's lowercase `orbit` namespace; regenerate affected lockfile metadata.
- [x] 1.3 Set Git `origin` fetch and push URLs to `git@github.com:ardasener/Orbit.git`.

## 2. Runtime reset and source namespaces

- [x] 2.1 Remove Overlook projects-file migration and its tests; make Orbit's identifier-based config directory authoritative.
- [x] 2.2 Rename maintained local-storage, cache/worktree, temporary-test, and source documentation namespaces from Overlook to Orbit without preserving old state.
- [x] 2.3 Update application HTML metadata, developer documentation, and maintained source copy to display Orbit consistently.

## 3. Icons and public site

- [x] 3.1 Replace Tauri-generated icon assets with the curated macOS `.icns`, Windows/Linux desktop assets derived from the non-maskable web icon, and supplied website icons.
- [x] 3.2 Update site package metadata, copy, image alt text, repository/release links, and Astro paths for Orbit.
- [x] 3.3 Configure the public site for lowercase `https://ardasener.github.io/orbit/` deployment and update site documentation accordingly.

## 4. Verification and specification sync

- [x] 4.1 Add or update tests for no legacy project migration and Orbit-owned worktree/config behavior.
- [x] 4.2 Search maintained files for stale Overlook identifiers, excluding OpenSpec archives and third-party/generated dependency data that does not encode project identity.
- [x] 4.3 Run app/site type checks, lint, tests, builds, Tauri platform build check, Rust formatting/clippy/tests, and inspect the remote/icon outputs.
- [x] 4.4 Synchronize completed delta specs into `openspec/specs/` before manual review.
- [ ] 4.5 Manually verify the Orbit app title/icon, clean dev/prod state separation, and the deployed `/orbit/` site after pushing to GitHub.
