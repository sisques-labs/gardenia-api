# Tasks: Migrate Gardenia to Sisques Account (P1 + P2 only — P3 excluded)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~950–1250 (2 migrations, 1 new strategy+guard, 4 ports/adapters, 2 command handlers modified, 1 aggregate modified, ~20 spec files, e2e) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR1 → PR2 → PR3 → PR4 (see work units) |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | P1a: JWKS strategy, guard chain, env/config | PR 1 | `pnpm test -- sisques-account-jwt.strategy.spec.ts` | N/A — unit specs, mocked JWKS | `SISQUES_ACCOUNT_AUTH_ENABLED=false` + revert commit |
| 2 | P1b: `external_subject` linking (domain/infra/command) | PR 2 | `pnpm test -- account.aggregate.spec.ts link-external-subject.handler.spec.ts` | `pnpm test:integration -- account-typeorm-write.repository.integration-spec.ts` | Revert commit + `pnpm migration:revert` (drops column/index) |
| 3 | P2a: tenant-id parity, ports/adapters, `CreateSpaceCommandHandler` | PR 3 | `pnpm test -- create-space.handler.spec.ts` | `pnpm test:integration -- account-api-tenant.adapter.integration-spec.ts` | `SISQUES_SPACE_TENANT_SYNC_ENABLED=false` + revert |
| 4 | P2b: membership sync guard, add/remove-member platform path, e2e + regression | PR 4 | `pnpm test -- membership-projection-sync.guard.spec.ts` | `pnpm test:e2e -- auth-dual-issuer.e2e-spec.ts` | Revert commit + `pnpm migration:revert` |

## Phase 1: P1 Foundation — dependency, env, JWKS strategy

- [x] 1.1 Add `jwks-rsa` to `package.json`/`pnpm-lock.yaml`.
- [x] 1.2 Add `SISQUES_ACCOUNT_*` vars + `SISQUES_ACCOUNT_AUTH_ENABLED` flag to `src/core/config/env.validation.ts` (zod) and `.env.example`.
- [x] 1.3 Create `src/core/config/sisques-account.config.ts` (`registerAs`, mirrors `event-store.config.ts` pattern).
- [x] 1.4 Create `src/contexts/auth/infrastructure/strategies/sisques-account-jwt.strategy.ts` — `PassportStrategy(Strategy,'sisques-account')`, `passportJwtSecret()`, `algorithms:['RS256']`, `issuer`, `audience`, `ignoreExpiration:false`; mirrors shape (read-only reference) of `src/contexts/auth/infrastructure/strategies/jwt.strategy.ts`.
- [x] 1.5 Modify `src/contexts/auth/infrastructure/guards/jwt-auth.guard.ts` → `AuthGuard(['jwt','sisques-account'])` gated by `SISQUES_ACCOUNT_AUTH_ENABLED`.
- [x] 1.6 Register strategy + provider in `src/contexts/auth/auth.module.ts` (named const array per `rules.apply`).

## Phase 2: P1 Account Linking (domain + infra + application)

