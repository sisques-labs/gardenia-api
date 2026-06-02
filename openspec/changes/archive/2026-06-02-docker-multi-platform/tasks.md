## 1. Workflow Edit

- [x] 1.1 Insert `docker/setup-qemu-action@v3` step between `actions/checkout@v4` and `docker/setup-buildx-action@v3` in `.github/workflows/docker.yml`
- [x] 1.2 Change `platforms: linux/amd64` to `platforms: linux/amd64,linux/arm64` in the `Build image` step of `.github/workflows/docker.yml`

## 2. Verification

- [x] 2.1 Confirm step order in `docker.yml`: checkout → setup-qemu → setup-buildx → build-push
- [x] 2.2 Confirm `push: false` and `load: false` remain unchanged on the build step
- [x] 2.3 Confirm `cache-from: type=gha` and `cache-to: type=gha,mode=max` remain unchanged on the build step
- [ ] 2.4 Open a PR and verify the smoke build workflow runs successfully for both `linux/amd64` and `linux/arm64` platforms
