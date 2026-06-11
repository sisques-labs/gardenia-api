# Tasks: CI Versioning Strategy — Tags as Source of Truth

## Review Workload Forecast

| Metric | Value |
|--------|-------|
| Estimated changed lines | ~35–45 lines across 3 files |
| 400-line budget risk | Low |
| Chained PRs recommended | Yes — two repos, two separate PRs required |
| Decision needed before apply | No (delivery strategy: ask-on-risk; low risk confirmed) |

Two PRs required by repo boundary:
- PR 1: `sisques-labs/workflows` (Tasks A1 + A2)
- PR 2: `gardenia-api` (Task C1) — inert until PR 1 is merged and deployed

---

## Execution Order

```
A1 ──┐
     ├──► A2 (validate) ──► merge workflows PR ──► C1 ──► V1
A2 ──┘
```

A1 and A2 can be implemented together in the same branch/PR (they are in different files). C1 is independent but MUST be merged after the workflows PR is live.

---

## Task A1 — `detect.sh`: Add `derive_current()` and replace CURRENT derivation

**Repo**: `sisques-labs/workflows`
**File**: `.github/actions/release-train-detect/detect.sh`
**Spec requirement**: Version Detection from Git Tags

### Action

1. Remove line 5: `CURRENT=$(node -p "require('./package.json').version")`
2. Move the `CURRENT` assignment below the `case "$BRANCH"` block (so `CHANNEL` is already resolved).
3. Add the `derive_current()` helper function after `find_last_stable_tag()` and before `resolve_version_bump()`:

```bash
derive_current() {
  local channel="$1" tag=""
  case "$channel" in
    alpha)  tag=$(git tag -l 'v[0-9]*-alpha.*' --sort=-v:refname | head -1) ;;
    beta)   tag=$(git tag -l 'v[0-9]*-beta.*'  --sort=-v:refname | head -1)
            [ -z "$tag" ] && tag=$(git tag -l 'v[0-9]*-alpha.*' --sort=-v:refname | head -1) ;;
    stable) tag=$(git tag -l 'v[0-9]*-beta.*' --sort=-v:refname | head -1)
            [ -z "$tag" ] && { echo "::error::No beta tag found on main" >&2; exit 1; } ;;
  esac
  [ -z "$tag" ] && tag=$(find_last_stable_tag)
  [ -z "$tag" ] && tag="v0.0.0"
  echo "${tag#v}"
}
CURRENT=$(derive_current "$CHANNEL")
```

4. The call `find_last_channel_tag "$CURRENT" "$CHANNEL"` on line 101 remains unchanged — `CURRENT` now holds a tag-derived value of identical shape.

### Acceptance criteria

- [x] `detect.sh` no longer reads `package.json` (no `node -p` call).
- [x] `CURRENT` is assigned after `CHANNEL` is resolved.
- [x] `derive_current alpha` returns `0.14.0-alpha.3` when `v0.14.0-alpha.2` and `v0.14.0-alpha.3` exist.
- [x] `derive_current alpha` returns the latest stable tag value when no alpha tags exist.
- [x] `derive_current alpha` returns `0.0.0` on a fresh repo with no tags.
- [x] `derive_current beta` returns the latest beta tag when one exists, otherwise falls back to latest alpha.
- [x] `derive_current stable` exits with error when no beta tag exists.
- [x] `resolve_bump_strategy` behavior is unchanged (receives same-shape string).

### Dependencies

None — can start immediately.

**Estimated diff**: ~15 lines added, 1 line removed.

---

## Task A2 — `docker-release.yml`: Skip CHANGELOG and commit on develop

**Repo**: `sisques-labs/workflows`
**File**: `.github/workflows/docker-release.yml`
**Spec requirement**: Develop Branch Skips Version File Commit

### Action

1. Add `&& github.ref_name != 'develop'` guard to the "Generate CHANGELOG.md (full history)" step (currently line 188):

```yaml
if: steps.cliff_detect.outputs.present == 'true' && github.ref_name != 'develop'
```

2. Add the same guard to the "Generate release body fragment" step (currently line 198):

