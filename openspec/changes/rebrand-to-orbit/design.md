## Context

The repository currently identifies the product as Overlook across the native Tauri bundle, Rust and JavaScript package metadata, runtime persistence namespaces, app/site copy, platform icons, and the GitLab remote. The replacement GitHub repository is `ardasener/Orbit`; the public site will be a GitHub Pages project site under the lowercase `/orbit/` path.

The application is pre-release. Existing Overlook configuration, browser storage, and managed worktrees are intentionally disposable, so compatibility migrations would preserve the wrong identity and are out of scope.

## Goals / Non-Goals

**Goals:**

- Present Orbit consistently in native bundles, runtime UI, public site, metadata, documentation, and source-owned namespaces.
- Use `com.ardasener.orbit` for production and `com.ardasener.orbit.dev` for development isolation.
- Package curated desktop icons for macOS, Windows, and Linux without adding mobile or store icon assets.
- Move Git origin and all maintained GitHub/release links to `ardasener/Orbit`.
- Reset state by removing Overlook migrations and renaming Orbit-owned storage/cache namespaces.

**Non-Goals:**

- Migrating Overlook projects, wallpapers, settings, webview state, cache entries, or worktrees.
- Renaming archived OpenSpec changes or altering their historical content.
- Renaming the local checkout directory as part of this Git remote/product identity change.
- Changing product behavior beyond state reset caused by the new namespaces.

## Decisions

### Use Orbit as the canonical product identity

Replace maintained user-facing and build-time `Overlook`/`overlook` product references with `Orbit`/`orbit`. This includes Cargo package and library names, npm package names, generated lockfile package identities, temporary test labels, local-storage keys, cache directory/prefixes, app titles, documentation, and public-site content. Historical archive files are excluded because they document prior decisions.

### Reset state instead of migrating it

Set the production Tauri identifier to `com.ardasener.orbit` and the dev override to `com.ardasener.orbit.dev`. Remove the legacy Overlook projects-file migration and rename Orbit-owned local-storage/cache namespaces. This provides an intentional clean pre-release state and preserves dev/prod isolation. Retaining migration would contradict the requested reset and reintroduce stale Overlook state.

### Package only curated desktop icon assets

Use the supplied macOS `AppIcon.icns` directly so the native icon retains its curated composition. Create Linux PNG and Windows ICO assets from the supplied non-maskable web icon; the ICO shall include 16, 24, 32, 48, 64, and 256px layers. Remove the Tauri-generated Android, iOS, AppX, and unused icon assets because Orbit targets desktop platforms only. The website uses the non-maskable web icon and its supplied favicon.

### Move public identity to GitHub and lowercase Pages path

Change `origin` to `git@github.com:ardasener/Orbit.git`. Update site package metadata, branding copy, icon asset, release/repository URLs, and Astro `base` to `/orbit/`, yielding `https://ardasener.github.io/orbit/`. GitHub Pages paths are treated separately from display capitalization, so the page path remains lowercase while the app is displayed as Orbit.

## Risks / Trade-offs

- [Existing users lose Overlook state] → Intentional pre-release reset; no migration code remains.
- [Desktop icon compositions differ by platform] → Use the curated macOS asset directly and derive Windows/Linux assets from the non-maskable web artwork.
- [A maintained Overlook reference is missed] → Search non-archived source, configuration, docs, workflows, and site files before verification.
- [The GitHub Pages project site is not configured] → The workflow remains responsible for deployment; manually verify after the first push to the new repository.

## Migration Plan

1. Update repository remote, metadata, native identifiers, namespaces, source references, site links/path, and icon assets.
2. Build and test the app/site under the Orbit identity.
3. Push `main` to `git@github.com:ardasener/Orbit.git`; configure GitHub Pages for the new repository if needed.
4. Rollback requires restoring the previous Git remote and source identity; no state conversion is attempted.

## Open Questions

None.
