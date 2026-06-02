# Exploration: docker-multi-platform

## Current State

Two GitHub Actions workflows touch Docker:

- **`.github/workflows/docker.yml`** — "Smoke build (buildx, no push)" on `pull_request` and `push` to `main`. It runs `docker/setup-buildx-action@v3` then `docker/build-push-action@v6` with `platforms: linux/amd64` only (single architecture). There is **no** `docker/setup-qemu-action`, so cross-compilation/emulation is not available.
- **`.github/workflows/release.yml`** — Delegates to the reusable workflow `sisques-labs/workflows/.github/workflows/docker-release.yml@main` and already passes `platforms: linux/amd64,linux/arm64`. So released images are multi-arch, but the PR/main smoke build only validates `amd64`.

`.github/workflows/ci.yml` does not build Docker images (lint/test/etc. only).

## Gap

The release pipeline produces `linux/amd64,linux/arm64` images, but the smoke build that gates every PR and `main` push only exercises `linux/amd64`. An `arm64`-specific build failure (e.g. a native dependency that fails to compile under the arm64 toolchain) would pass CI and only surface at release time — exactly when it is most expensive to discover.

## Dockerfile Assessment

Multi-stage build on Node 22. No `Dockerfile` changes are required to support `arm64`:

- The base images are multi-arch (`node:22` family supports `linux/arm64`).
- Notable native dependency: **bcrypt**, which compiles a native addon. Under multi-platform buildx the `arm64` layer is built via QEMU emulation — functional but slower than native.

## Recommended Approach

Update **`.github/workflows/docker.yml`** to match the release platform matrix:

1. Add `docker/setup-qemu-action@v3` **before** `docker/setup-buildx-action@v3` (registers binfmt handlers so buildx can emulate `arm64`).
2. Change `platforms: linux/amd64` → `platforms: linux/amd64,linux/arm64`.

This aligns CI validation with what release actually ships, with no `Dockerfile` changes.

### Alternative considered

Run the `arm64` build only on `push` to `main` (not on PRs) to save PR CI minutes. Rejected as the default because it weakens PR coverage — an arm64 break would still merge green and only fail post-merge.

## Risks

- **CI time**: emulated `arm64` build (notably bcrypt's native compile under QEMU) adds roughly **+5–15 min** per run, on PRs and `main`.
- **GHA cache**: the `type=gha` cache must warm for the new `arm64` platform on the first multi-platform run; that first run sees the full cost before caching helps subsequent runs.
