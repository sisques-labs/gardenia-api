# Spec: Testing Infrastructure

**Change**: integration-tests
**Phase**: spec
**Date**: 2026-05-30
**Status**: done

---

## ADDED Requirements

### Requirement: Three-layer test pyramid

The project MUST maintain three distinct test layers with clear boundaries:

1. **Unit** — co-located `src/**/*.spec.ts`; no real database; no `@nestjs/testing`.
2. **Integration** — `test/integration/**/*.integration-spec.ts`; real PostgreSQL; `@nestjs/testing` allowed.
3. **API E2E** — `test/**/*.e2e-spec.ts`; full `AppModule` bootstrap with HTTP/GraphQL transport.

Each layer MUST have a dedicated npm script: `pnpm test` (unit), `pnpm test:integration` (integration), `pnpm test:e2e` (API E2E).

#### Scenario: Developer runs unit tests locally

- **WHEN** a developer runs `pnpm test`
- **THEN** Jest executes only co-located specs under `src/`
- **AND** no PostgreSQL connection is required
- **AND** the suite completes without `@nestjs/testing`

#### Scenario: Developer runs integration tests locally

- **WHEN** a developer runs `pnpm test:integration` with PostgreSQL available
- **THEN** Jest executes only specs matching `test/integration/**/*.integration-spec.ts`
- **AND** each spec connects to the test database configured in `test/helpers/env-setup.ts`

#### Scenario: CI runs all three layers

- **WHEN** the CI pipeline executes
- **THEN** unit tests, integration tests, and E2E tests MUST each run in separate jobs or steps
- **AND** all three MUST pass before merge

---

### Requirement: Integration test harness

The project MUST provide a shared integration bootstrap helper at `test/helpers/integration-bootstrap.ts` that:

- Creates a NestJS `TestingModule` with real TypeORM connection to PostgreSQL.
- Accepts a bounded-context module (or modules) as input — NOT full `AppModule` unless cross-context wiring is required.
- Returns a context object with `dataSource`, `spaceContext`, and `close()`.
- Reuses `test/helpers/env-setup.ts` for environment variable defaults.

#### Scenario: Bootstrap creates real DB connection

- **WHEN** an integration spec calls the bootstrap helper with `SpacesModule`
- **THEN** a live TypeORM `DataSource` connected to PostgreSQL is returned
- **AND** the module's repositories resolve through Nest DI with real TypeORM providers

#### Scenario: Bootstrap supports tenant context

- **WHEN** an integration spec wraps test logic in `spaceContext.run(spaceId, fn)`
- **THEN** tenant-aware repositories MUST scope queries to the given `spaceId`
- **AND** data from other spaces MUST NOT be returned

#### Scenario: Bootstrap cleanup

- **WHEN** an integration spec completes
- **THEN** calling `close()` MUST release the Nest application and database connections

---

### Requirement: Database isolation between integration tests

Integration specs MUST NOT share mutable database state across test cases within the same file.

The shared helper `truncateAll()` in `test/helpers/db-reset.ts` MUST truncate all application tables before each test case in integration specs.

#### Scenario: Test isolation via truncate

- **WHEN** an integration spec inserts data in test case A
- **AND** test case B runs afterward in the same file
- **THEN** test case B MUST NOT observe data inserted by test case A
- **AND** `truncateAll()` MUST be called in `beforeEach`

#### Scenario: Table registry maintenance

- **WHEN** a new TypeORM entity/table is added to the application
- **THEN** the table list in `truncateAll()` MUST be updated to include the new table
- **AND** integration tests MUST continue to provide full isolation

---

### Requirement: Local database setup

The project MUST support local PostgreSQL for integration and E2E tests via `docker-compose.test.yml` on port **5433** with database `gardenia_test`.

Scripts MUST be provided:

- `pnpm test:db:up` — starts the test Postgres container.
- `pnpm test:db:down` — stops the test Postgres container.
- `pretest:integration` and `pretest:e2e` — verify DB reachability before running suites.

#### Scenario: DB not running locally

- **WHEN** a developer runs `pnpm test:integration` without PostgreSQL reachable
- **THEN** the pretest check MUST fail with a clear message
- **AND** the message MUST include the command `docker compose -f docker-compose.test.yml up -d`

#### Scenario: DB running via compose

- **WHEN** a developer runs `pnpm test:db:up` followed by `pnpm test:integration`
- **THEN** integration tests MUST connect successfully to `localhost:5433`
- **AND** the suite MUST execute without manual env var configuration

---

### Requirement: CI integration test job

The CI pipeline MUST include a dedicated job that runs `pnpm test:integration` against a PostgreSQL 16 service container with the same credentials as local `docker-compose.test.yml`.

