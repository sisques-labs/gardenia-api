# Proposal: Multi-Tenancy via Spaces

## Intent

Gardenia stores all accounts, users, and (future) gardens/plants in one undifferentiated dataset. To support multiple isolated groups (households, teams, organizations) on a single deployment, we introduce **Spaces** — the isolation unit. One Space = one isolated dataset of users, gardens, and plants. Without this, Gardenia cannot serve more than one logical group safely, and any new feature inherits a single-tenant ceiling. Doing it now, at v0.5.x-alpha with only 3 tables, is far cheaper than retrofitting later.

## Scope

### In Scope
- New bounded context `spaces` (domain/application/infrastructure/transport).
- `Space` aggregate + `SpaceMembership` aggregate (user↔space join with role: `owner` | `member`).
- `spaceId` column on every domain table (`accounts`, `users`, `auth_sessions`, future tables).
- Composite unique constraints: `(spaceId, email)` on `accounts`, `(spaceId, username)` on `users`.
- `SpaceContext` service backed by `AsyncLocalStorage` for per-request space propagation.
- `SpaceGuard` — reads `X-Space-ID` header, validates membership, hydrates `SpaceContext`; 403 on non-member.
- `BaseTenantRepository` mixin injecting `spaceId` into every read/write query.
- Fresh migrations (alpha data discarded).

### Out of Scope
- Super-admin / cross-space queries (no `SpaceContext` bypass mode).
- Billing, quotas, or plans per Space.
- Subdomain-based resolution (`acme.gardenia.app`).
- Space invitations/email flows (membership created programmatically for now).
- Hard configurable cap on Spaces-per-user (constant placeholder; tuned in design).
- GDPR data-residency / schema-per-tenant isolation.

## Capabilities

### New Capabilities
- `spaces`: Space lifecycle (create), membership management (add/remove member, list spaces for a user), and role model.
- `tenant-isolation`: cross-cutting request-scoped space resolution, guard, and repository-level row filtering.

### Modified Capabilities
- `auth`: composite `(spaceId, email)` uniqueness; account creation scoped to a Space. JWT payload UNCHANGED (`{ sub, email }`).
- `users`: composite `(spaceId, username)` uniqueness; user records scoped to a Space.

## Approach

Row-Level Security. JWT identifies the **user** only; `X-Space-ID` header identifies the **active Space** per request. `SpaceGuard` resolves the header, verifies the authenticated user holds a `SpaceMembership`, and stores `spaceId` in `AsyncLocalStorage` via `SpaceContext`. Every repository extends `BaseTenantRepository`, which reads `spaceId` from `SpaceContext` and appends it to `findOne` / `findAndCount` / `save` / `delete`. Domain aggregates, commands, queries, and events stay tenant-agnostic — isolation lives exclusively in infrastructure + transport.

### New Context `spaces` Layout
- **Domain**: `space.aggregate.ts`, `space-membership.aggregate.ts`, value objects (`space-id`, `space-name`, `membership-role`), events (`space-created`, `member-added`, `member-removed`), exceptions (`space-not-found`, `not-a-space-member`, `space-limit-exceeded`), repository interfaces (read + write) in `domain/repositories/`.
- **Application**: commands `create-space`, `add-member`, `remove-member`; queries `space-find-by-id`, `spaces-find-by-user`, `membership-find-by-user-and-space`. Resolvers/controllers use `CommandBus`/`QueryBus` only.
- **Infrastructure**: TypeORM entities `space.entity.ts`, `space-membership.entity.ts`; read/write repositories; mappers.
- **Transport**: GraphQL + REST for space CRUD/membership. `SpaceGuard` + space-context middleware live here.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/contexts/spaces/**` | New | Full bounded context |
| `src/core/` (or `shared/`) | New | `SpaceContext`, `SpaceGuard`, `BaseTenantRepository` mixin |
| `.../auth/.../account.entity.ts` | Modified | Add `spaceId`; drop `email` unique → `(spaceId, email)` |
| `.../users/.../user.entity.ts` | Modified | Add `spaceId`; `(spaceId, username)` unique |
| `auth-session.entity.ts` | Modified | Add `spaceId` |
| All `*-typeorm-*.repository.ts` | Modified | Extend `BaseTenantRepository` |
| `src/database/migrations/` | New | Fresh schema with `spaceId` + composite uniques |
| `app.module.ts` | Modified | Register `SpaceContext` (global), apply `SpaceGuard` |

## Migration Plan

Alpha data discarded — no backfill. Ordered, single migration set:
1. Create `spaces` + `space_memberships` tables (FK `space_memberships.spaceId → spaces.id`, `userId` app-level).
2. Recreate `accounts`/`users`/`auth_sessions` with non-null `spaceId` and composite unique indexes (replacing scalar `email`/`username` uniques).
3. No data migration step (greenfield).
Rollback per migration via `down()` (drop columns/indexes, restore scalar uniques, drop space tables).

## Rollback Plan

- **Pre-traffic**: run migration `down()` in reverse order; revert `app.module` guard registration; redeploy prior image.
- **Post-traffic**: `SpaceGuard` is the gate — disable it via feature flag/env to fall back to single-space behavior while keeping schema. Since alpha data is discarded, no data loss risk on full revert. Repositories degrade safely: with `SpaceContext` empty, `BaseTenantRepository` MUST throw (fail-closed), not return unscoped rows.

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Leaky query bypassing the mixin exposes cross-Space data | High | Integration test asserting isolation; fail-closed when `SpaceContext` empty; ESLint rule banning bare TypeORM repos |
| `@sisques-labs/nestjs-kit` base repos seal the query builder | Medium | Spike in design; wrap instead of subclass if sealed |
| `typeorm "^1.0.0"` pin is non-standard | Medium | Verify resolved version before migration tooling assumptions |
| Composite-unique semantics regress global uniqueness | Medium | Document that email/username are now Space-scoped; update auth flows/tests |
| `X-Space-ID` missing/forged on requests | Medium | `SpaceGuard` mandates header + membership check; 400 on missing, 403 on non-member |

## Open Questions

1. Spaces-per-user cap value and where enforced (`create-space`/`add-member`).
2. Is `SpaceMembership` a true aggregate or a child entity of `Space`? (design decision).
3. `nestjs-kit` base-repo extensibility — subclass vs wrap.
4. Resolved `typeorm` version and its migration API.
5. First-Space bootstrap: does account registration auto-create an owner Space, or is Space creation a separate post-auth step?
6. Should `auth_sessions` be Space-scoped or remain user-global since JWT is user-only?

## Dependencies

- `@sisques-labs/nestjs-kit` base repository extensibility.
- PostgreSQL composite unique index support (native).

## Success Criteria

- [ ] A user belonging to Space A cannot read/write Space B data through any repository.
- [ ] Request without valid `X-Space-ID` membership returns 403; missing header returns 400.
- [ ] Two Spaces can hold the same `email`/`username` without conflict.
- [ ] JWT payload remains `{ sub, email }` (no `spaceId`).
- [ ] `SpaceContext` empty → repositories fail closed (no unscoped data).
