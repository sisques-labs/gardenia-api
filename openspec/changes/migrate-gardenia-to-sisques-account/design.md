# Design: Migrate Gardenia to Sisques Account — **P1 + P2 ONLY**

> ## SCOPE BOUNDARY — P3 IS NOT DESIGNED HERE
> Retiring gardenia's local passwords, `TokenService`, `auth_sessions`, and native OAuth is **out of scope**. Nothing below designs, prepares, schedules, or authorizes it. **P3 requires its own SDD change plus explicit go/no-go approval.** Reading this document as covering P3 is wrong. This is a deliberate safety boundary.

## Technical Approach

P1 makes gardenia a **second-issuer resource server**: a new passport strategy verifies account-api's RS256 tokens via JWKS and maps them to gardenia's existing principal shape. Per proposal Decision 1 there is **no reminting** — a platform token creates no gardenia JWT and no `auth_sessions` row. P2 adds tenant-id parity for new spaces plus an authoritative membership-projection refresh. `tenant-resolution-policy` is inherited unchanged: **`space.guard.ts` is not edited**.

### Platform facts verified in account-api source (not assumed)

| Fact | Evidence |
|---|---|
| RS256 + JWKS at `GET /.well-known/jwks.json` | `core/security/keys/`, `jwks.controller.ts` — resolves the explore's HS256 doubt in favour of JWKS |
| Claims: `sub`, `email`, `platformAdmin`, `tenants[{tenantId,role}]` | `access-token-claims.interface.ts` |
| `POST /v1/tenants` takes `{appId,name,slug}`, **no caller-supplied id**, returns the id | `create-tenant.dto.ts` |
| `GET /v1/tenants/:id/members` needs `VIEW_TENANT`, granted by **all** roles; authority is the *caller's own* `tenants` claim, and `platformAdmin` does **not** bypass it | `tenants.controller.ts`, `TENANT_ROLE_PERMISSIONS`, `tenant-permission-guard.factory.ts` |
| No webhook, no event feed, no per-user membership endpoint | absence across all five controllers |

## Architecture Decisions

### D1 — New sibling strategy, not `DynamicOAuthGuard`

`dynamic-oauth.guard.ts` reads `:provider` from route params and delegates to `AuthGuard('google'\|'github'\|'apple')`, i.e. a Passport **redirect** handshake on `/oauth/:provider`. A platform token arrives as an already-issued `Authorization: Bearer` on *every* endpoint. Confirmed from source: no reuse is possible. `SisquesAccountJwtStrategy` mirrors `jwt.strategy.ts` instead; `JwtAuthGuard` becomes `AuthGuard(['jwt','sisques-account'])` — `'jwt'` first, so gardenia-issued tokens behave identically today.

| Option | Tradeoff | Decision |
|---|---|---|
| Sibling passport-jwt strategy + strategy array | ~40 lines, reuses `JwtAuthGuard`/`AppRoleGuard`/`@CurrentUser()` untouched | **Chosen** |
| Extend `DynamicOAuthGuard`/`OAuthProviderRegistry` | Redirect model does not fit a bearer resource server | Rejected |
| Verify then remint a gardenia JWT | Two session stores, stacked TTLs — Decision 1 rejects it | Rejected |

### D2 — `jwks-rsa`, not a `nestjs-kit` bump

The kit's `auth-client` (`src/shared/auth-client/`) calls `JwtService.verify()` against a statically configured secret from `AuthClientModule.forRoot({secret})`: **no JWKS fetch, no `kid` selection, no rotation, no cache**. Bumping it duplicates gardenia's own `JwtAuthGuard` and still does not give JWKS. `jwks-rsa` exports `passportJwtSecret()`, which drops into `passport-jwt@^4`'s `secretOrKeyProvider` (already a dependency). **One new dependency; `jsonwebtoken` not needed directly.** Rejected: kit bump (verified insufficient), `jose` (a second JWT library beside passport-jwt).

The strategy MUST pin `algorithms:['RS256']`, `issuer`, `audience`, and `ignoreExpiration:false`, so an HS256 token can never verify against a JWKS key or vice-versa.

### D3 — Claims extracted vs discarded

`validate()` returns **exactly** `{userId, email, appRole}` — the same key set as `JwtStrategy`, so `SpaceGuard`, `AppRoleGuard`, `@CurrentUser()` and MCP context need no change.

