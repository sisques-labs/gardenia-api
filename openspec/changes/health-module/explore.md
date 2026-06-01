# Exploration: health-module

## Current State

No health-check endpoint exists anywhere in the codebase. Searching for `health`, `terminus`, `HealthController`, and `/health` returns zero matches in `src/`. The only health-adjacent references are Docker-level TCP probes in `.github/workflows/ci.yml` and `docker-compose.test.yml`.

## Critical Constraint: Global Guard Chain

`AppModule` registers two global `APP_GUARD`s applied to every route:

1. `OptionalJwtAuthGuard` — requires a valid JWT unless `@SkipSpace()` metadata is set
2. `SpaceGuard` — requires `X-Space-ID` header + membership unless `@SkipSpace()` or `@IdentityOnly()` is detected

A health endpoint **must** be fully public. `@SkipSpace()` is the only decorator that bypasses **both** guards simultaneously. `@IdentityOnly()` only skips `SpaceGuard`.

**Global prefix**: `app.setGlobalPrefix('api')` → endpoint resolves to `GET /api/health`.

## Recommended Approach

**Manual controller at `src/core/health/`** — zero new dependencies.

Health-check is infrastructure, not a business domain. Forcing it into `src/contexts/` would create a context with no domain layer, no CQRS, no aggregate — violating screaming architecture intent. `src/core/` already holds cross-cutting infrastructure (`config/`, `filters/`).

Terminus adds no value for a simple liveness probe and introduces an opinionated response envelope. Can be adopted later if DB readiness checks are required.

## Recommended File Tree

```
src/core/health/
├── health.module.ts
├── controllers/
│   ├── health.controller.ts
│   └── health.controller.spec.ts
└── dtos/
    └── health-response.dto.ts
```

## Key Conventions

**Controller:**
- `@ApiTags('health')`, `@Controller('health')`, `@Get()`, `@HttpCode(HttpStatus.OK)`
- `@SkipSpace()` — MANDATORY to bypass both global guards
- No `@ApiBearerAuth()`, no `@UseGuards(JwtAuthGuard)`
- `private readonly logger = new Logger(HealthController.name)`

**Response DTO:**
- Plain class with `@ApiProperty` per field
- Fields: `status: string`, `timestamp: string`

**Unit test:**
- Instantiate `new HealthController()` directly — no `Test.createTestingModule`
- `jest.Mocked<T>` for any future deps

**E2E test** (`test/e2e/health/health.e2e-spec.ts`):
- Uses `createE2EApp()` helper
- `GET /api/health` → 200, `{ status: 'ok', timestamp: <ISO string> }`
- No `Authorization` header, no `X-Space-ID` — validates the guard bypass

## Risks

- **`@SkipSpace()` omission** — monitoring probes get 401 silently
- **Global prefix gotcha** — endpoint is `/api/health`, not `/health`; Docker/CI probes must use the correct path
- **No DB readiness** — liveness only; Terminus needed later if DB checks are required
