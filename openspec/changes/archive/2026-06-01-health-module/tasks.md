# Tasks: health-module

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~80–120 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Full health-module (DTO + controller + module + app wiring + tests) | PR 1 | All 6 files; ~80–120 lines; fits single-PR budget |

---

## Phase 1: Foundation

- [x] 1.1 Create `src/core/health/transport/rest/dtos/health-response.dto.ts` — plain class with `@ApiProperty()` on `status: string` and `timestamp: string`. No class-validator decorators. Satisfies REQ: response shape.
- [x] 1.2 Create `src/core/health/health.module.ts` — `@Module({ controllers: [HealthController] })` only; no CqrsModule, TypeOrmModule, providers, or exports. Satisfies REQ: module registration.

## Phase 2: Core Implementation

- [x] 2.1 Create `src/core/health/transport/rest/controllers/health.controller.ts` — `@ApiTags('health')`, `@Controller('health')`; method `check()` with `@Get() @SkipSpace() @HttpCode(HttpStatus.OK) @ApiOperation @ApiResponse(200)`; per-class `Logger = new Logger(HealthController.name)`; returns `{ status: 'ok', timestamp: new Date().toISOString() }` typed as `HealthResponseDto`. Import `SkipSpace` via relative path `../../../../../shared/decorators/skip-space.decorator`. No `@ApiBearerAuth()`. Satisfies REQ: liveness endpoint + guard bypass.

## Phase 3: Integration

- [x] 3.1 Add `HealthModule` to `AppModule.imports` in `src/app.module.ts` — import via `@core/health/health.module` alias; append after existing context module imports. Satisfies REQ: module wired into app.

## Phase 4: Testing

- [x] 4.1 Create `src/core/health/transport/rest/controllers/health.controller.spec.ts` — instantiate `new HealthController()` directly (no DI); assert: (a) `status === 'ok'`, (b) `timestamp` round-trips ISO (`new Date(ts).toISOString() === ts`), (c) `Object.keys(result).sort()` equals `['status', 'timestamp']`. Covers spec scenarios: response shape + timestamp validity.
- [x] 4.2 Create `test/e2e/health/health.e2e-spec.ts` — bootstrap with `createE2EApp()` (import: `../../helpers/app-bootstrap`); no `truncateAll`; `GET /api/health` with no `Authorization` and no `X-Space-ID` headers; assert `200`, `body.status === 'ok'`, `body.timestamp` parses as valid date (`!Number.isNaN(Date.parse(...))`). Covers spec scenarios: unauthenticated request succeeds + no X-Space-ID succeeds.
