# CI Versioning Specification

## Purpose

Defines how the release-train derives, tags, and commits versions per branch channel. Git tags are the source of truth for version detection on `develop` and `staging`; only `main` commits version files to the repository.

## Requirements

### Requirement: Version Detection from Git Tags

The CI system MUST derive `CURRENT` version from git tags, not from `package.json`.

- On `develop`: CURRENT MUST be the latest `v*-alpha.*` tag. If no alpha tag exists, MUST fall back to the latest stable tag. If no tag exists at all, MUST fall back to `0.0.0`.
- On `staging`: CURRENT MUST be the latest `v*-beta.*` tag. If no beta tag exists, MUST fall back to the latest `v*-alpha.*` tag. If no alpha tag exists either, MUST fall back to the latest stable tag. If no stable tag exists, MUST fall back to `0.0.0`.
- On `main`: CURRENT MUST be the latest `v*-beta.*` tag. If no beta tag exists, MUST exit non-zero with an error. There is no fallback for `main` — graduating without a prior beta tag is a pipeline error.
- The `find_last_channel_tag()` helper MUST be leveraged for tag resolution.
- `package.json` MUST NOT be read for version detection on any branch.

#### Scenario: develop with existing alpha tags

- GIVEN the `develop` branch has tags `v0.14.0-alpha.2` and `v0.14.0-alpha.3`
- WHEN `detect.sh` runs
- THEN `CURRENT` equals `v0.14.0-alpha.3`

#### Scenario: develop with no alpha tag, stable tag exists

- GIVEN the `develop` branch has no alpha tags and the latest stable tag is `v0.13.0`
- WHEN `detect.sh` runs
- THEN `CURRENT` equals `v0.13.0`

#### Scenario: develop with no tags at all

- GIVEN the repository has no git tags on any channel
- WHEN `detect.sh` runs on `develop`
- THEN `CURRENT` equals `0.0.0`

#### Scenario: staging with beta tags present

- GIVEN the `staging` branch has tags `v0.14.0-beta.0` and `v0.14.0-alpha.5`
- WHEN `detect.sh` runs
- THEN `CURRENT` equals `v0.14.0-beta.0` (beta takes priority over alpha)

#### Scenario: staging with only alpha tags

- GIVEN the `staging` branch has `v0.14.0-alpha.5` but no beta tags
- WHEN `detect.sh` runs on `staging`
- THEN `CURRENT` equals `v0.14.0-alpha.5`

---

### Requirement: Develop Branch Skips Version File Commit

On `develop`, the CI release step MUST create and push the git tag but MUST NOT commit `package.json` or `CHANGELOG.md` to the branch.

- The `git add package.json CHANGELOG.md && git commit && git push` step MUST NOT execute when the triggering branch is `develop`.
- The git tag MUST still be created and pushed on `develop`.
- `bump.sh --no-git-tag-version` behavior is unchanged.
- On `staging` and `main`, the commit+push step behavior MUST remain unchanged.

#### Scenario: develop release run

- GIVEN a push to `develop` triggers the release workflow
- WHEN the version bump completes
- THEN a new alpha git tag is created and pushed
- AND no commit is made to `develop` for `package.json` or `CHANGELOG.md`

#### Scenario: staging release run (unchanged behavior)

- GIVEN a push to `staging` triggers the release workflow
- WHEN the version bump completes
- THEN a new beta git tag is created and pushed
- AND `package.json` and `CHANGELOG.md` are committed and pushed to `staging`

---

### Requirement: package.json Version Frozen on Develop and Staging

The `version` field in `gardenia-api/package.json` on `develop` MUST be the sentinel value `0.0.0-dev`.

- CI MUST NOT overwrite `package.json` version on `develop`.
- `staging` inherits `0.0.0-dev` through merges from `develop` and CI MUST NOT overwrite it on `staging`.
- `main` MUST still have `package.json` updated to the real stable version on graduate.

#### Scenario: package.json on develop stays frozen after release

- GIVEN `package.json` version is `0.0.0-dev` on `develop`
- WHEN the release-train runs an alpha bump
- THEN `package.json` version on `develop` MUST still be `0.0.0-dev` after the run

#### Scenario: package.json on staging stays frozen after beta bump

- GIVEN `staging` inherited `0.0.0-dev` from a `develop → staging` merge
- WHEN the release-train runs a beta bump on `staging`
- THEN `package.json` version on `staging` MUST still be `0.0.0-dev` after the run

#### Scenario: package.json updated on main graduate

- GIVEN `staging` is merged into `main` with `package.json` at `0.0.0-dev`
- WHEN the graduate step runs on `main`
- THEN `package.json` version on `main` MUST be updated to the resolved stable version (e.g. `0.15.0`)
- AND the commit is pushed to `main`

---

### Requirement: Zero Version-File Conflicts on Develop to Staging PRs

A pull request from `develop` to `staging` MUST NOT produce a merge conflict in `package.json` or `CHANGELOG.md` after this change is applied.

- Because neither `develop` nor `staging` modifies `package.json` via CI, the file remains `0.0.0-dev` on both branches.
- `CHANGELOG.md` MUST NOT be committed on `develop` by CI, eliminating the divergence source.

#### Scenario: develop to staging PR after multiple alpha releases

- GIVEN `develop` has had three alpha releases since the last `develop → staging` merge
- AND `staging` has had one beta release in the same period
- WHEN a PR from `develop` to `staging` is opened
- THEN GitHub reports zero conflicts in `package.json`
- AND GitHub reports zero conflicts in `CHANGELOG.md`

#### Scenario: repeated beta cycles produce no accumulating conflicts

- GIVEN `staging` has gone through `beta.0` and `beta.1` while `develop` continued with alphas
- WHEN a new `develop → staging` PR is opened
- THEN there are no version-file conflicts

---

### Requirement: Main Graduate Commits Real Version

On `main`, the graduate step MUST resolve the current stable version from the latest `v*-beta.*` tag and commit it to `package.json` and `CHANGELOG.md`.

- CHANGELOG MUST be committed on `main` as part of the graduate.
- The `sync_develop_after_stable` hook MUST still fire after the main graduate (behavior unchanged).

#### Scenario: main graduate reads version from latest beta tag

- GIVEN the latest beta tag is `v0.15.0-beta.3`
- WHEN the graduate step runs on `main`
- THEN `CURRENT` equals `v0.15.0-beta.3`
- AND the computed next stable version (e.g. `0.15.0`) is committed to `package.json` on `main`

#### Scenario: sync_develop_after_stable fires post-graduate

- GIVEN the graduate on `main` completes successfully
- WHEN the post-graduate hooks run
- THEN `sync_develop_after_stable` executes (behavior unchanged)
