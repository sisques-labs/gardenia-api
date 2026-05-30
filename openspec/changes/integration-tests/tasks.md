# Tasks: Integration test strategy

**Change**: integration-tests
**Phase**: tasks
**Date**: 2026-05-30
**Status**: in-progress
**Spec**: `openspec/changes/integration-tests/specs/testing-infrastructure/spec.md`
**Design**: `openspec/changes/integration-tests/design.md`

---

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~400–600 |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes — one PR per phase |
| Suggested split | Phase 1 PR, Phase 2 PR, Phase 3 PR (optional 4–5 later) |
| DB schema changes | None — test infrastructure only |

---

## Execution Order

```
Phase 1 (Foundation)     → Phase 2 (Pilot specs) → Phase 3 (Migrations)
                                                    → Phase 4 (Testcontainers, optional)
                                                    → Phase 5 (E2E alignment)
```

Phases 4 and 5 are independent of each other but both depend on Phase 3.

---

## 1. Foundation

- [x] 1.1 Create `test/jest-integration.json` with `testRegex: test/integration/.*\.integration-spec\.ts$`, `setupFiles`, `maxWorkers: 1`, `testTimeout: 30000`, and path aliases matching `jest-e2e.json`
- [x] 1.2 Add npm scripts to `package.json`: `test:integration`, `pretest:integration`, `pretest:e2e`, `test:db:up`, `test:db:down`
- [x] 1.3 Create `scripts/check-db.js` — TCP probe to `DATABASE_HOST:DATABASE_PORT`; on failure print `docker compose -f docker-compose.test.yml up -d` and exit 1
- [x] 1.4 Create `test/helpers/integration-bootstrap.ts` with `createIntegrationModule(options)` returning `{ module, dataSource, spaceContext, close }` using `TypeOrmModule.forRoot` with `synchronize: true` (phase 1)
- [x] 1.5 Create placeholder directory `test/integration/` with a `.gitkeep` or empty README so the folder exists in git
- [x] 1.6 Update `openspec/config.yaml` — set `integration: { available: true, tool: "jest + postgres" }` and add `integration_command: "pnpm test:integration"`
- [x] 1.7 Update `.claude/skills/architecture/SKILL.md` — document `@nestjs/testing` exception for `test/integration/` and `test/` only; unit tests in `src/` remain forbidden
- [x] 1.8 Add CI job `integration` in `.github/workflows/ci.yml` — Postgres 16 service on port 5433, run `pnpm test:integration` with same env vars as `e2e` job
- [x] 1.9 Add README section "Testing" documenting the three layers, `pnpm test:db:up`, and when to use unit vs integration vs E2E
- [x] 1.10 Verify locally: `pnpm test:db:up && pnpm test:integration` runs (empty suite passes); `pnpm test` and `pnpm test:e2e` still green

---

## 2. Pilot integration specs

- [ ] 2.1 Create `test/integration/spaces/space-membership-typeorm-write.integration-spec.ts` — bootstrap `SpacesModule`, seed memberships in two spaces, assert tenant-scoped queries via `spaceContext.run()`
- [ ] 2.2 Create `test/integration/auth/account-typeorm-write.integration-spec.ts` — bootstrap `AuthModule` (or minimal auth infra module), assert composite `(spaceId, email)` uniqueness: same email in different spaces succeeds, duplicate in same space fails
- [ ] 2.3 Create `test/integration/users/user-typeorm-read.integration-spec.ts` — bootstrap `UsersModule`, seed users in two spaces, assert read repo returns only rows for active `SpaceContext`
- [ ] 2.4 Ensure all pilot specs use `beforeEach(() => truncateAll(dataSource))` for isolation
- [ ] 2.5 Run full suite locally: `pnpm test && pnpm test:integration && pnpm test:e2e` — all green
- [ ] 2.6 Confirm CI integration job passes with pilot specs on a PR

---

## 3. Migration parity

- [ ] 3.1 Create `test/helpers/test-data-source.ts` with `bootstrapTestDataSource()` — builds `DataSource` from `src/database/data-source.ts` config, `synchronize: false`, runs `runMigrations()`
- [ ] 3.2 Update `integration-bootstrap.ts` to use `bootstrapTestDataSource()` instead of `synchronize: true`
- [ ] 3.3 Remove `DATABASE_SYNCHRONIZE: 'true'` from integration CI job env vars
- [ ] 3.4 Run `pnpm test:integration` locally against migrations — all pilot specs green
- [ ] 3.5 Add CI step or smoke check: migration apply succeeds before integration tests run (fail fast with clear error)

---

## 4. Optional Testcontainers (local only)

- [ ] 4.1 Add devDependency `@testcontainers/postgresql`
- [ ] 4.2 Create `test/global-setup.ts` — when `USE_TESTCONTAINERS=1`, start Postgres container and set `process.env.DATABASE_PORT` to dynamic port
- [ ] 4.3 Create `test/global-teardown.ts` — stop container on suite completion
- [ ] 4.4 Wire `globalSetup` / `globalTeardown` in `jest-integration.json` (and optionally `jest-e2e.json`)
- [ ] 4.5 Document `USE_TESTCONTAINERS=1` in README as optional local alternative to compose
- [ ] 4.6 Verify: `USE_TESTCONTAINERS=1 pnpm test:integration` passes without manual `docker compose up`

---

## 5. E2E alignment

- [ ] 5.1 Update `test/helpers/app-bootstrap.ts` — switch `createE2EApp()` to use `bootstrapTestDataSource()` / migrations instead of `synchronize: true`
- [ ] 5.2 Remove duplicate `TypeOrmModule.forRoot` from `createE2EApp()` where possible — rely on `AppModule` TypeORM config + test env vars
- [ ] 5.3 Remove `DATABASE_SYNCHRONIZE: 'true'` from E2E CI job env vars
- [ ] 5.4 Run `pnpm test:e2e` locally and in CI — all existing E2E specs green with migrations
- [ ] 5.5 Optional: add npm script alias `test:api` → `test:e2e` for documentation clarity

---

## 6. Maintenance hardening (optional, post-adoption)

- [ ] 6.1 Add ESLint `no-restricted-imports` rule blocking `@nestjs/testing` in `src/**/*.spec.ts`
- [ ] 6.2 Add comment or constant in `db-reset.ts` documenting that the table list MUST be updated when new entities are added
- [ ] 6.3 Archive change: run `/sdd-verify` then `/sdd-archive` to merge delta spec into `openspec/specs/testing-infrastructure/spec.md`