```yaml
if: steps.cliff_detect.outputs.present == 'true' && github.ref_name != 'develop'
```

3. Restructure the "Commit, tag & push" step body (currently lines 276–282) so the tag is always created but the version-file commit is skipped on develop:

```bash
git tag ${{ steps.bump.outputs.tag }}
if [ "${{ github.ref_name }}" != "develop" ]; then
  git add package.json pnpm-lock.yaml
  if [ -f package-lock.json ]; then git add package-lock.json; fi
  if [ -f CHANGELOG.md ] && [ -f cliff.toml ]; then git add CHANGELOG.md; fi
  git commit -m "chore: release ${{ steps.bump.outputs.tag }}"
fi
git push origin HEAD --follow-tags
```

Note: `--follow-tags` pushes the tag even when no commit was made.

### Acceptance criteria

- [x] On `develop`: tag is created and pushed; no `git commit` executed; `package.json` and `CHANGELOG.md` are not staged.
- [x] On `staging`: behavior unchanged — tag created, commit pushed, CHANGELOG generated.
- [x] On `main`: behavior unchanged — graduate commit and CHANGELOG committed.
- [x] "Generate CHANGELOG.md" step is skipped on develop.
- [x] "Generate release body fragment" step is skipped on develop.
- [x] `sync_develop_after_stable` step is unaffected.

### Dependencies

Can be implemented in the same branch as A1. No ordering constraint between A1 and A2.

**Estimated diff**: ~10 lines modified/added.

---

## Task C1 — `package.json`: Set sentinel version

**Repo**: `gardenia-api`
**File**: `package.json`
**Spec requirement**: package.json Version Frozen on Develop and Staging

### Action

Change line 3:

```diff
- "version": "0.15.1-beta.0",
+ "version": "0.0.0-dev",
```

### Acceptance criteria

- [x] `package.json` version field is exactly `"0.0.0-dev"`.
- [x] No other fields in `package.json` are modified.
- [ ] The change is committed on `develop` and propagates to `staging` via the next `develop → staging` merge.

### Dependencies

- This change is **inert** until Task A2 (workflows PR) is merged and deployed, because if the old `docker-release.yml` runs after C1 is merged it will overwrite `0.0.0-dev` with a real version.
- Can be opened as a PR immediately, but MUST NOT be merged before the workflows PR is live.

**Estimated diff**: 1 line changed.

---

## Task V1 — Validate end-to-end behavior

**Spec requirements**: all four requirements (Version Detection, Develop Skips Commit, Frozen package.json, Zero Conflicts)

### Action

After both PRs are merged:

1. Trigger a push to `develop` and observe the release workflow run.
2. Verify in `git log develop` that no `chore: release v*` commit appears.
3. Verify a new `v*-alpha.*` tag exists in the repo.
4. Open a `develop → staging` PR — confirm GitHub reports zero conflicts in `package.json` and `CHANGELOG.md`.
5. Confirm `package.json` version on `develop` is still `0.0.0-dev` after the release run.

### Acceptance criteria

- [ ] `develop` git log shows tag but no version-file commit.
- [ ] `develop → staging` PR has zero version-file conflicts.
- [ ] `package.json` on `develop` stays `0.0.0-dev` after release.
- [ ] `staging` release run still commits and pushes `package.json` + CHANGELOG.

### Dependencies

- Requires Task A1, A2, and C1 all merged and workflows deployed.

---

## Summary

| # | Task | Repo | Sequential / Parallel | Blocks |
|---|------|------|-----------------------|--------|
| A1 | `detect.sh` derive_current | workflows | Parallel (with A2) | V1 |
| A2 | `docker-release.yml` develop guard | workflows | Parallel (with A1) | C1, V1 |
| C1 | `package.json` sentinel | gardenia-api | After A2 merged | V1 |
| V1 | End-to-end validation | both | After A1+A2+C1 merged | — |

**Total tasks**: 4 (2 parallel implementation tasks + 1 sequential + 1 validation).
**Two PRs**: workflows repo PR (A1+A2 together), gardenia-api PR (C1).
