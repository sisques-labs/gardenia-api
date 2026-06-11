# Proposal: CI Versioning Strategy — Tags as Source of Truth

## Intent

The `release-train` CI commits version bumps (`package.json` + `CHANGELOG.md`) to **every** triggering branch, including `develop`. When `staging` gets a beta bump, its `package.json` diverges from `develop`'s alpha version, so **every** subsequent `develop → staging` PR conflicts on those files. CHANGELOG history shows recurring manual recovery commits ("Fix version back to alpha", "Merge staging into develop to align histories"). Root cause: committing version files to `develop`. Fix: make **git tags the source of truth** for version on `develop` and `staging`; stop committing version files on `develop`.

## Scope

### In Scope
- `gardenia-api/package.json` → set `"version": "0.0.0-dev"` (frozen sentinel on `develop`/`staging`).
- `sisques-labs/workflows` shared repo:
  - `release-train-detect/detect.sh` → derive `CURRENT` from git tags, not `package.json`.
  - `docker-release.yml` → skip the package.json/CHANGELOG commit+push on `develop`; still create the tag.

### Out of Scope
- CHANGELOG on `staging` (keep beta release notes as-is).
- Migrating to semantic-release / changesets.
- Changing the branch strategy.
- Repairing existing diverged git history.

## Capabilities

### New Capabilities
- `ci-versioning`: how the release-train derives, tags, and commits versions per branch channel (tags-only for develop/staging, committed for main).

### Modified Capabilities
- None (no existing `ci-versioning` spec).

## Approach

Version lives in **git tags only** for `develop` and `staging`; only `main` commits version files.

1. **`detect.sh` — read from tags.** Replace `CURRENT=$(node -p "require('./package.json').version")` with tag-derived lookup, leveraging existing `find_last_channel_tag()`: develop → latest `v*-alpha.*`; staging → latest `v*-beta.*`/`v*-alpha.*`; main → latest `v*-beta.*`. Fallback to last stable tag or `0.0.0`.
2. **`docker-release.yml` — conditional commit.** Gate the "commit version bump" step to `staging`/`main` only. On `develop`: create the git tag, skip commit+push of package.json/CHANGELOG. `bump.sh` (`--no-git-tag-version`) is unchanged.
3. **`package.json` — sentinel.** Set `0.0.0-dev` once on `develop`; `staging` inherits it via merges and never overwrites it.

End state: `develop`/`staging` = `0.0.0-dev` (frozen) → `develop → staging` PRs conflict-free forever; `main` updated only on graduate.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `gardenia-api/package.json` | Modified | Version set to `0.0.0-dev` sentinel |
| `workflows/release-train-detect/detect.sh` | Modified | Read CURRENT from git tags |
| `workflows/docker-release.yml` | Modified | Skip package.json/CHANGELOG commit on develop |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Tag-derived version wrong if no tag exists | Med | Fallback chain: last stable tag → `0.0.0` |
| Changes live in shared `workflows` repo (affects other consumers) | Med | Branch-conditional logic; validate on a test branch before merge |
| `staging → main` conflict each stable cycle (`0.0.0-dev` vs `0.16.0`) | Low | Documented: keep staging value, CI uses tags for stable version |

## Rollback Plan

Revert the `detect.sh` and `docker-release.yml` commits in `workflows`, and restore `package.json` version to the last real value. Tags are non-destructive; no data loss.

## Dependencies

- Merge access to `sisques-labs/workflows` shared repo.
- Existing `find_last_channel_tag()` helper in `detect.sh`.

## Success Criteria

- [x] `detect.sh` derives `CURRENT` from git tags on all three branches.
- [x] `docker-release.yml` creates a tag but does NOT commit version files on `develop`.
- [x] `package.json` on develop/staging stays `0.0.0-dev` across release cycles.
- [x] A `develop → staging` PR after a beta release has zero version-file conflicts.
