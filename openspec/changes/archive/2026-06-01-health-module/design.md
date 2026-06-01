# Technical Design — health-module

## 1. Overview

A public liveness endpoint `GET /api/health` returning `{ status: 'ok', timestamp: <ISO> }`.
The endpoint is a thin, dependency-free HTTP handler — no CQRS bus, no database, no domain
model. It lives in `src/core/` as cross-cutting infrastructure and bypasses both global
guards via a single `@SkipSpace()` decorator.

## 2. Architecture Approach

- **Pattern**: Plain NestJS controller + module. No CQRS, no TypeORM, no application/domain
  layers. The handler builds the response in-process (4 lines). This is intentional: a
  liveness probe must NOT depend on the DB or any downstream service, otherwise it becomes a
  readiness/health-aggregate check and can report the process as dead when it is merely
  degraded.
- **Layering**: Single transport layer. There is no business logic to separate, so a
  domain/application split would be ceremony with zero benefit (screaming architecture says
  the structure should reflect what the code DOES — here it does "answer 200 OK").
- **Boundary**: The module exposes only the controller. Nothing imports from `health/`; it is
  a leaf wired into `AppModule`.

## 3. File Tree (exact paths)

```
src/core/health/
├── health.module.ts
├── controllers/
│   ├── health.controller.ts
│   └── health.controller.spec.ts
└── dtos/
    └── health-response.dto.ts
```

Plus:
- Modify `src/app.module.ts` — add `HealthModule` to `imports`.
- New E2E: `test/e2e/health/health.e2e-spec.ts`.

## 4. Component Design

### 4.1 `health.module.ts`

```ts
import { Module } from '@nestjs/common';
import { HealthController } from './controllers/health.controller';

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
```

- No `CqrsModule`, no `TypeOrmModule`, no providers, no exports.
- A bare module declaring a single controller is the minimal correct unit.

### 4.2 `dtos/health-response.dto.ts`

```ts
import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok', description: 'Liveness status of the API process' })
  status: string;

  @ApiProperty({
    example: '2026-06-01T08:15:18.000Z',
    description: 'ISO-8601 UTC timestamp the response was generated',
  })
  timestamp: string;
}
```

- Mirrors the project convention seen in `*-rest-response.dto.ts`: a plain class with
  `@ApiProperty()` on each field so Swagger documents the response shape.
- `status` is typed `string` (not a literal/enum) to keep the DTO open for future values
  (e.g. `degraded`) without an API-breaking type change — values are out of scope here.

### 4.3 `controllers/health.controller.ts`

```ts
import { Controller, Get, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { SkipSpace } from '../../../shared/decorators/skip-space.decorator';
import { HealthResponseDto } from '../dtos/health-response.dto';

@ApiTags('health')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  @Get()
  @SkipSpace()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({ status: 200, description: 'API process is alive' })
  check(): HealthResponseDto {
    this.logger.debug('Health check requested');
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
```

Decorator contract (exact):
- `@ApiTags('health')` — Swagger grouping (matches `@ApiTags('auth')` convention).
- `@Controller('health')` — combined with the `api` global prefix → `/api/health`.
- `@Get()` on the method (no sub-path) → resolves to the controller root.
- `@SkipSpace()` on the method — see §6.
- `@HttpCode(HttpStatus.OK)` — explicit 200 (matches `auth.controller.ts` style; a bare
  `@Get` already defaults to 200, but explicitness mirrors the codebase and documents intent).
- `Logger` — instantiated as `private readonly logger = new Logger(HealthController.name)`,
  the project's standard NestJS logger pattern (per-class named logger).
- No `@ApiBearerAuth()` — the route is public, so advertising bearer auth in Swagger would be
  misleading.

Import path note: `SkipSpace` is imported relative from `src/core/health/controllers/` to
`src/shared/decorators/`, i.e. `../../../shared/decorators/skip-space.decorator`. (The `@shared`
alias is not used consistently across the repo for this decorator — `auth.controller.ts` uses a
relative path — so a relative path is acceptable; tasks may switch to the alias if preferred.)

## 5. Data Flow

