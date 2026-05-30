# Exploration: Integration tests for gardenia-api

**Date**: 2026-05-30
**Status**: done

## Current Architecture Summary

gardenia-api is a NestJS 10 application using DDD + CQRS + Hexagonal architecture. Bounded contexts: `auth`, `users`, `spaces`. Persistence: TypeORM + PostgreSQL. Transport: GraphQL (Apollo code-first) + REST. Testing: Jest 29, supertest, pnpm 9.15.4.

### Test Layers Today

| Layer | Status | Tool | Location |
|-------|--------|------|----------|
| Unit | ✅ ~73 specs | Jest + `jest.Mocked<T>`, no DB | `src/**/*.spec.ts` |
| Integration (explicit) | ❌ | — | `openspec/config.yaml` marks `integration: false` |
| E2E | ✅ | Jest + supertest + real Postgres | `test/**/*.e2e-spec.ts` |

In practice, **E2E tests already behave as full-stack integration tests**: they bootstrap `AppModule`, connect to real PostgreSQL, and exercise GraphQL/REST endpoints.

### Unit Tests

- Architecture rule: manual instantiation, mocks, **no** `@nestjs/testing` (exception: `auth.module.spec.ts` for module wiring verification).
- TypeORM repositories tested with mocked `Repository<E>` — no real SQL or tenant proxy validation.

### E2E Bootstrap (`test/helpers/app-bootstrap.ts`)

- `Test.createTestingModule` with explicit `TypeOrmModule.forRoot` (entities listed, `synchronize: true`) + `AppModule`.
- Same app as production: pipes, filters, `api` prefix, GraphQL.
- Helpers: `env-setup.ts` (defaults match `docker-compose.test.yml`), `db-reset.ts` (`TRUNCATE` of 4 tables), `graphql-client.ts`.

### PostgreSQL in Tests

- **Local**: `docker compose -f docker-compose.test.yml up -d` → port **5433**, DB `gardenia_test`.
- **CI** (`.github/workflows/ci.yml`): job `e2e` with `services.postgres` (same credentials), then `pnpm test:e2e`.
- **pre-push** (Husky): only `pnpm build && pnpm test` — E2E not included.

### Schema in Tests

- `DATABASE_SYNCHRONIZE=true` / `synchronize: true` in E2E harness.
- Production: `synchronize: false` with **7 migrations** in `src/database/migrations/`.
- Tests do **not** run `migration:run`.

### Isolation

- `truncateAll()` in `beforeEach` in some specs; others use only `beforeAll`.
- `jest-e2e.json`: `maxWorkers: 1`, `testTimeout: 30000`.

---

## Key Files

| File | Role |
|------|------|
| `package.json` | `test`, `test:e2e`; no `test:integration` |
| `test/jest-e2e.json` | Separate Jest project for E2E |
| `test/helpers/app-bootstrap.ts` | `createE2EApp()` — main harness |
| `test/helpers/env-setup.ts` | Env vars before module load |
| `test/helpers/db-reset.ts` | Cleanup between tests |
| `docker-compose.test.yml` | Postgres 16 for local dev |
| `.github/workflows/ci.yml` | Unit in `build`; E2E in separate job |
| `openspec/config.yaml` | Documents unit + e2e; integration = false |

---

## Gaps

1. **No intermediate layer** between unit (mocks) and full HTTP (E2E).
2. **Repos/handlers with real DB** not covered; SQL/tenant regression risk stays in E2E or mock confidence.
3. **Schema parity**: `synchronize` in tests ≠ migrations in prod.
4. **`truncateAll`** can go stale when new tables/entities are added.
5. **Double TypeORM config** in `createE2EApp` vs `AppModule` / `postgres.config` — divergence risk.
6. **Local DX**: manual `docker compose up`; no `pretest:e2e` script.
7. **Naming**: specs say "E2E" but many teams would call this "API integration tests".

---

## Options Evaluated

| Approach | Pros | Cons | Effort |
|----------|------|------|--------|
| **1. Formalize E2E as API integration** | Already implemented; CI stable; covers multitenant end-to-end | Slow; doesn't isolate repos; `synchronize` ≠ migrations | **Low** |
| **2. New `test/integration` layer** | Fills the gap; faster than E2E; fits DDD layering | New Jest config + harness; documented exception for `@nestjs/testing` | **Medium** |
| **3. Testcontainers** (`@testcontainers/postgresql`) | No `docker compose up`; dynamic ports | Docker required; slow startup; redundant with GHA services if both kept | **Medium-high** |
| **4. docker-compose + GHA services (status quo)** | Already works; no new deps | Local friction; port 5433 conflicts | **Low** |
| **5. SQLite in-memory** | Fast in theory | Wrong fit: Postgres, tenant SQL, migrations | **Not recommended** |
| **6. Migrations in tests** | Prod parity; catches migration bugs | Slower; must align with end of `synchronize` | **Medium** (complement) |

### Testcontainers Specifically

Fits if you want a single flow: `pnpm test:e2e` with no compose documentation. CI already has GHA Postgres — Testcontainers only makes sense if you **unify** local and CI in one `globalSetup`, or if the team rejects compose dependency.

### NestJS TestingModule for Integration

Standard pattern: minimal module (`TypeOrmModule.forRoot` + one context + real handler/repo). Partially conflicts with unit architecture rule; needs explicit exception: *integration specs may use `@nestjs/testing`; unit specs may not*.

---

## Recommendation

**Pragmatic hybrid approach:**

1. **Short term**: Recognize `pnpm test:e2e` as API integration tests. Improve DX with `pretest:e2e` script and keep `truncateAll` updated.

2. **Medium term**: Add **`test/integration`** with own Jest config (`test/jest-integration.json`, `pnpm test:integration`), reusing `env-setup.ts` and `truncateAll`, focused on:
   - TypeORM repos with real Postgres and `SpaceContext` (ALS).
   - Critical handlers (tenant isolation) without supertest.

3. **Testcontainers**: **Optional for local**, not mandatory if team accepts compose. CI keeps GHA services unless unified bootstrap is desired.

4. **Migrations**: Plan to replace `synchronize: true` with `migration:run` (cross-cutting to all DB test suites).

**Do not use SQLite** in this project.

---

## Open Questions

1. Explicit repo/handler layer, or expand existing E2E only?
2. CI speed vs migration parity (slower but accurate)?
3. Testcontainers for local only, or unify CI too?
4. Rename `e2e` to `api-integration` in docs?
5. Include DB tests in pre-push?

---

## Risks

- Divergence between `createE2EApp` TypeORM config and `AppModule` / `postgres.config`.
- Stale table list in `truncateAll`.
- Triple maintenance if Testcontainers + compose + GHA services coexist without a clear primary path.
- Undocumented `@nestjs/testing` exception in integration → style drift.
