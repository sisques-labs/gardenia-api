# Tasks: add-prometheus-metrics

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~320–420 |
| 400-line budget risk | Medium |
| Chained PRs recommended | Optional |
| Suggested split | 1 PR (or split CQRS into PR 2 if review budget tight) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: Optional
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Deps + module + endpoint + default + HTTP metrics + tests | PR 1 | Endpoint observable end-to-end |
| 2 | CQRS metered buses + event subscriber + tests | PR 1 (or PR 2) | Split out only if PR 1 exceeds review budget |

---

## Phase 1: Dependencies & Constants

- [ ] 1.1 Add `@willsoto/nestjs-prometheus` and `prom-client` to `package.json` dependencies (versions compatible with NestJS 10 — willsoto v6.x). Run `pnpm install` to update the lockfile. Satisfies REQ: Metrics Exposition Endpoint (library choice).
- [ ] 1.2 Create `src/core/observability/metrics/metrics.constants.ts` — metric names (`http_request_duration_seconds`, `http_requests_total`, `cqrs_handler_duration_seconds`, `cqrs_handler_total`, `cqrs_events_published_total`), label arrays (`HTTP_LABELS`, `CQRS_LABELS`), and `DURATION_BUCKETS`. One source of truth for providers + interceptor + buses.

## Phase 2: Module, Endpoint & Default Metrics

- [ ] 2.1 Create `src/core/observability/metrics/metrics.module.ts` — `PrometheusModule.register({ defaultMetrics: { enabled: true }, defaultLabels: { app: 'gardenia-api' } })`, import `CqrsModule`, register the histogram/counter providers via `makeHistogramProvider`/`makeCounterProvider`, the `APP_INTERCEPTOR`, the metered buses, and the event subscriber. Satisfies REQ: Metrics Exposition Endpoint + default metrics.
- [ ] 2.2 Make the `/metrics` route resolve to `/api/metrics` and carry `@SkipSpace()`. Prefer a thin custom controller `src/core/observability/metrics/transport/metrics.controller.ts` (`@ApiTags('metrics')`, `@Controller('metrics')`, `@SkipSpace()`, returns the shared registry exposition string) wired via `PrometheusModule.register({ controller })`; otherwise configure the default controller path. Mirror `HealthController`. Satisfies REQ: public unauthenticated endpoint.
- [ ] 2.3 Add `MetricsModule` to `AppModule.imports` in `src/app.module.ts` via the `@core/observability/metrics/metrics.module` alias, placed alongside `ObservabilityModule`/`HealthModule` and after the root `CqrsModule.forRoot()`. Satisfies REQ: module wired into app + bus override scope.

## Phase 3: HTTP Metrics (REST + GraphQL)

- [ ] 3.1 Create `src/core/observability/metrics/interceptors/http-metrics.interceptor.ts` — global interceptor branching on `context.getType()` (`http` | `graphql`); inject the two HTTP metrics via `@InjectMetric`; observe duration (`process.hrtime.bigint`) and increment count on success and error (`tap({ next, error })`); resolve labels from `req.route.path` (REST) / `GqlExecutionContext` `info.fieldName` + `info.operation.operation` (GraphQL); `status_code` from response / `err.status ?? 500`. MUST NOT emit raw URLs or ids. Satisfies REQ: HTTP Request Metrics.

## Phase 4: CQRS Metrics

- [ ] 4.1 Create `src/core/observability/metrics/cqrs/metered-command-bus.ts` — `extends CommandBus`, explicit constructor `(moduleRef: ModuleRef, @InjectMetric duration, @InjectMetric total)` calling `super(moduleRef)`; override `execute()` to time + count with labels `{ type: command.constructor.name, kind: 'command', status }`, recording `error` and rethrowing on throw. Verify `super()` signature against installed `@nestjs/cqrs@10.2.8`. Satisfies REQ: CQRS Handler Metrics.
- [ ] 4.2 Create `src/core/observability/metrics/cqrs/metered-query-bus.ts` — same as 4.1 for `QueryBus`/`IQuery` with `kind: 'query'`. Satisfies REQ: CQRS Handler Metrics.
- [ ] 4.3 Create `src/core/observability/metrics/cqrs/event-metrics.subscriber.ts` — `@Injectable` implementing `OnModuleInit`/`OnModuleDestroy`; inject stock `EventBus` + the events counter; subscribe to the bus stream in `onModuleInit` incrementing `cqrs_events_published_total{event=...}`; unsubscribe in `onModuleDestroy`. Satisfies REQ: event published counter (no `EventBus` subclassing).
- [ ] 4.4 Confirm the `{ provide: CommandBus, useClass: MeteredCommandBus }` / `QueryBus` overrides reach buses resolved inside feature modules. If not, apply the ADR-3 fallback (stream-subscription counting + exported timing wrapper). Satisfies REQ: Handlers Remain Unmodified.

## Phase 5: Testing

- [ ] 5.1 Create `src/core/observability/metrics/interceptors/http-metrics.interceptor.spec.ts` — `jest.Mocked` Histogram/Counter; fake `ExecutionContext` for `http` and `graphql`; assert observe + inc with correct bounded labels, route from template/fieldName, error `status_code`, and that a raw url with an id never leaks into `route`. Covers spec scenarios: REST/GraphQL measured + failed request.
- [ ] 5.2 Create `src/core/observability/metrics/cqrs/metered-command-bus.spec.ts` and `metered-query-bus.spec.ts` — mocked `ModuleRef` + metrics; assert success records `status='success'`, error path records `status='error'` AND rethrows, correct `type`/`kind`. Covers spec scenarios: successful command + failing query.
- [ ] 5.3 (If custom controller) Create `transport/metrics.controller.spec.ts` — assert it returns the registry exposition string and carries `@SkipSpace()` metadata (`SKIP_SPACE_KEY === true`).
- [ ] 5.4 Create `test/e2e/metrics/metrics.e2e-spec.ts` — bootstrap `createE2EApp()` (import `../../helpers/app-bootstrap`); `GET /api/metrics` with no auth + no `X-Space-ID` → expect 200; assert body contains a default series, `http_requests_total`, and `cqrs_handler_total` help lines; optionally issue a request then assert the matching sample appears. Covers spec scenarios: unauthenticated scrape + default metrics present.

## Phase 6: Verify & Docs

- [ ] 6.1 Run `pnpm lint`, `tsc --noEmit`, `pnpm build`, `pnpm test`, and `pnpm test:e2e` (metrics E2E). All green.
- [ ] 6.2 Create `src/core/observability/metrics/README.md` documenting the endpoint, exposed metric families + labels, the public/network-restricted posture, and how to add new metrics on the shared registry. Update README/observability notes if present.
