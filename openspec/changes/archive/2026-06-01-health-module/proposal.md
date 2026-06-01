# Proposal: Health Module

## Intent

The API has NO health endpoint. Container orchestrators, load balancers, and uptime monitors cannot probe liveness, so deployments rely on indirect signals. We need a public, unauthenticated `GET /api/health` returning fast so infrastructure can verify the process is up and serving HTTP. Needed now to support reliable deploys and external monitoring.

## Scope

### In Scope
- Public `GET /api/health` endpoint returning `200` with `{ status, timestamp }`
- Manual `HealthController` + `HealthModule` under `src/core/health/`
- `@SkipSpace()` to bypass both global guards
- `HealthResponseDto`, controller unit spec, and E2E spec
- Register `HealthModule` in `AppModule`

### Out of Scope
- `@nestjs/terminus` (deferred — manual controller is sufficient)
- DB / dependency readiness checks (liveness only, not readiness)
- Auth on the health route (it MUST stay public)
- Metrics, Prometheus, structured probes

## Capabilities

### New Capabilities
- `health`: Liveness endpoint exposing process status and timestamp for orchestrators and monitors.

### Modified Capabilities
- None

## Approach

- **Location `src/core/health/`, NOT `src/contexts/`**: health is cross-cutting infrastructure with no domain model — it belongs alongside `core/config`, `core/filters`. Putting it in `contexts/` would imply a bounded context that does not exist.
- **No Terminus**: a 4-line manual handler avoids a dependency and full control over the contract. Terminus can be introduced later if readiness checks land.
- **`@SkipSpace()` is MANDATORY**: `AppModule` registers two global `APP_GUARD`s — `OptionalJwtAuthGuard` then `SpaceGuard`. Both short-circuit on `SKIP_SPACE_KEY` (verified in `optional-jwt-auth.guard.ts:26` and `space.guard.ts:35`). The single `@SkipSpace()` decorator bypasses BOTH, making the route public with no `X-Space-ID`.

### API Contract
- `GET /api/health` → `200 OK`
- Body: `{ "status": "ok", "timestamp": "<ISO-8601 string>" }`

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/core/health/health.module.ts` | New | Declares `HealthController` |
| `src/core/health/controllers/health.controller.ts` | New | `@SkipSpace()` `GET health` handler |
| `src/core/health/controllers/health.controller.spec.ts` | New | Unit spec |
| `src/core/health/dtos/health-response.dto.ts` | New | Response shape |
| `src/app.module.ts` | Modified | Import `HealthModule` |
| `test/e2e/health/health.e2e-spec.ts` | New | E2E asserting public 200 |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Missing `@SkipSpace()` → 401/400 from global guards | Med | Apply decorator; E2E asserts 200 WITHOUT auth header or `X-Space-ID` |
| Probe configured at wrong path (`/health` not `/api/health`) | Med | Document `/api` global prefix in spec; E2E hits full `/api/health` path |

## Rollback Plan

Remove the `HealthModule` import from `src/app.module.ts` and delete `src/core/health/`. Self-contained — no migrations, no shared-state changes.

## Dependencies

- None (uses existing `@nestjs/common` and `@SkipSpace()` decorator)

## Success Criteria

- [ ] `GET /api/health` returns `200` `{ status: 'ok', timestamp: <ISO> }`
- [ ] Endpoint responds WITHOUT JWT and WITHOUT `X-Space-ID`
- [ ] Unit + E2E specs pass
- [ ] `HealthModule` registered in `AppModule`