| Claim | Treatment |
|---|---|
| `sub` | Looked up against `accounts.external_subject` → gardenia's own `userId`. **Never used as `userId`** (gardenia UUIDs are FK'd across ten contexts) |
| `email` | First-link only, and only when it matches an existing account |
| `platformAdmin` | **Discarded.** It is not gardenia's `appRole`; conflating them would silently promote platform admins |
| `tenants[]` | **Discarded — never reaches `req.user`.** The design reads it nowhere, at all |
| `iss`,`aud`,`exp`,`kid` | Verified, not forwarded |

### D4 — Membership projection refresh: on-demand, per-tenant, token-relayed

No feed exists, so polling and webhooks are unavailable. Claim-driven refresh is **rejected as policy-non-compliant**: writing projection rows from `tenants[]` launders a claim through the DB, which is the "claim as hint + DB verification" shape the tenant-resolution-policy design already rejected, and would let a minted claim widen a user's reach.

Chosen: a new `MembershipProjectionSyncGuard` runs **immediately before** `SpaceGuard`. It no-ops unless the principal is platform-issued *and* the local row for `(userId, X-Space-ID)` is missing or older than `syncedAt + TTL`. When it fires it dispatches `SyncSpaceMembershipProjectionCommand`, whose adapter relays the **caller's own raw bearer token** (read from the `Authorization` header, not from claims) to `GET /v1/tenants/{tenantId}/members` and reconciles that tenant's rows — including deletions.

| Platform response | Projection effect | `SpaceGuard` outcome |
|---|---|---|
| 200, caller present | upsert row, set `synced_at` | membership found → allow |
| 403 (caller no longer a member) | **delete** the caller's row | 403 — revocation is immediate |
| 5xx / timeout, row exists | leave row untouched | allow, bounded by TTL staleness |
| 5xx / timeout, no row | write nothing | 403 — **fails closed** |

Staleness ceiling is the TTL (default 60s) plus one request. `SpaceGuard` still does `X-Space-ID` + `MembershipFindByUserAndSpaceQuery` and nothing else — the policy's mechanism, file, and lock-in tests are untouched.

### D5 — `appRole` from the account projection, uncached

The subject→`userId` lookup is *required* anyway; `appRole` comes from the same single indexed row, so this adds **zero** queries beyond the one the strategy already needs. Versus today's stateless claim read the cost is one indexed `SELECT` on `accounts` per platform-authenticated request — alongside the membership lookup and the business query it is not the bottleneck. **No cache in P1**: an uncached read keeps role revocation immediate, matching the proposal's stance on membership revocation. Add caching only on measurement. In P1 gardenia-issued tokens keep the claim path, so `app-rbac`'s "JWT appRole Claim" requirement stays true and is not superseded until P3.

### D6 — Tenant-id parity for new spaces; bridge column for existing ones

`POST /tenants` accepts no caller-supplied id (Open Question 2 answered: **no**), and `space.id` is app-supplied via `SpaceBuilder.withId()`. So **new** spaces create the tenant first and adopt the returned UUID verbatim as `space.id` — literal parity, no mapping. **Existing** spaces get a nullable `spaces.external_tenant_id` instead of an id remap.

This **narrows** Scope Decision 3's "no mapping table" to "no mapping for new spaces" and must be acknowledged. Rationale: remapping `space.id` cascades to every tenant-scoped table across ten contexts and is not revertable without a DB restore, which contradicts P2's "fully revertable" requirement. Tenant resolution is `external_tenant_id ?? space.id` — one column serves both cases and converges as old spaces retire.

**User-confirmed: acknowledged as-is.** No further action — the bridge column is the accepted mechanism for existing spaces.

### D7 — Tenant creation relays the acting user's own platform token; no service account

