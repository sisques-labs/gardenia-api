## ADDED Requirements

### Requirement: QEMU emulation step is registered before buildx
The CI smoke build workflow (`docker.yml`) MUST include a `docker/setup-qemu-action@v3` step that
runs **before** `docker/setup-buildx-action@v3`. This step registers binfmt handlers so that
Docker Buildx can build `linux/arm64` layers on the `ubuntu-latest` (amd64) runner via QEMU
emulation. Omitting this step or placing it after buildx SHALL cause the `arm64` build to fail.

#### Scenario: QEMU step present and ordered before buildx
- **GIVEN** the smoke build job definition in `.github/workflows/docker.yml`
- **WHEN** the workflow steps are listed in order
- **THEN** a step using `docker/setup-qemu-action@v3` appears before any step using `docker/setup-buildx-action@v3`

#### Scenario: Missing QEMU step causes arm64 build failure
- **GIVEN** a smoke build workflow that has no `docker/setup-qemu-action` step
- **WHEN** `docker/build-push-action` is invoked with `platforms: linux/amd64,linux/arm64`
- **THEN** the `arm64` platform layer fails with an unsupported platform error

### Requirement: Smoke build validates both linux/amd64 and linux/arm64 platforms
The `docker/build-push-action@v6` step in the smoke build job MUST specify
`platforms: linux/amd64,linux/arm64`, matching the platform matrix produced by the release
workflow. The build SHALL run on both `pull_request` and `push` to `main` triggers so that
architecture-specific failures are caught before merge, not at release time.

#### Scenario: Both platforms are built on a pull request
- **GIVEN** a pull request opened against the repository
- **WHEN** the Docker smoke build workflow is triggered
- **THEN** the build step executes platform layers for both `linux/amd64` and `linux/arm64`
- **AND** the workflow fails if either platform layer fails to build

#### Scenario: Both platforms are built on push to main
- **GIVEN** a commit pushed to the `main` branch
- **WHEN** the Docker smoke build workflow is triggered
- **THEN** the build step executes platform layers for both `linux/amd64` and `linux/arm64`
- **AND** the workflow fails if either platform layer fails to build

#### Scenario: Platform matrix matches the release workflow
- **GIVEN** `.github/workflows/docker.yml` and `.github/workflows/release.yml`
- **WHEN** the `platforms` value in each workflow is compared
- **THEN** both specify `linux/amd64` and `linux/arm64` (order MAY differ, set equality applies)

### Requirement: Smoke build remains push-less and load-less
The smoke build SHALL NOT push images to any registry and SHALL NOT load images into the Docker
daemon. The `docker/build-push-action@v6` step MUST have `push: false` and `load: false`.
The purpose of the smoke build is validation only; publishing is the exclusive responsibility
of the release workflow.

#### Scenario: Successful smoke build does not push to registry
- **GIVEN** a smoke build that completes without errors on both platforms
- **WHEN** the workflow run finishes
- **THEN** no image digest is pushed to any container registry
- **AND** the workflow log does not contain a registry push operation

#### Scenario: Smoke build does not load image into Docker daemon
- **GIVEN** the smoke build workflow
- **WHEN** the build step runs with multi-platform targets
- **THEN** `load: false` is set on the build step (multi-platform builds cannot use `load: true`)
- **AND** no image is available in the local Docker daemon after the step

### Requirement: GHA layer cache is retained for multi-platform builds
The smoke build MUST retain `cache-from: type=gha` and `cache-to: type=gha,mode=max` on the
build step so that previously built layers are reused per platform on subsequent runs. This
mitigates the CI time increase caused by emulated `arm64` compilation (e.g. native addons
such as `bcrypt`) after the initial cache-warming run.

#### Scenario: Cache is populated after first multi-platform run
- **GIVEN** the first smoke build run after the multi-platform change is merged
- **WHEN** the build completes for both `linux/amd64` and `linux/arm64`
- **THEN** GHA cache entries are written for both platform layers with `mode=max`

#### Scenario: Subsequent runs reuse cached layers
- **GIVEN** a smoke build run that follows a completed cache-warming run
- **WHEN** the build step starts
- **THEN** the `cache-from: type=gha` directive causes previously built layers to be restored
- **AND** total build time is reduced compared to the first (cold) run