```
HTTP GET /api/health
  → OptionalJwtAuthGuard (APP_GUARD)   ─┐ both short-circuit on SKIP_SPACE_KEY
  → SpaceGuard          (APP_GUARD)    ─┘ → no JWT, no X-Space-ID required
  → SpaceInterceptor    (APP_INTERCEPTOR) → no spaceId frame needed (skip path)
  → HealthController.check()
      builds { status: 'ok', timestamp: new Date().toISOString() }
  → 200 OK + JSON body
```

No I/O, no async, no external calls. The handler is synchronous and pure except for
`Date.now()`.

## 6. Integration Points

### 6.1 Global guards bypass (the critical decision)

`AppModule` registers two global `APP_GUARD`s in order: `OptionalJwtAuthGuard` then
`SpaceGuard`, plus a `SpaceInterceptor`. A single `@SkipSpace()` sets `SKIP_SPACE_KEY`
metadata (`src/shared/decorators/skip-space.decorator.ts`). Both guards read this key and
short-circuit (verified in proposal: `optional-jwt-auth.guard.ts:26`, `space.guard.ts:35`).
Therefore **one** decorator makes the route fully public — no separate `@Public()` and no
`X-Space-ID` header are needed. This is the same mechanism `auth.controller.ts` uses for
`register`/`login`/`refresh`/`logout`.

### 6.2 `app.module.ts` change

Add the import and register the module:

```ts
import { HealthModule } from '@core/health/health.module';
// ...
@Module({
  imports: [
    // ...existing imports
    PlantsModule,
    HealthModule,
  ],
  // providers unchanged
})
export class AppModule {}
```

Uses the `@core` path alias (consistent with existing `@core/config/*` imports in this file).

### 6.3 Global prefix

`main.ts:14` calls `app.setGlobalPrefix('api')`, and `createE2EApp()` replicates this
(`app-bootstrap.ts:27`). So both runtime and E2E resolve the route at `/api/health`.

## 7. Test Design

### 7.1 Unit test — `controllers/health.controller.spec.ts`

- **Instantiation**: `const controller = new HealthController();` directly. NO
  `Test.createTestingModule` — the controller has zero dependencies, so DI bootstrapping
  would be pure overhead and slower.
- **Assertions**:
  1. `status` equals `'ok'`.
  2. `timestamp` is a non-empty string.
  3. `timestamp` is a valid ISO-8601 string — assert
     `new Date(result.timestamp).toISOString() === result.timestamp` (round-trip equality
     proves canonical ISO format), and/or match `/^\d{4}-\d{2}-\d{2}T.*Z$/`.
  4. The returned object has exactly the keys `status` and `timestamp`
     (`expect(Object.keys(result).sort()).toEqual(['status', 'timestamp'])`) to lock the
     response shape.

Sketch:

```ts
import { HealthController } from './health.controller';

describe('HealthController', () => {
  const controller = new HealthController();

  it('returns status "ok"', () => {
    expect(controller.check().status).toBe('ok');
  });

  it('returns an ISO-8601 timestamp', () => {
    const { timestamp } = controller.check();
    expect(new Date(timestamp).toISOString()).toBe(timestamp);
  });

  it('returns only status and timestamp', () => {
    expect(Object.keys(controller.check()).sort()).toEqual([
      'status',
      'timestamp',
    ]);
  });
});
```

### 7.2 E2E test — `test/e2e/health/health.e2e-spec.ts`

- Bootstrap with `createE2EApp()` and tear down with `ctx.close()` (mirrors
  `test/e2e/auth/get-me.e2e-spec.ts`).
- **No `truncateAll`/`beforeEach` reset needed** — the endpoint touches no DB. Omit it to keep
  the test fast and dependency-free.
- **Request**: `GET /api/health` with **no `Authorization` header and no `X-Space-ID`** →
  expect `200`. This is the regression guard for the `@SkipSpace()` risk: if the decorator is
  missing, the global guards return 401/400 and this test fails.
- **Assertions**: body has `status === 'ok'` and a `timestamp` property that parses as a valid
  date.

Sketch:

```ts
import { createE2EApp, E2EContext } from '../../../helpers/app-bootstrap';

describe('Health GET /api/health (e2e)', () => {
  let ctx: E2EContext;

  beforeAll(async () => {
    ctx = await createE2EApp();
  });

  afterAll(async () => {
    await ctx.close();
  });

  it('returns 200 with status ok and no auth headers', async () => {
    const res = await ctx.http().get('/api/health').expect(200);

    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('timestamp');
    expect(Number.isNaN(Date.parse(res.body.timestamp))).toBe(false);
  });
});
```