#### Scenario: CI integration job passes

- **WHEN** a pull request triggers CI
- **THEN** the integration job MUST start a Postgres 16 service on port 5433
- **AND** run `pnpm test:integration`
- **AND** report pass/fail independently of the E2E job

#### Scenario: CI integration job fails on regression

- **WHEN** an integration spec fails due to a repository regression
- **THEN** the integration CI job MUST fail
- **AND** the unit test job MAY still pass (mocked repos unaffected)

---

### Requirement: Architecture exception for @nestjs/testing

The architecture rule forbidding `@nestjs/testing` in unit tests MUST remain in force for `src/**/*.spec.ts`.

`@nestjs/testing` MUST be explicitly allowed in:

- `test/integration/**/*.integration-spec.ts`
- `test/**/*.e2e-spec.ts`
- `test/helpers/*.ts` bootstrap files

#### Scenario: Unit test rejects @nestjs/testing

- **WHEN** a developer adds `@nestjs/testing` import to a file under `src/**/*.spec.ts`
- **THEN** the change MUST be rejected by architecture review (and optionally ESLint)

#### Scenario: Integration test uses @nestjs/testing

- **WHEN** a developer creates a new file at `test/integration/spaces/space-repo.integration-spec.ts`
- **THEN** using `Test.createTestingModule` from `@nestjs/testing` MUST be permitted
- **AND** the spec MUST NOT be subject to the unit-test architecture rule

---

### Requirement: Pilot integration coverage for tenant isolation

At least **two** integration specs MUST validate tenant/space isolation at the repository persistence boundary before this change is considered complete (phase 2).

Each pilot spec MUST:

- Use real PostgreSQL (not mocks).
- Seed data in at least two distinct spaces.
- Assert that queries scoped to space A do not return data from space B.

#### Scenario: Space membership repo tenant isolation

- **WHEN** memberships exist for space A and space B
- **AND** `SpaceContext` is set to space A
- **THEN** a tenant-aware membership repository query MUST return only space A memberships

#### Scenario: Account repo composite uniqueness

- **WHEN** an account with email `user@example.com` exists in space A
- **AND** a second account with the same email is created in space B
- **THEN** the creation MUST succeed (composite `(spaceId, email)` uniqueness)
- **AND** creating a duplicate email within the same space MUST fail

---

### Requirement: Schema parity via migrations (phase 3)

After phase 3, all database-backed test suites (integration and E2E) MUST apply schema via TypeORM migrations (`migration:run`) instead of `synchronize: true`.

#### Scenario: Integration suite uses migrations

- **WHEN** the integration test harness initializes the database in phase 3+
- **THEN** it MUST run all pending migrations from `src/database/migrations/`
- **AND** `synchronize` MUST be `false`

#### Scenario: Migration bug detected in CI

- **WHEN** a migration fails to apply in the integration test bootstrap
- **THEN** the integration CI job MUST fail with the migration error visible in logs

---

### Requirement: Optional Testcontainers for local development (phase 4)

The project MAY support optional Testcontainers-based PostgreSQL startup for local development when the environment variable `USE_TESTCONTAINERS=1` is set.

When enabled:

- A Jest `globalSetup` MUST start a PostgreSQL container via `@testcontainers/postgresql`.
- The dynamic container port MUST be written to `DATABASE_PORT`.
- CI MUST NOT require Testcontainers (GHA services remain the CI default).

#### Scenario: Testcontainers local startup

- **WHEN** a developer sets `USE_TESTCONTAINERS=1` and runs `pnpm test:integration`
- **THEN** PostgreSQL MUST start automatically without `docker compose up`
- **AND** tests MUST connect using the dynamically assigned port

#### Scenario: CI without Testcontainers

- **WHEN** CI runs the integration job without `USE_TESTCONTAINERS`
- **THEN** tests MUST use the GHA Postgres service on port 5433
- **AND** no Testcontainers dependency MUST be required in CI

---

### Requirement: openspec and documentation update

The project MUST update `openspec/config.yaml` to reflect the new integration layer:

```yaml
integration: { available: true, tool: "jest + postgres" }
```

A README section MUST document the three test layers, local DB setup commands, and when to use each layer.

#### Scenario: openspec reflects integration layer

- **WHEN** phase 1 is complete
- **THEN** `openspec/config.yaml` MUST list `integration.available: true`
- **AND** MUST include the command `pnpm test:integration`

#### Scenario: Developer onboarding via README

- **WHEN** a new developer reads the testing section of the README
- **THEN** they MUST find instructions for starting test Postgres, running each test layer, and the distinction between integration and E2E tests