- [x] 2.1 Create migration `src/database/migrations/1780000000027-AddExternalSubjectToAccounts.ts` — nullable `external_subject`, partial global unique index; up/down per design.
- [x] 2.2 Create `src/contexts/auth/domain/value-objects/external-subject/external-subject.vo.ts` (+`.spec.ts`).
- [x] 2.3 Create `src/contexts/auth/domain/events/account-external-subject-linked/account-external-subject-linked.event.ts`.
- [x] 2.4 Modify `account.aggregate.ts`, `account.builder.ts`, `account.interface.ts`, `account.primitives.ts` — `+_externalSubject`; `linkExternalSubject()` emits the event (never in constructor).
- [x] 2.5 Modify `account.entity.ts`, `account-typeorm.mapper.ts`, `account-typeorm-write.repository.ts`, `account-write.repository.ts` (interface) — `+external_subject` column/mapping, `findByExternalSubject()` bypassing tenant proxy like `findByEmail`.
- [x] 2.6 Create `src/contexts/auth/infrastructure/services/sisques-account-principal.resolver.ts` (+`.spec.ts`) — subject→principal; drives first-link + auto-provision (mirrors, read-only reference, `login-with-oauth.handler.ts`'s find-or-create/auto-link-by-verified-email shape).
- [x] 2.7 Create `src/contexts/auth/application/commands/link-external-subject/` (command + handler + spec) — link-by-verified-email, no password/role mutation.
- [x] 2.8 Update `src/contexts/auth/README.md` per `rules.apply`.

## Phase 3: P1 appRole Per-Request + Strategy Claim Handling

- [x] 3.1 In `sisques-account-jwt.strategy.ts`, `validate()` returns exactly `{userId,email,appRole}`; `appRole` resolved via account-projection lookup (same row as subject lookup); discard `platformAdmin`/`tenants[]`.
- [x] 3.2 Unit-verify `jwt.strategy.ts` (native path) is untouched — no PR edit, confirm by diff review only.

## Phase 4: P1 Tests

- [x] 4.1 Unit: `sisques-account-jwt.strategy.spec.ts` — valid/invalid signature, exact `{userId,email,appRole}` key set, `platformAdmin`/`tenants[]` dropped (mirror `jwt.strategy.spec.ts` lock-in cases).
- [x] 4.2 Unit: `account.aggregate.spec.ts` — `linkExternalSubject()` emits event once, never from constructor.
- [x] 4.3 Unit: `sisques-account-principal.resolver.spec.ts` — link-by-email, already-linked, auto-provision paths.
- [x] 4.4 Integration: partial unique index rejects duplicate `external_subject`, permits many NULLs; `findByExternalSubject` bypasses tenant proxy.
- [x] 4.5 E2E: platform token authenticates a protected endpoint; native token unaffected (dual-issuer).

## Phase 5: P2 Migrations, Ports & Adapters

- [x] 5.1 Create migration `src/database/migrations/1780000000028-AddSpaceTenantMapping.ts` — `spaces.external_tenant_id` (nullable, unique partial), `space_memberships.synced_at`.
- [x] 5.2 Create `src/contexts/spaces/application/ports/tenant-provisioning.port.ts` — `createTenant(callerAccessToken, {name}): Promise<string>`.
- [x] 5.3 Create `src/contexts/spaces/application/ports/tenant-membership-query.port.ts` — `ITenantMembershipQueryPort.listMembers()` per design's Interfaces section.
- [x] 5.4 Create `src/contexts/spaces/infrastructure/adapters/account-api-tenant.adapter.ts` (+spec) — `HttpService` → `POST /v1/tenants`.
- [x] 5.5 Create `src/contexts/spaces/infrastructure/adapters/account-api-tenant-membership.adapter.ts` (+spec) — `HttpService` → `GET /v1/tenants/:id/members`, relays caller's raw bearer token.
- [x] 5.6 Modify `spaces/infrastructure/persistence/typeorm/entities/space.entity.ts`, `space-membership.entity.ts` — `+external_tenant_id`, `+synced_at` (nullable columns; deliberately NOT yet mapped by `SpaceTypeOrmMapper`/`SpaceMembershipTypeOrmMapper` or the domain aggregate — see Deviations).
- [x] 5.7 Register ports/adapters in `src/contexts/spaces/spaces.module.ts` (named const arrays).

## Phase 6: P2 `CreateSpaceCommandHandler` — D7 Two Paths

- [ ] 6.1 Modify `src/contexts/spaces/application/commands/create-space/create-space.handler.ts`: **platform-linked path** — when the acting request carries a verified platform bearer token, call `ITenantProvisioningPort.createTenant()` first, `withId(tenantId)`, set `external_tenant_id = tenantId`.
- [ ] 6.2 Same handler: **native fallback path** — no platform token in hand → today's behavior unchanged (locally-generated `space.id`, `external_tenant_id` left NULL).
- [ ] 6.3 Update `create-space.handler.spec.ts` — cover both paths explicitly (platform-linked and native fallback).

## Phase 7: P2 Membership Sync Guard + Add/Remove Member

- [ ] 7.1 Create `src/contexts/spaces/transport/guards/membership-projection-sync.guard.ts` (+spec) — runs before `SpaceGuard`; no-ops unless platform-issued + row missing/stale beyond TTL; dispatches sync command via `CommandBus` only.
- [ ] 7.2 Create `src/contexts/spaces/application/commands/sync-space-membership-projection/` (command+handler+spec) — relays caller's token to `listMembers()`; upsert on 200, **delete row on 403**, leave untouched on 5xx/timeout with existing row, write nothing on 5xx/timeout with no row (fail-closed).
- [ ] 7.3 Modify `add-member.handler.ts`, `remove-member.handler.ts` — for platform-linked Spaces, call the platform membership API before/after the local write per the `spaces` delta; non-platform-linked Spaces unchanged.
- [ ] 7.4 Wire `MembershipProjectionSyncGuard` ahead of `SpaceGuard` in the relevant transport module; confirm `src/contexts/spaces/transport/guards/space.guard.ts` (read-only) receives no edits.
- [ ] 7.5 Update `src/contexts/spaces/README.md` per `rules.apply`.

## Phase 8: P2 Tests + Regression Lock-In

- [ ] 8.1 Unit: `membership-projection-sync.guard.spec.ts` — staleness, fail-closed, delete-on-403.
- [ ] 8.2 Unit: `add-member.handler.spec.ts`/`remove-member.handler.spec.ts` — platform-linked vs. non-linked branches.
- [ ] 8.3 Integration: `sync-space-membership-projection` reconcile + delete-on-403 against real Postgres.
- [ ] 8.4 E2E: platform token with exactly one `tenants` entry and **no** `X-Space-ID` → `400` (never defaulted).
- [ ] 8.5 Run `pnpm test -- space.guard.spec.ts` and `resolve-jwt-tenant-conflict`'s lock-in specs (read-only, unmodified) — confirm no regression.

## Spec-to-Test Traceability (key scenarios)

| Requirement | Test task |
|---|---|
| Platform JWT Verification via JWKS | 4.1 |
| Dual-Issuer Acceptance | 4.5 |
| Subject Linking / Auto-Provisioning | 4.3 |
| No Local Re-Minting | 4.5 (assert no session row created) |
| `accounts.external_subject` uniqueness | 4.4 |
| appRole per-request resolution | 3.1, 4.1 |
| Space Id Adopts Tenant Id (D6/D7) | 6.3 |
| Platform Write Authority for Membership | 8.2, 8.3 |
| Fail-Closed Consistency | 8.1, 8.3 |
| Tenant-Resolution-Policy Compliance | 8.4, 8.5 |
