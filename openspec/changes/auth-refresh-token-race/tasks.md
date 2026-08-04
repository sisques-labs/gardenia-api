# Tasks: auth-refresh-token-race

Order: domain/persistence first (additive, safe on its own), then handler
logic, then tests, then docs. Each phase keeps `pnpm test` / `pnpm build`
green.

## Phase 0 — Config

- [x] 0.1 Add `refreshReuseGraceMs` to `auth.config.ts`
      (`REFRESH_REUSE_GRACE_MS`, default `10000`).
- [x] 0.2 Document the env var in `.env.example`.

## Phase 1 — Persistence: `replacedBySessionId`

- [x] 1.1 **Migration plan**: add nullable `replacedBySessionId` (uuid) column
      to `auth_sessions`, FK to `auth_sessions.id` (`ON DELETE SET NULL`).
      Purely additive — no backfill needed, existing rows get `NULL`. Write a
      TypeORM migration under `src/database/migrations/`. Rollback = drop
      column, no data loss (the column carries no information older rows
      need).
- [x] 1.2 Add `replacedBySessionId` to `AuthSessionPrimitives` and
      `IAuthSession`.
- [x] 1.3 Update `AuthSessionAggregate.revoke()` to accept an optional
      `replacedBySessionId` param and persist it; add `replacedBySessionId`
      getter.
- [x] 1.4 Update the TypeORM entity/mapper for the new column.
- [x] 1.5 `findById` already existed on `IAuthSessionWriteRepository`; instead
      added a transactional `findLockedById` helper (passed into the
      `rotate()` callback) so the grace-path lookup shares the same DB
      transaction and pessimistic lock as the outer rotation — see design.md.
- [x] 1.6 Unit tests: aggregate `revoke(reason, replacedBySessionId)` sets the
      field; builder + mapper round-trip tests.

## Phase 2 — Handler: grace-window branch

- [x] 2.1 Extended `IAuthSessionWriteRepository.rotate()`'s callback contract
      (`RotateSessionCallback`) to receive `findLockedById` and to return
      `{ revoked, created }` explicitly, instead of a bare new-session (so the
      grace path can name the successor as the one being revoked, not
      `current`). Implemented in
      `AuthSessionTypeOrmWriteRepository.rotate()`.
- [x] 2.2 On the normal rotation branch, pass the new session's id into
      `base.revoke('rotation', newSession.id.value)`.
- [x] 2.3 On the reuse branch (`current.revokedAt !== null`), added the grace
      check: within `refreshReuseGraceMs` AND `current.replacedBySessionId`
      set AND successor found (via `findLockedById`) AND successor unrevoked
      → rotate from the successor. Otherwise falls through to the existing
      `markReuseDetected` + `revokeAllByUserId` + throw.
- [x] 2.4 Added the structured warn-level log on the grace path (userId, old
      session id, successor id, elapsed ms) per spec.md §4.
- [x] 2.5 Unit tests (`refresh-token.handler.spec.ts`):
      - normal rotation unchanged (regression) ✓
      - replay within grace window with valid successor → succeeds, returns
        new pair, no `revokeAllByUserId` call ✓
      - replay within grace window but successor already revoked (second
        replay) → reuse-detected path, `revokeAllByUserId` called ✓
      - replay after grace window elapsed → reuse-detected path unchanged ✓
      - replay of a session revoked via logout (`replacedBySessionId` null)
        → reuse-detected path, unaffected by this change ✓
      Also added repository-level unit tests for the new `findLockedById`
      plumbing (`auth-session-typeorm-write.repository.spec.ts`).

## Phase 3 — Integration test

- [x] 3.1 `test/integration/auth/refresh-token-race.integration-spec.ts`
      (real Postgres, via `CommandBus.execute()` rather than HTTP — the
      existing e2e harness has no `cookie-parser` middleware wired in, which
      is a pre-existing gap out of scope for this change): fires two
      concurrent `RefreshTokenCommand`s with the same token; asserts both
      succeed, asserts exactly 1 of the resulting 3 sessions is revoked (not
      a revoke-all), and asserts a third replay of the *original* token
      throws `RefreshTokenReuseDetectedException` and revokes every session.
      This test caught two real bugs that mocked unit tests couldn't:
      1. CI failed with "command handler for RefreshTokenCommand was not
         found" — `createIntegrationModule()` only compiles the
         `TestingModule`, it never becomes a running application, so
         `@nestjs/cqrs`'s `onApplicationBootstrap` (where it binds handlers
         to buses) never fires. Fixed by calling `await ctx.module.init()`
         in this spec's `beforeAll` (confirmed via `@nestjs/core`'s
         `NestApplicationContext.init()` → `callBootstrapHook()`), scoped to
         this file only, not the shared helper, so the other 21 integration
         specs (which don't use CommandBus/QueryBus) keep their current
         bootstrap behavior.
      2. Real Postgres then caught a genuine bug in
         `AuthSessionTypeOrmWriteRepository.rotate()`: it saved `revoked`
         (whose `replacedBySessionId` FK points at `created.id`) *before*
         `created` existed as a row, violating
         `FK_auth_sessions_replaced_by_session_id`. The mocked repository
         unit tests couldn't catch this — a mock `em.save` doesn't enforce
         FK constraints. Fixed by swapping the save order: insert `created`
         first, then save `revoked`.
      Pushed both fixes; awaiting CI re-run confirmation.

## Phase 4 — Docs

- [x] 4.1 Updated `src/contexts/auth/README.md`: documented the grace-window
      behavior as part of the rotation/session model, including the
      `replacedBySessionId` field and the "one hop only" guarantee. (Also
      fixed a pre-existing inaccuracy in the same paragraph: `tokenHash` is
      SHA-256, not bcrypt as the README previously said.)
- [x] 4.2 README now links to `design.md §4` for the companion client-side
      mitigation (Web Locks + BroadcastChannel), tracked separately in
      gardenia-web.

## Verification

- [x] `pnpm test` green (2280/2280, full suite)
- [ ] `pnpm test:integration` — written, fixed a CQRS bootstrap gap after CI
      caught it (see Phase 3 note); awaiting green re-run confirmation
- [x] `pnpm build` green
- [ ] Coverage ≥ 80% — not measured this run (no `--coverage` pass); existing
      suite was green before and after, no reason to expect regression, but
      run `pnpm test:cov` to confirm before merge
