# Proposal: Docker Multi-Platform Smoke Build

## Intent

The release pipeline (`.github/workflows/release.yml`) already builds and publishes `linux/amd64,linux/arm64` images via the reusable `sisques-labs/workflows` workflow, but the PR/main smoke build (`.github/workflows/docker.yml`) only builds `linux/amd64`. This leaves `arm64` build failures (e.g. native deps like `bcrypt` failing under the arm64 toolchain) undetected until release time — the most expensive moment to discover them. We need the smoke build to validate the **same** platform matrix that release ships, so CI fails fast on any architecture-specific breakage.

## Scope

### In Scope
- Update `.github/workflows/docker.yml` to build `linux/amd64,linux/arm64` in the existing smoke job
- Add `docker/setup-qemu-action@v3` before buildx to enable `arm64` emulation
- Keep the smoke build push-less (`push: false`, `load: false`) — validation only

### Out of Scope
- Any `Dockerfile` changes (base images already support `arm64`; none required)
- Changes to `.github/workflows/release.yml` (already multi-platform)
- Changes to `.github/workflows/ci.yml` (does not build Docker)
- Pushing/loading multi-platform images in CI, registry publishing, or attestations
- Replacing `bcrypt` or otherwise optimizing the native arm64 compile

## Capabilities

### New Capabilities
- None (no application capability; this is CI/build infrastructure)

### Modified Capabilities
- None

## Approach

- **Full multi-platform in the existing smoke job (default, recommended)**: build `linux/amd64,linux/arm64` on both `pull_request` and `push` to `main`. This aligns CI validation exactly with the release platform matrix, so an `arm64`-only failure is caught on the PR rather than at release. Accepted trade-off: longer CI runs.
- **QEMU is required for arm64 emulation**: `docker/setup-qemu-action@v3` registers binfmt handlers so buildx can build the `arm64` layer on an `amd64` runner. It MUST run **before** `docker/setup-buildx-action@v3`.
- **No Dockerfile change**: the multi-stage Node 22 build already uses multi-arch base images; `arm64` builds without modification. `bcrypt` compiles its native addon under emulation (slower, but functional).
- **Keep GHA cache**: retain `cache-from`/`cache-to: type=gha,mode=max` so subsequent multi-platform runs reuse cached layers per platform.

### Alternative (not chosen)
Build `arm64` only on `push` to `main`, leaving PRs at `amd64` only, to save PR CI minutes. Rejected as default because it weakens PR coverage — an arm64 break would merge green and only fail post-merge. Can be revisited if PR CI time becomes a bottleneck.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `.github/workflows/docker.yml` | Modified | Add `docker/setup-qemu-action@v3` step; set `platforms: linux/amd64,linux/arm64` |
| `.github/workflows/release.yml` | None | Already passes `platforms: linux/amd64,linux/arm64` — referenced for parity only |
| `Dockerfile` | None | Multi-arch base images; no change required |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| CI time increases +5–15 min on PRs and `main` (emulated arm64, bcrypt native compile) | High | Accepted trade-off; `type=gha` cache warms after first run; alternative (arm64 on main only) documented if time becomes blocking |
| First multi-platform run pays full uncached cost while GHA cache warms for the new arm64 platform | High | One-time cost; `mode=max` cache reuse on subsequent runs |
| QEMU step omitted or ordered after buildx → arm64 build fails | Low | Spec/tasks MUST place `setup-qemu-action@v3` before `setup-buildx-action@v3` |
| Future native dependency fails under arm64 emulation | Low | This change is the mechanism that surfaces such failures in CI rather than at release |

## Rollback Plan

Revert `.github/workflows/docker.yml` to `platforms: linux/amd64` and remove the `docker/setup-qemu-action@v3` step. Self-contained — single workflow file, no application code, no migrations, no shared-state changes. Release workflow is unaffected throughout.

## Dependencies

- `docker/setup-qemu-action@v3` (GitHub Action, new step)
- `docker/setup-buildx-action@v3` (already present)
- `docker/build-push-action@v6` (already present)

## Success Criteria

- [ ] `docker.yml` smoke build runs `docker/setup-qemu-action@v3` before buildx
- [ ] `docker.yml` builds `platforms: linux/amd64,linux/arm64`
- [ ] Smoke build remains push-less (`push: false`, `load: false`)
- [ ] CI passes on a PR (both architectures build successfully)
- [ ] No `Dockerfile` changes required
- [ ] Smoke build matrix matches the release workflow's platform matrix