**Import-path correction (load-bearing)**: the proposal/task spec implies the helper is under
`test/e2e/helpers/`, but the bootstrap helper actually lives at
`test/helpers/app-bootstrap.ts`. Existing E2E specs in `test/e2e/<ctx>/` import it as
`../../helpers/app-bootstrap`. From the deeper `test/e2e/health/` that path is
`../../../helpers/app-bootstrap`. Tasks/apply MUST use the relative depth that resolves to
`test/helpers/app-bootstrap.ts`.

## 8. ADR-style Decisions

### ADR-1 — Location: `src/core/health/` (not `src/contexts/`)

- **Decision**: Place the module under `src/core/`.
- **Context**: `src/contexts/*` holds bounded contexts with domain models, CQRS, and TypeORM
  (auth, spaces, plants, ...). `src/core/*` holds cross-cutting infra (`config`, `filters`,
  `transport/graphql`).
- **Rationale**: Health is cross-cutting infrastructure with NO domain model, NO aggregate, NO
  ubiquitous language. It is not a business capability of the product; it is an operational
  concern. Putting it in `contexts/` would imply a domain that does not exist (screaming
  architecture violation). It sits naturally beside `core/config` and `core/filters`.
- **Rejected alternative**: `src/contexts/health/` — rejected because it would force an
  artificial domain/application/transport split for a 4-line handler and misrepresent the
  module as a business context.

### ADR-2 — No `@nestjs/terminus`

- **Decision**: Hand-write the handler; do not add `@nestjs/terminus`.
- **Context**: Terminus is the standard NestJS health library, providing readiness checks
  (DB ping, disk, memory, HTTP) and a structured health aggregate.
- **Rationale**: The scope is a **liveness** probe only — "is the process up and serving HTTP".
  A liveness check must be independent of downstream dependencies; coupling it to a DB ping
  would let a transient DB blip kill the pod. Terminus adds a dependency, a provider graph, and
  a response contract we do not need yet. The manual handler is 4 lines and trivially testable.
- **Rejected alternative**: Adopt Terminus now — rejected as premature. Deferred: when
  readiness checks (DB/migrations/queue) are required, introduce Terminus behind a separate
  `GET /api/health/ready` and keep `GET /api/health` as the dependency-free liveness probe.

### ADR-3 — Single `@SkipSpace()` for full public access

- **Decision**: Use only `@SkipSpace()` on the handler to make the route public.
- **Rationale**: Both global guards short-circuit on `SKIP_SPACE_KEY`, so one decorator
  bypasses JWT and tenant isolation. No `@Public()`/`@IdentityOnly()` is needed. Verified in
  guard source and matches the public auth routes.
- **Rejected alternative**: Stacking multiple auth decorators — unnecessary and would suggest a
  more complex auth posture than the route has.

### ADR-4 — `@HttpCode(HttpStatus.OK)` explicit

- **Decision**: Annotate the method with `@HttpCode(HttpStatus.OK)` even though `@Get` defaults
  to 200.
- **Rationale**: Consistency with `auth.controller.ts`, and it documents the success contract
  for both readers and Swagger.

## 9. Risks / Assumptions

- **R1 (Med→Low)**: Missing `@SkipSpace()` → 401/400 from global guards. Mitigated by the
  decorator AND the E2E test that hits `/api/health` with no headers and asserts 200.
- **R2 (Med→Low)**: Probe configured at `/health` instead of `/api/health`. Mitigated by
  documenting the `api` prefix and the E2E hitting the full path.
- **R3 (Low)**: E2E helper import depth. Mitigated by the explicit correction in §7.2 — the
  helper is at `test/helpers/app-bootstrap.ts`.
- **Assumption**: No rate limiting / response caching is required for the probe (out of scope).
- **Assumption**: `Logger.debug` is acceptable noise for every probe; if probes are frequent,
  apply/verify may drop the log line. Non-blocking.

## 10. Out of Scope

Terminus, DB/readiness checks, auth on health, metrics/Prometheus, response caching, rate
limiting. Reserved for a future readiness-probe change (see ADR-2 deferral).
