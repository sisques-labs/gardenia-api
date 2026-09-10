# Design: Resolve the JWT / Tenant Conflict (Header-Only Tenant Resolution)

## Technical Approach

A **decision record**, not a feature build. Production behavior already complies
(`SpaceGuard` resolves space from `X-Space-ID` + `MembershipFindByUserAndSpaceQuery`;
`JwtStrategy.validate()` returns `{userId, email, appRole}`, no tenant field). This
design formalizes the invariant as a mechanism-agnostic policy, records why the
archive is not reopened, and freezes today's behavior with lock-in tests plus one doc
comment. No production logic changes.

## Architecture Decisions

### Decision: Current tenant is header-resolved, forever, for every issuer

**Choice**: the **current** space/tenant is resolved only from the `X-Space-ID` header
(generalizable to `X-Tenant-ID`) plus a DB membership lookup via `QueryBus` →
`MembershipFindByUserAndSpaceQuery` — for every request, regardless of who issued or
verified the token and regardless of its contents. A JWT gardenia issues **or merely
verifies** MAY carry a membership/tenant **list** as identity metadata; such a claim
MUST NOT act as a current-tenant selector, nor satisfy, substitute for, or override
the header + DB lookup.

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Header + DB membership lookup (status quo) | One indexed query per request; authorization is checked against gardenia's own source of truth | **Chosen** |
| Trust a `spaceId`/`tenants` claim as selector | Removes the query, but delegates gardenia's authorization boundary to an external issuer and makes revocation lag the token TTL | Rejected |
| Claim as hint + DB verification | Same query cost, plus two code paths and a claim that looks authoritative but is not | Rejected — no benefit, extra drift surface |

**Rationale**: membership is gardenia's own aggregate. The header carries client
*intent*, the DB carries *authority*. Keeping the selector out of the token makes
revocation immediate rather than TTL-bound, and stops any external issuer from
widening a gardenia user's reach by minting a claim.

### Decision: Scope clarification, not a reversal of the archive

**Choice**: record the clarification here and as an `auth` delta; leave
`openspec/changes/archive/2026-05-29-multitenant/` byte-for-byte untouched.

