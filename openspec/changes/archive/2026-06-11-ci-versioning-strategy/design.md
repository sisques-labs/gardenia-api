# Design: CI Versioning Strategy — Tags as Source of Truth

## Technical Approach

Make git tags the version source for `develop`/`staging`. `detect.sh` derives `CURRENT` from the last channel tag instead of `package.json`; `docker-release.yml` skips the version-file commit on `develop`; `package.json` is frozen to `0.0.0-dev`. The existing `find_last_channel_tag()` and `resolve_bump_strategy()` already operate on a `MAJOR.MINOR.PATCH-channel.N` string, so feeding them a tag-derived value (same shape) keeps downstream logic intact.

## Architecture Decisions

| # | Decision | Choice | Rejected | Rationale |
|---|----------|--------|----------|-----------|
| 1 | `CURRENT` derivation | New `derive_current()` helper: latest channel tag → strip leading `v` | Keep reading `package.json` | `package.json` is now a frozen sentinel; tags carry the real progression |
| 2 | Bootstrap (no channel tag) | Fall back to last stable tag, then `0.0.0` | Hardcode `0.0.0-dev` | Fallback chain yields a string `resolve_bump_strategy` understands (stable or empty → `open-cycle`) |
| 3 | CHANGELOG on develop | Skip generation AND commit on develop | Generate but don't commit | Cheaper; alpha changelog is throwaway, regenerated at beta/stable |
| 4 | Commit gating | `if: github.ref_name != 'develop'` on commit step | Separate conditional job | Minimal diff; tag/release steps stay shared |
| 5 | `staging → main` conflict | Document as expected; main authoritative | Automate sync | One predictable conflict per stable cycle; not worth automation |

## Change 1 — `detect.sh`: CURRENT from tags

Replace line 5:

```bash
# OLD
CURRENT=$(node -p "require('./package.json').version")

# NEW — derive from tags, after CHANNEL is resolved (move below the case block)
derive_current() {
  local channel="$1" tag=""
  case "$channel" in
    alpha) tag=$(git tag -l 'v[0-9]*-alpha.*' --sort=-v:refname | head -1) ;;
    beta)  tag=$(git tag -l 'v[0-9]*-beta.*'  --sort=-v:refname | head -1)
           [ -z "$tag" ] && tag=$(git tag -l 'v[0-9]*-alpha.*' --sort=-v:refname | head -1) ;;
    stable) tag=$(git tag -l 'v[0-9]*-beta.*' --sort=-v:refname | head -1)
            [ -z "$tag" ] && { echo "::error::No beta tag found on main" >&2; exit 1; } ;;
  esac
  [ -z "$tag" ] && tag=$(find_last_stable_tag)   # bootstrap: last stable
  [ -z "$tag" ] && tag="v0.0.0"                  # fresh repo
  echo "${tag#v}"
}
CURRENT=$(derive_current "$CHANNEL")
```

`CURRENT` now holds e.g. `0.15.1-alpha.3` (from tag `v0.15.1-alpha.3`) — identical shape to the old `package.json` value.

**`resolve_bump_strategy()` — no change needed.** It matches `=~ -alpha\.` / `-beta\.` / `! =~ -`. A tag-derived `CURRENT` has the same format, so all branches resolve correctly. Bootstrap edge: a stable-tag fallback (`0.15.0`, no `-`) on develop → `open-cycle`; `0.0.0` fresh → `open-cycle`. Both valid.

## Change 2 — `docker-release.yml`: skip commit + CHANGELOG on develop

```yaml
# "Generate CHANGELOG.md" (line 187): add develop guard
  if: steps.cliff_detect.outputs.present == 'true' && github.ref_name != 'develop'
# "Generate release body fragment" (line 198): same guard
  if: steps.cliff_detect.outputs.present == 'true' && github.ref_name != 'develop'
# "Commit, tag & push" (line 273): split — tag/push always, commit only off develop
```

Restructure the commit step body so the **tag still gets created and pushed on develop**, but the version-file commit is skipped:

```bash
git tag ${{ steps.bump.outputs.tag }}
if [ "${{ github.ref_name }}" != "develop" ]; then
  git add package.json pnpm-lock.yaml
  [ -f package-lock.json ] && git add package-lock.json
  [ -f CHANGELOG.md ] && [ -f cliff.toml ] && git add CHANGELOG.md
  git commit -m "chore: release ${{ steps.bump.outputs.tag }}"
fi
git push origin HEAD --follow-tags
```

`--follow-tags` still pushes the tag even when no commit was made. The GitHub Release step falls back to `generate_release_notes: true` on develop (cliff body skipped), so releases still publish.

## Change 3 — `package.json`

```diff
- "version": "0.15.1-beta.0",
+ "version": "0.0.0-dev",
```

## Decision 4 evidence — tag ordering on staging

`find_last_channel_tag()` never relies on `git describe`'s nearest-by-distance default for channel lookups: every channel branch passes an explicit `--match "v...-<channel>.*"` glob (lines 21–28). `git describe --match` ignores non-matching tags entirely, so a closer alpha tag CANNOT shadow the beta lookup. `derive_current()` mirrors this with `git tag -l '<glob>' --sort=-v:refname`, which orders by semver, not commit distance. Tag ordering is already safe — no extra handling required.

## Data Flow

    push develop ──→ detect.sh: derive_current(alpha) ─→ CURRENT
                          │ (latest v*-alpha.* tag, or stable fallback)
                          ▼
                  resolve_bump_strategy ─→ bump.sh ─→ new tag
                          │
                          ▼
            docker-release: tag+push ✓   commit package.json ✗ (develop)

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `workflows/.github/actions/release-train-detect/detect.sh` | Modify | `derive_current()` helper; `CURRENT` from tags |
| `workflows/.github/workflows/docker-release.yml` | Modify | `!= 'develop'` guards on CHANGELOG + commit steps |
| `gardenia-api/package.json` | Modify | `version` → `0.0.0-dev` |

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit (shell) | `derive_current` per channel + bootstrap | Run detect.sh in a temp git repo with seeded tags; assert `should_release`/`bump_strategy` outputs |
| Integration | develop push creates tag, no commit | Test branch in workflows repo; verify `git log` shows tag but no `chore: release` commit |
| Manual | develop → staging PR | Confirm zero version-file conflicts after a beta cycle |

## Migration / Rollout

1. Land `detect.sh` + `docker-release.yml` in a `workflows` test branch; validate.
2. Merge `workflows` to `main`.
3. Set `gardenia-api` `package.json` → `0.0.0-dev` on develop.
Rollback: revert both `workflows` commits, restore real `package.json` version. Tags untouched.

## Open Questions

- [ ] Other `workflows` consumers still committing version files on develop — confirm they tolerate tag-derived `CURRENT` (frozen `0.0.0-dev` is consumer-opt-in via package.json, so behavior is unchanged for repos that keep real versions).
