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

- [x] 1.1 Add `@willsoto/nestjs-prometheus` and `prom-client` to `package.json` dependencies (versions compatible with NestJS 10 — willsoto v6.x). Run `pnpm install` to update the lockfile. Satisfies REQ: Metrics Exposition Endpoint (library choice).
- [x] 1.2 Create `src/core/metrics/metrics.constants.ts` — metric names (`http_request_duration_seconds`, `http_requests_total`, `cqrs_handler_duration_seconds`, `cqrs_handler_total`, `cqrs_events_published_total`), label arrays (`HTTP_LABELS`, `CQRS_LABELS`), and `DURATION_BUCKETS`. One source of truth for providers + interceptor + buses.

## Phase 2: Module, Endpoint & Default Metrics

- [x] 2.1 Create `src/core/metrics/metrics.module.ts` — `PrometheusModule.register({ controller: MetricsController, defaultMetrics: { enabled: true }, defaultLabels: { app: 'gardenia-api' } })`, import `CqrsModule`, register the histogram/counter providers via `makeHistogramProvider`/`makeCounterProvider`, the `APP_INTERCEPTOR` (`HttpMetricsInterceptor`), and `CqrsMetricsService`. Satisfies REQ: Metrics Exposition Endpoint + default metrics.
- [x] 2.2 Create the thin custom controller `src/core/metrics/transport/metrics.controller.ts` extending the library's `PrometheusController` (`@ApiTags('metrics')`, `@Controller()`, `@Get() @SkipSpace()`, delegates to `super.index(response)`), wired via `PrometheusModule.register({ controller })`. The module forces the path to `/metrics` → `/api/metrics`. Mirror `HealthController`'s public posture. Satisfies REQ: public unauthenticated endpoint.
- [x] 2.3 Add `MetricsModule` to `AppModule.imports` in `src/app.module.ts` via the `@core/metrics/metrics.module` alias, placed alongside `ObservabilityModule`/`HealthModule` and after the root `CqrsModule.forRoot()`. Satisfies REQ: module wired into app + bus override scope.

## Phase 3: HTTP Metrics (REST + GraphQL)

- [x] 3.1 Create `src/core/metrics/interceptors/http-metrics.interceptor.ts` — global interceptor branching on `context.getType()` (`http` | `graphql`); inject the two HTTP metrics via `@InjectMetric`; observe duration (`process.hrtime.bigint`) and increment count on success and error (`tap({ next, error })`); resolve labels from `req.route.path` (REST) / `GqlExecutionContext` `info.fieldName` + `info.operation.operation` (GraphQL); `status_code` from response / `err.status ?? 500`. MUST NOT emit raw URLs or ids. Satisfies REQ: HTTP Request Metrics.

## Phase 4: CQRS Metrics

- [x] 4.1 Create `src/core/metrics/cqrs/cqrs-metrics.service.ts` — `@Injectable` implementing `OnModuleInit`/`OnModuleDestroy`; inject shared `CommandBus`/`QueryBus`/`EventBus` + the 3 CQRS metrics; in `onModuleInit` wrap `execute` on the command and query buses (time + count with `{ type, kind, status }`, `error` + rethrow on throw) and subscribe to the `EventBus` stream incrementing `cqrs_events_published_total{event=...}`; unsubscribe in `onModuleDestroy`. Satisfies REQ: CQRS Handler Metrics + event counter. NOTE: implemented as a wrap of the shared singletons, NOT a DI `useClass` override — verified against `@nestjs/cqrs@10.2.8` source that `CqrsModule.forRoot()` is global and registers handlers on its own instances, so an override would be handler-less (ADR-3).
- [x] 4.2 Confirm handlers across contexts are unedited and resolve the instrumented shared buses (wrap applies to the single global instance every resolver injects). Satisfies REQ: Handlers Remain Unmodified.

## Phase 5: Testing

- [x] 5.1 Create `src/core/metrics/interceptors/http-metrics.interceptor.spec.ts` — `jest.Mocked` Histogram/Counter; fake `ExecutionContext` for `http` and `graphql`; assert observe + inc with correct bounded labels, route from template/fieldName, error `status_code` (and 500 default), that a raw url with an id never leaks into `route`, and pass-through for non-http/graphql. Covers spec scenarios: REST/GraphQL measured + failed request.
- [x] 5.2 Create `src/core/metrics/cqrs/cqrs-metrics.service.spec.ts` — mocked buses + metrics; assert success records `status='success'`, error path records `status='error'` AND rethrows, correct `type`/`kind`, event counted by class name, and unsubscribe stops counting after destroy. Covers spec scenarios: successful command + failing query + published event.
- [x] 5.3 Create `transport/metrics.controller.spec.ts` — assert it carries `@SkipSpace()` metadata (`SKIP_SPACE_KEY === true`) and delegates exposition to the Prometheus base controller (string body + content-type header).
- [x] 5.4 Create `test/e2e/metrics/metrics.e2e-spec.ts` — bootstrap `createE2EApp()` (import `../../helpers/app-bootstrap`); `GET /api/metrics` with no auth + no `X-Space-ID` → expect 200; assert body contains a default series, `http_requests_total`, `http_request_duration_seconds`, `cqrs_handler_total`, `cqrs_events_published_total`. Covers spec scenarios: unauthenticated scrape + default metrics present.

## Phase 6: Verify & Docs

- [x] 6.1 Ran `tsc --noEmit` (clean), `eslint` on metrics + e2e (clean), `nest build` (success), and `jest src/core/metrics` (13 passed). NOTE: the metrics E2E (`pnpm test:e2e`) needs a Postgres test DB; Docker is unavailable in this environment, so it is left to run in CI.
- [x] 6.2 Create `src/core/metrics/README.md` documenting the endpoint, exposed metric families + labels, the public/network-restricted posture, and how to add new metrics on the shared registry.