**Rationale**: archived §2.2 ("JWT payload MUST remain `{sub, email}`; `spaceId` MUST
NOT be embedded") governs gardenia's own `TokenService.sign()` output; §4
("`auth_sessions` MUST NOT include a `spaceId` column… this decision is final")
governs its own session schema and header-based resolution. This rule is a
**superset** — it keeps both constraints intact and extends the ban to tokens gardenia
did not issue, which the archived text never addressed. A superset that retracts
nothing needs no reopening, so the "final" clause is satisfied rather than challenged.
Rejected: amending the archive (immutable) or filing a re-opening proposal
(unnecessary).

### Decision: Lock-in via existing unit specs, not new files

**Choice**: extend the two existing co-located specs; no new test file, guard, or
decorator.

**Rationale**: architecture rule 6 — unit tests are manual instantiation with
`jest.Mocked<T>`, co-located, no `@nestjs/testing`; both target specs already have
that shape. Layer boundaries hold: `SpaceGuard` stays in transport
(`spaces/transport/guards/`), `JwtStrategy` in infrastructure
(`auth/infrastructure/strategies/`). Nothing crosses a layer.

## Data Flow (unchanged — this is what the tests freeze)

    Request ─→ JwtAuthGuard ─→ JwtStrategy.validate({sub,email,role?})
                                        │
                                        └─→ req.user {userId, email, appRole}
                                                     │        (no tenant field)
    X-Space-ID header ──────────────────────────────┐│
                                                    ▼▼
                                 SpaceGuard ─→ QueryBus
                                                 └─→ MembershipFindByUserAndSpaceQuery
                                                        │ null → 403
                                                        ▼
                                              req.spaceId = header value
                                                        │
                                     SpaceInterceptor ─→ SpaceContext (ALS)

The JWT branch and the tenant branch never join. That disjointness is the invariant.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `openspec/specs/tenant-resolution-policy/spec.md` | Create (at archive) | New capability spec — owned by `sdd-spec` |
| `openspec/changes/resolve-jwt-tenant-conflict/specs/auth/spec.md` | Create | `auth` §2.2 re-scoping delta — owned by `sdd-spec` |
| `src/contexts/spaces/transport/guards/space.guard.spec.ts` | Modify | Add `describe('tenant-resolution policy lock-in')` block (4 cases below) |
| `src/contexts/auth/infrastructure/strategies/jwt.strategy.spec.ts` | Modify | Add `describe('tenant-resolution policy lock-in')` block (2 cases below) |
| `src/contexts/spaces/transport/guards/space.guard.ts` | Modify | Append a second header doc comment block (no code change) |

## Test Cases to Add (concrete, sliceable)

`space.guard.spec.ts` — extend the existing `buildMockContext` helper with an optional
`userExtras?: Record<string, unknown>` merged into `req['user']`, so a test can plant
claim-shaped fields on the authenticated principal. Then, inside a new
`describe('tenant-resolution policy lock-in')`:

1. **A token claim does not satisfy a missing header** — `user` carries
   `{spaceId: SPACE_ID, tenants: [{id: SPACE_ID, role: 'owner'}]}`, no `x-space-id`
   header → `BadRequestException`, and `expect(queryBus.execute).not.toHaveBeenCalled()`.
2. **A token claim does not override a present header** — `user` carries
   `spaceId: OTHER_SPACE_ID`, header is `SPACE_ID`, membership resolves → asserts
   `MembershipFindByUserAndSpaceQuery` was constructed with `spaceId: SPACE_ID`
   (inspect `queryBus.execute.mock.calls[0][0]`) and `req['spaceId'] === SPACE_ID`.
3. **A token claim does not bypass the membership check** — `user` carries
   `tenants: [{id: SPACE_ID}]`, header is `SPACE_ID`, `queryBus.execute` resolves
   `null` → `ForbiddenException` (claim never short-circuits authorization).
4. **`req.spaceId` is sourced from the header verbatim** — header `SPACE_ID`, no
   claim fields at all, membership resolves → `req['spaceId'] === SPACE_ID`.

`jwt.strategy.spec.ts` — new `describe('tenant-resolution policy lock-in')`:

5. **`validate()` output is selector-free** — assert
   `Object.keys(strategy.validate({sub, email, role: 'admin'})).sort()` equals
   `['appRole', 'email', 'userId']`. An exact key-set assertion (not `toEqual`) is what
   makes an added tenant field a failing test rather than a silent pass.
6. **Extra tenant-shaped claims are dropped, not forwarded** — pass a payload cast
   with `spaceId` and `tenants` alongside `{sub, email}`; assert the result has
   `undefined` for both and still matches the exact key set from case 5.

## Doc Comment Placement

`src/contexts/spaces/transport/guards/space.guard.ts` already opens with a top-of-file
`// ALS Decision:` comment block (lines 1–4). Append a **second** block immediately
below it, before the `import` statements, matching that existing style:

```ts
// Tenant Resolution Policy: the current space is resolved ONLY from the
// X-Space-ID header plus the MembershipFindByUserAndSpaceQuery lookup below.
// A JWT claim (spaceId, tenants, ...) MUST NOT be read as a current-space
// selector, whoever issued the token — it may carry membership metadata for
// identity purposes only. See openspec/specs/tenant-resolution-policy/spec.md.
```

No behavioral edit to `canActivate()`. The guard comment is the required one — the
guard is where a future integration would be tempted to wire claim-based resolution.

## Forward Constraint (design note, not implementation)

Any future change migrating gardenia-api to consume Sisques Account (separate, not
started, out of scope here — see
`platform/docs/architecture/sisques-account/status-and-mvp.md`) **inherits this
constraint unconditionally**: whatever adapter shape it picks — edge exchange,
resource-server verification, JWKS, token exchange — it MUST NOT derive the current
tenant from a JWT claim. It MAY read a Sisques Account token's tenant list as identity
metadata (suggesting spaces, driving a linking flow) and MUST still route every
request's current-space decision through `X-Space-ID` + membership lookup. Relaxing
this requires its own proposal against `tenant-resolution-policy`; an adapter choice
cannot relax it implicitly. The lock-in tests are the mechanical enforcement.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file
classification, or process-integration boundary; tests and comments only.

## Migration / Rollout

No migration required. No schema change, token invalidation, feature flag, or config.
Rollback is `git revert` of a single commit.

## Open Questions

- None blocking. Sisques Account's verification mechanism (JWKS per ADR-0005 vs.
  HS256 in the previously-read `account-api` code) stays unconfirmed but is
  deliberately irrelevant: the policy is mechanism-agnostic, and confirming it belongs
  to the deferred migration change.
