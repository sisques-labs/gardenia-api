# Proposal: Integration test strategy for gardenia-api

## Why

The project has ~73 unit tests with mocked repositories and working E2E tests against real PostgreSQL, but **no middle layer** between them. TypeORM repositories, tenant proxies, and CQRS handlers are never exercised against a real database without going through HTTP/GraphQL. Tests also use `synchronize: true` while production relies on migrations, creating schema drift risk. Adding a formal integration layer now — while the model is still small — is cheaper than retrofitting later.

## What Changes

- Add a new **integration test layer** at `test/integration/**/*.integration-spec.ts` with `pnpm test:integration`.
- Add integration bootstrap helper (`test/helpers/integration-bootstrap.ts`) for slim bounded-context modules with real Postgres.
- Add CI job `integration` (parallel to existing `e2e`, same Postgres service).
- Document three-layer pyramid: **unit → integration → API E2E** in README and `openspec/config.yaml`.
- Extend `truncateAll()` with a maintainable entity/table registry.
- Add DB reachability checks (`pretest:integration`, `pretest:e2e`) with clear compose instructions.
- Add optional Testcontainers support behind `USE_TESTCONTAINERS=1` (local only, phase 4).
- Migrate DB-backed suites from `synchronize: true` to `migration:run` in phased rollout.
- Document architecture exception: `@nestjs/testing` allowed in `test/integration/` and E2E, forbidden in `src/**/*.spec.ts`.
- Keep existing E2E naming and scripts (`test:e2e`); document them as "API integration tests".

## Capabilities

### New Capabilities

- `testing-infrastructure`: Test layers, harness APIs, DB lifecycle, env vars, CI jobs, architecture exceptions, naming conventions (`*.integration-spec.ts`).

### Modified Capabilities

- None — auth/users/spaces behavioral requirements unchanged; only how persistence is verified.

## Impact

| Area | Impact |
|------|--------|
| `test/integration/` | **New** directory and specs |
| `test/helpers/integration-bootstrap.ts` | **New** harness |
| `test/helpers/db-reset.ts` | **Modified** — entity/table registry |
| `test/jest-integration.json`, `package.json` scripts | **New** |
| `.github/workflows/ci.yml` | **Modified** — integration job |
| `docker-compose.test.yml` | Docs / optional health wait script |
| `openspec/config.yaml` | **Modified** — `integration.available: true` |
| `.claude/skills/architecture/SKILL.md` | **Modified** — integration exception |
| `test/helpers/app-bootstrap.ts` | **Later** — migrations, dedupe TypeORM |
| `src/contexts/*/infrastructure/persistence/**/*.spec.ts` | **Unchanged** — remain unit mocks |

## Rollback Plan

1. Remove `test/integration/`, `jest-integration.json`, and `test:integration` script.
2. Revert CI integration job and `openspec/config.yaml` flag.
3. Revert architecture skill exception.
4. No production runtime or schema rollback required — test-only change.

## Decisions (from exploration)

| Topic | Decision |
|-------|----------|
| Repo/handler layer vs E2E only | **Both** — integration for repos; E2E for HTTP/GraphQL contracts |
| CI speed vs migration parity | **Parity in phases 2–3**; accept slightly slower CI |
| Testcontainers | **Local optional only**; CI keeps GHA services |
| Rename e2e → api-integration | **Docs + optional alias** now; physical rename deferred |
| DB tests on pre-push | **No** — unit only; integration documented for local pre-PR |

## Implementation Phases (summary)

1. **Foundation** — Jest config, bootstrap, CI job, docs, openspec config update.
2. **Pilot specs** — 2–4 tenant-sensitive TypeORM repo tests.
3. **Migration parity** — `bootstrapTestDataSource()` + `migration:run` for integration suite.
4. **Optional Testcontainers** — `globalSetup` behind env flag.
5. **E2E alignment** — migrations in E2E; reduce duplicate TypeORM in `app-bootstrap.ts`.
