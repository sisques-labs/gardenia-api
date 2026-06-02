## Archive Report
**Change**: docker-multi-platform  
**Archived on**: 2026-06-02  
**Artifact store**: openspec  
**Verification verdict**: PASS WITH WARNINGS

## What was archived
This change updates the CI Docker smoke build workflow (`.github/workflows/docker.yml`) to validate
the same platform matrix shipped by the release workflow (`linux/amd64,linux/arm64`) by:

- Adding a `docker/setup-qemu-action@v3` step (required for arm64 emulation on amd64 runners)
- Updating the build step to `platforms: linux/amd64,linux/arm64`
- Preserving validation-only behavior (`push: false`, `load: false`)
- Preserving GitHub Actions layer cache (`cache-from: type=gha`, `cache-to: type=gha,mode=max`)

## Specs synced to source of truth
### Domain: `ci-docker-smoke-build`
- **Action**: Created main spec
- **From**: `openspec/changes/docker-multi-platform/specs/ci-docker-smoke-build/spec.md`
- **To**: `openspec/specs/ci-docker-smoke-build/spec.md`
- **Merge note**: No existing main spec was present; the delta spec was promoted as the initial main spec.

## Task closure status
From `openspec/changes/docker-multi-platform/tasks.md`:
- **Total**: 6
- **Complete**: 5
- **Incomplete**: 1

Incomplete item:
- **2.4** Open a PR and verify the smoke build workflow runs successfully for both `linux/amd64` and `linux/arm64` platforms.

## Verification summary (key points)
Source: `openspec/changes/docker-multi-platform/verify-report.md`

- **Static/config evidence**: Implemented and consistent with proposal/design.
- **Runtime evidence (CI execution)**: Not executed; therefore several scenarios are PARTIAL/UNTESTED.

### Open validation items (must be completed outside this archive step)
- Confirm on GitHub Actions that the `docker.yml` smoke build succeeds for both platforms on:
  - `pull_request`
  - `push` to `main`
- Confirm runtime behavior expectations via logs/behavior (not just config):
  - No registry push occurs
  - No local docker image load occurs
- Confirm GHA cache warming and reuse on subsequent multi-platform runs.

## Archive location
This change folder is archived to:
`openspec/changes/archive/2026-06-02-docker-multi-platform/`
