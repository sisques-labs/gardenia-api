# Archive Report: resolve-jwt-tenant-conflict

**Change**: resolve-jwt-tenant-conflict — JWT / tenant-claim policy clarification
**Date Archived**: 2026-09-10
**Status**: COMPLETE
**Verdict**: PASS WITH WARNINGS (both warnings non-blocking, no fix required)

---

## Executive Summary

Resolves the JWT/tenancy conflict recorded in the platform repo's `docs/open-questions.md`: Sisques Account issues JWTs that embed `tenants[]`, while gardenia-api has a locked decision that tenant must never be embedded in a JWT. Exploration found the archived decision (`openspec/changes/archive/2026-05-29-multitenant/specs/auth/spec.md`) is textually scoped to gardenia's own `TokenService.sign()` output and `auth_sessions` schema — it does not forbid trusting a claim inside a JWT gardenia merely verifies. The user confirmed the resolution: the current tenant/space for any request is ALWAYS resolved via the `X-Space-ID` header plus a DB membership lookup, never from a JWT claim regardless of issuer; a JWT (gardenia's own or external) may list a user's memberships as identity-only metadata without violating the rule. This is a documentation/decision-record change — the only code touched is 6 lock-in regression tests plus one doc comment, freezing behavior gardenia's guards already had. No production logic changed. This unblocks (but does not implement) the separately-deferred "migrate gardenia-api to consume Sisques Account" change.

---

## SDD Artifacts (Engram Observation IDs)

| Artifact | Topic Key | Type |
|----------|-----------|------|
| Explore | `sdd/resolve-jwt-tenant-conflict/explore` (#379) | architecture |
| Decision (user-confirmed) | `sdd/resolve-jwt-tenant-conflict/decision` (#385) | decision |
| Proposal | `sdd/resolve-jwt-tenant-conflict/proposal` (#386) | architecture |
| Spec | `sdd/resolve-jwt-tenant-conflict/spec` (#392) | architecture |
| Design | `sdd/resolve-jwt-tenant-conflict/design` (#398) | architecture |
| Tasks | `sdd/resolve-jwt-tenant-conflict/tasks` | architecture |
| Verify Report | `sdd/resolve-jwt-tenant-conflict/verify-report` | architecture |

---

## Task Completion Status

**Total Tasks**: 9
**Completed**: 9 (100%)

### By Phase

- **Phase 1** — `space.guard.spec.ts` lock-in (helper extension + 4 cases + run) — 6/6 ✓ (sub-tasks 1.1–1.6)
- **Phase 2** — `jwt.strategy.spec.ts` lock-in (2 cases + run) — 3/3 ✓ (sub-tasks 2.1–2.3)
- **Phase 3** — `space.guard.ts` doc comment — 1/1 ✓ (task 3.1)

---

## Specs Synced

### NEW: tenant-resolution-policy

**Location**: `openspec/specs/tenant-resolution-policy/spec.md`
**Action**: Created
**Details**: Mechanism-agnostic policy — the current tenant/space for any request MUST be resolved only via header + DB membership lookup, never from any JWT claim regardless of issuer; a JWT may carry a membership list as identity-only metadata. Binds any future external-identity integration (e.g. a Sisques Account adapter), not just today's code.

### MODIFIED: auth

**Location**: `openspec/specs/auth/spec.md`
**Action**: Updated via `gentle-ai sdd-archive-compose`
**Changes**:
- Requirement "No Change to JWT Payload" re-scoped: no JWT claim from ANY issuer may act as the current-tenant selector (previously silent on non-gardenia-issued tokens).
- Requirement "auth_sessions Table Has No spaceId Column" re-scoped: the finality clause governs gardenia's own session schema/mechanism; it does not itself authorize a future integration to derive tenant from a token claim.
- **One-time format migration**: `openspec/specs/auth/spec.md` predated this repo's standard `### Requirement:` / `#### Scenario:` capability-spec format (it was the raw `multitenant` delta document, numbered §1–§7, never reformatted after that change archived). Reformatted into 13 standard requirements, preserving every existing rule's substance unchanged, so `gentle-ai sdd-archive-compose` could match and merge this change's delta requirements by title. This was a pure structural migration, not a content change — verified by a 1:1 mapping of every old numbered subsection to a new `### Requirement:` block before compose ran.

---

## Implementation Summary

### Tests (all characterization/lock-in — production code already complied)
- `src/contexts/spaces/transport/guards/space.guard.spec.ts` — `buildMockContext` extended with `userExtras`; 4 new cases (claim doesn't satisfy missing header, doesn't override present header, doesn't bypass membership check, `req.spaceId` comes from header verbatim)
- `src/contexts/auth/infrastructure/strategies/jwt.strategy.spec.ts` — 2 new cases using an exact key-set assertion (`Object.keys(result).sort()`) so a future added tenant field fails the test instead of silently passing

### Documentation
- `src/contexts/spaces/transport/guards/space.guard.ts` — second top-of-file doc-comment block (below the existing `// ALS Decision:` block) recording the header-only tenant-resolution policy

### No production logic changed
`SpaceGuard.canActivate()` and `JwtStrategy.validate()` bodies are unchanged.

---

## Verification Results

**Test Suite**: `pnpm test -- space.guard jwt.strategy` — 2 suites, 15/15 tests pass (independently re-run by `sdd-verify`, not just trusted from `sdd-apply`)
**Type Check**: `tsc --noEmit` — clean
**Lint**: 0 new errors on the 3 changed files
**Spec Compliance**: all 7 scenarios across both specs (`tenant-resolution-policy`, `auth` delta) either covered by a passing test or correctly documented as an untestable governance/schema invariant (3 such invariants, not 2 as an earlier orchestrator brief mis-stated — corrected here)
**Archive Integrity**: `openspec/changes/archive/2026-05-29-multitenant/` confirmed byte-for-byte untouched throughout

### Issues Found & Status

| Issue | Severity | Status | Resolution |
|-------|----------|--------|------------|
| W1: Scenario-count mismatch (2 vs 3) in an earlier phase brief | WARNING | ACKNOWLEDGED | Factual correction only; tasks.md's traceability map was correct, the brief was wrong — no code or spec change needed |
| W2: Unplanned whitespace-only reformat in `space.guard.ts` | WARNING | ACKNOWLEDGED | A pre-existing prettier formatting issue on an unrelated line was auto-fixed by the repo's lint-staged pre-commit hook when the doc comment was added; zero runtime effect, confirmed by `sdd-verify`'s diff check on `canActivate()`'s body |

---

## Archive Contents

```
openspec/changes/archive/2026-09-10-resolve-jwt-tenant-conflict/
├── archive-report.md          ← This file
├── proposal.md                ← Proposal: decision-record change, no production code
├── explore.md                 ← Exploration of resolution options
├── design.md                  ← Design: why this doesn't reopen the archived multitenant decision
├── tasks.md                   ← 9 tasks, all [x]
└── specs/
    ├── auth/spec.md           ← Delta applied to the live auth spec
    └── tenant-resolution-policy/spec.md  ← New capability spec (source, pre-merge)
```

---

## Source of Truth Updated

- `openspec/specs/auth/spec.md` — reformatted into standard capability-spec format and updated with the two MODIFIED requirements above
- `openspec/specs/tenant-resolution-policy/spec.md` — NEW capability spec, 2 requirements, 3 scenarios

---

## Follow-Up (Out of Scope Here)

- **Migrate gardenia-api to consume Sisques Account** — separately-scoped, deferred change per the platform's own MVP sequencing (`status-and-mvp.md`). This archived change gives it a concrete, binding constraint: whatever integration shape is chosen, current-tenant resolution stays header-based, never JWT-claim-based. Not started.
- An existing branch `JSisques/migrate-auth-to-account` was observed during this change's PR work — worth checking before starting a fresh SDD change for the migration, to avoid duplicating work.

---

## SDD Cycle Complete

✓ **Explore** — Resolution options laid out against the archived decision and Sisques Account's token model
✓ **Decision** — User explicitly confirmed the header-only resolution rule
✓ **Proposal** — Scoped as a decision-record change, no production code
✓ **Specs** — New `tenant-resolution-policy` capability + `auth` delta
✓ **Design** — Concrete test/doc-comment lock-ins specified
✓ **Tasks** — 9 tasks across 3 phases
✓ **Apply** — All tasks implemented, 15/15 tests pass
✓ **Verify** — PASS WITH WARNINGS (both non-blocking)
✓ **Archive** — Change archived, specs merged into main (including a one-time format migration of the `auth` canonical spec), audit trail preserved

PR chain: #550 (proposal/spec/design/tasks → develop) ← #551 (apply/lock-in tests) ← this archive commit, all stacked, awaiting review/merge in order.