Resolves the open question of which principal creates the tenant in `CreateSpaceCommandHandler`. Gardenia has no service-account/client-credentials path into account-api (confirmed: no such pattern exists anywhere in the platform repo's docs). **User-confirmed decision**: `CreateSpaceCommandHandler` relays the ACTING USER's own platform bearer token (the one already verified by P1's `sisques-account` strategy for this request) to `POST /tenants` on account-api. That user becomes the tenant `owner`, matching account-api's existing model exactly — no new account-api endpoint, no service account, nothing added on the platform side.

**Constraint this creates**: a request authenticated via gardenia's own native password/session (no platform token in hand) cannot trigger this flow. Concretely: `CreateSpaceCommandHandler` adopts a platform tenant id (D6's "new spaces" path) ONLY when the acting request carries a verified platform bearer token; otherwise it falls back to today's behavior (locally-generated `space.id`, `external_tenant_id` left NULL, to be bridged later if/when the user links their account). This is not a gap — it is the direct, accepted consequence of P1 being opt-in dual-issuer rather than mandatory platform auth. `sdd-tasks` must model both paths in `CreateSpaceCommandHandler`, not just the platform-linked one.

## Data Flow (P1 + P2, platform-issued token)

```
Bearer(platform) ─→ JwtAuthGuard AuthGuard(['jwt','sisques-account'])
                       │ 'jwt' fails (RS256 ≠ HS256) → 'sisques-account'
                       ▼
        SisquesAccountJwtStrategy  ── jwks-rsa (cached keys, kid) ─→ JWKS
                       │ verify RS256/iss/aud/exp
                       ▼
        SisquesAccountPrincipalResolver: accounts WHERE external_subject = sub
                       │ miss → link by verified email (existing rule)
                       ▼
              req.user = {userId, email, appRole}      ← tenants[] dropped here
                       │
X-Space-ID ────────────┤
                       ▼
        MembershipProjectionSyncGuard  (stale/missing only)
                       └─→ CommandBus ─→ adapter ─→ GET /v1/tenants/{t}/members
                                                     (relays caller's token)
                       ▼
        SpaceGuard  (UNCHANGED) ─→ QueryBus ─→ MembershipFindByUserAndSpaceQuery
                       │ null → 403
                       ▼
              req.spaceId = header value ─→ SpaceInterceptor ─→ SpaceContext
```

The JWT branch and the tenant branch still never join. That disjointness is the inherited invariant.

## File Changes

| File | Action | Description |
|---|---|---|
| `auth/infrastructure/strategies/sisques-account-jwt.strategy.ts` (+`.spec.ts`) | Create | `PassportStrategy(Strategy,'sisques-account')`; `passportJwtSecret()`; returns `{userId,email,appRole}` |
| `auth/infrastructure/services/sisques-account-principal.resolver.ts` (+`.spec.ts`) | Create | subject→principal; drives first-link |
| `auth/application/commands/link-external-subject/` | Create | Command + handler; mirrors `login-with-oauth/` verified-email rule |
| `auth/domain/aggregates/account.aggregate.ts` | Modify | `+_externalSubject: ExternalSubjectValueObject \| null`; `linkExternalSubject()` emits `AccountExternalSubjectLinkedEvent` (never from the constructor) |
| `auth/domain/value-objects/external-subject/`, `domain/events/account-external-subject-linked/`, `domain/builders/account.builder.ts`, `domain/interfaces|primitives/account.*` | Create/Modify | VO, event, builder step, primitives field |
| `auth/infrastructure/persistence/typeorm/account.entity.ts`, `account-typeorm.mapper.ts`, `account-typeorm-write.repository.ts` | Modify | `external_subject` column, mapping, `findByExternalSubject()` (bypasses the tenant proxy like `findByEmail`) |
| `auth/infrastructure/guards/jwt-auth.guard.ts` | Modify | `AuthGuard(['jwt','sisques-account'])` |
| `auth/domain/repositories/write/account-write.repository.ts` | Modify | `+findByExternalSubject` |
| `spaces/transport/guards/membership-projection-sync.guard.ts` (+`.spec.ts`) | Create | Stale-only refresh; `CommandBus` only |
| `spaces/application/ports/tenant-provisioning.port.ts`, `tenant-membership-query.port.ts` | Create | One interface per file |
| `spaces/infrastructure/adapters/account-api-tenant.adapter.ts`, `account-api-tenant-membership.adapter.ts` (+specs) | Create | `HttpService` calls to `POST /v1/tenants`, `GET /v1/tenants/:id/members` |
| `spaces/application/commands/sync-space-membership-projection/` | Create | Reconcile rows; delete on 403 |
| `spaces/application/commands/create-space/create-space.handler.ts` | Modify | Provision tenant first, `withId(tenantId)` |
| `spaces/infrastructure/persistence/typeorm/entities/{space,space-membership}.entity.ts` | Modify | `+external_tenant_id`, `+synced_at` |
| `spaces/transport/guards/space.guard.ts` | **Unchanged** | Policy lock-in preserved |
| `auth/README.md`, `spaces/README.md` | Modify | Required by `rules.apply` |
| `core/config/env.validation.ts`, `.env.example` | Modify | See below |
| `database/migrations/*-AddExternalSubjectToAccounts.ts`, `*-AddSpaceTenantMapping.ts` | Create | See Migration |
| `auth/auth.module.ts`, `spaces/spaces.module.ts` | Modify | Named const arrays per `rules.apply` |

New env: `SISQUES_ACCOUNT_AUTH_ENABLED` (P1 flag), `SISQUES_ACCOUNT_ISSUER`, `SISQUES_ACCOUNT_JWKS_URL`, `SISQUES_ACCOUNT_AUDIENCE`, `SISQUES_ACCOUNT_API_URL`, `SISQUES_ACCOUNT_APP_ID`, `SISQUES_SPACE_TENANT_SYNC_ENABLED` (P2 flag), `SISQUES_MEMBERSHIP_SYNC_TTL_SECONDS` (default 60).

## Interfaces

```ts
// spaces/application/ports/tenant-membership-query.port.ts
export const TENANT_MEMBERSHIP_QUERY_PORT = Symbol('TENANT_MEMBERSHIP_QUERY_PORT');
export interface ITenantMembershipQueryPort {
  /** Relays the caller's own platform bearer token. `null` = platform said 403. */
  listMembers(tenantId: string, callerAccessToken: string):
    Promise<Array<{ userId: string; role: string }> | null>;
}
```

## Migration / Rollout

```sql
-- P1
ALTER TABLE "accounts" ADD COLUMN "external_subject" varchar NULL;
CREATE UNIQUE INDEX "UQ_accounts_external_subject"
  ON "accounts" ("external_subject") WHERE "external_subject" IS NOT NULL;
-- P2
ALTER TABLE "spaces" ADD COLUMN "external_tenant_id" uuid NULL;
CREATE UNIQUE INDEX "UQ_spaces_external_tenant_id"
  ON "spaces" ("external_tenant_id") WHERE "external_tenant_id" IS NOT NULL;
ALTER TABLE "space_memberships" ADD COLUMN "synced_at" timestamp NULL;
```

`external_subject` is **nullable** — mandatory, since no existing row has a platform subject and no backfill value exists. **Existing password and native-OAuth users are wholly unaffected**: the column is NULL, `JwtStrategy` never reads it, and their login path is byte-identical. The unique index is **partial and global**, deliberately diverging from the table's existing `(space_id, email)` scoping: a platform `sub` identifies one human platform-wide, and a per-space unique would let one subject link to two gardenia users — the identity-fork bug to prevent. `synced_at` nullable = "never synced" = treated as stale.

## Rollback / Reversibility

**Revert P1** — (1) `SISQUES_ACCOUNT_AUTH_ENABLED=false`: the strategy rejects every platform token, `'jwt'` still succeeds, gardenia's own login/session path is authoritative and untouched; (2) revert the commits, restoring `AuthGuard('jwt')`; (3) `pnpm migration:revert` drops the index and column. No gardenia credential, session, or token was altered, and no data is lost — linked subjects simply become unlinked.

**Revert P2** — (1) `SISQUES_SPACE_TENANT_SYNC_ENABLED=false`: the sync guard no-ops, the projection freezes at its last state, `SpaceGuard` keeps reading it exactly as today; (2) revert the commits, restoring local space creation; (3) down-migrate the three columns. Platform tenants created meanwhile are left orphaned — harmless, `app_id`-scoped. **Existing space ids are never remapped, which is precisely what makes P2 revertable** (D6).

## Testing Strategy

| Layer | What | Approach |
|---|---|---|
| Unit | Strategy claim mapping; `tenants[]`/`platformAdmin` dropped; exact `{userId,email,appRole}` key set; sync-guard staleness + fail-closed; aggregate `linkExternalSubject()` | `jest.Mocked<T>`, co-located, no `@nestjs/testing`; mirror the two `jwt.strategy.spec.ts` policy lock-in cases onto the new strategy |
| Integration | Partial unique index rejects a duplicate subject and permits many NULLs; projection reconcile/delete-on-403; tenant proxy bypass on `findByExternalSubject` | real Postgres, `integration-bootstrap.ts` |
| E2E | Both issuers authenticate in the dual-running window; a platform token with exactly one `tenants` entry and **no** `X-Space-ID` still returns **400** | `app-bootstrap.ts` + supertest |

`space.guard.spec.ts` and the existing lock-in tests MUST pass **unmodified**.

## Threat Matrix

N/A — no shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary. Changes are a passport strategy, two guards, and outbound HTTP.

## Open Questions

- [x] **D6's narrowing** of Scope Decision 3 (bridge column for existing spaces instead of an id remap) — user-acknowledged, no further action.
- [x] Which platform principal creates the tenant in `CreateSpaceCommandHandler` — user-confirmed D7: relay the acting user's own platform token, no service account. `CreateSpaceCommandHandler` needs a platform-linked-request path and a fallback native path.
- [ ] Cutover-window length (Proposal OQ3) — product decision, does not block P1/P2. Deliberately left open; P3 (where this matters) is out of scope for this change.
