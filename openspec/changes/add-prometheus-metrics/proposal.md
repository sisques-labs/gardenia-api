# Proposal: Prometheus Metrics

## Intent

The API has NO runtime metrics. We have error tracking (Sentry) and a liveness probe (`GET /api/health`), but there is no way to answer "how many requests, how slow, how many commands/queries are failing, is the event loop saturated?". Operators are blind to throughput, latency, and saturation between deploys. We need a Prometheus-scrapeable `GET /api/metrics` endpoint exposing process, HTTP, and CQRS metrics so dashboards and alerts can be built. Needed now to make the service observable in production.

## Scope

### In Scope
- Public `GET /api/metrics` endpoint in Prometheus text exposition format, bypassing both global guards via `@SkipSpace()`.
- **Process/Node default metrics** (CPU, RSS/heap, event-loop lag, GC, active handles) via `prom-client` default collectors.
- **HTTP metrics** (REST + GraphQL) via a single global interceptor: a request-duration histogram and a request counter, labelled `method`, `route`, `status_code`, `transport` (`http` | `graphql`).
- **CQRS metrics** via metered `CommandBus` / `QueryBus` / `EventBus`: per-command/query duration histogram + counter labelled `type` and `status` (`success` | `error`), and an event-published counter labelled `event`.
- New `MetricsModule` under `src/core/observability/metrics/`, registered in `AppModule`.
- Unit specs for the interceptor + metered buses, and an E2E spec asserting the endpoint is public and emits the expected metric families.

### Out of Scope
- Database / TypeORM pool metrics (deferred — more invasive; not requested).
- Per-route cardinality control beyond using the matched route template (no raw URLs as labels).
- Business/domain metrics (e.g. plants created) — can be layered later on the same registry.
- Auth / bearer token on the metrics route (network restricts scraping — see Approach).
- Separate metrics HTTP server / port (kept on the main app port).
- Grafana dashboards, alert rules, Prometheus server config (infra concern).

## Capabilities

### New Capabilities
- `metrics`: Prometheus exposition endpoint exposing process, HTTP, and CQRS metrics for scraping.

### Modified Capabilities
- None.

## Approach

- **`@willsoto/nestjs-prometheus` over `prom-client`**: the de-facto NestJS Prometheus integration. It owns a single shared `Registry`, wires the `/metrics` controller, enables default collectors, and exposes typed metric providers (`makeHistogramProvider`, `makeCounterProvider`) for DI. v6.x targets NestJS 10 (our version). Avoids hand-rolling a controller + registry singleton.
- **Location `src/core/observability/metrics/`**: metrics are cross-cutting operational infra with no domain model, sitting beside the existing `ObservabilityModule` (Sentry). Not a bounded context → not under `src/contexts/`.
- **`@SkipSpace()` is MANDATORY on the metrics route**: `AppModule` registers two global `APP_GUARD`s — `OptionalJwtAuthGuard` then `SpaceGuard` — both short-circuit on `SKIP_SPACE_KEY` (`skip-space.decorator.ts`). The library's default controller path must be configured so the route resolves to `/api/metrics` and carries `@SkipSpace()`, otherwise scraping gets 401/400. Mirrors `HealthController`.
- **Public, network-restricted**: scraping is restricted at the network layer (k8s NetworkPolicy / firewall), consistent with the chosen design. The endpoint therefore needs no auth, matching `/api/health`.
- **HTTP via one global `APP_INTERCEPTOR`**: a single interceptor sees both REST and GraphQL executions. It resolves the matched route template (not the raw URL) to keep label cardinality bounded, and records status from the response / error. GraphQL requests are labelled `transport=graphql` with the operation name as `route`.
- **CQRS via bus subclassing (not per-handler edits)**: `@nestjs/cqrs` has no native command middleware. We provide `{ provide: CommandBus, useClass: MeteredCommandBus }` (and Query/Event equivalents) where each subclass extends the framework bus and wraps `execute()` / `publish()` to time and count. Handlers keep injecting `CommandBus`/`QueryBus` unchanged — zero edits across the 11 contexts.

### API Contract
- `GET /api/metrics` → `200 OK`, `Content-Type: text/plain; version=0.0.4; charset=utf-8`
- Body: Prometheus exposition text including (at minimum) `process_*` / `nodejs_*` default series, `http_request_duration_seconds` + `http_requests_total`, `cqrs_handler_duration_seconds` + `cqrs_handler_total`, `cqrs_events_published_total`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `package.json` | Modified | Add `@willsoto/nestjs-prometheus` + `prom-client` |
| `src/core/observability/metrics/metrics.module.ts` | New | `PrometheusModule.register()` + metric providers + interceptor + metered buses |
| `src/core/observability/metrics/transport/metrics.controller.ts` | New (or config) | Public `@SkipSpace()` `/metrics` route |
| `src/core/observability/metrics/metrics.constants.ts` | New | Metric names + label arrays |
| `src/core/observability/metrics/interceptors/http-metrics.interceptor.ts` | New | HTTP duration + count (REST + GraphQL) |
| `src/core/observability/metrics/cqrs/metered-command-bus.ts` | New | `CommandBus` subclass timing `execute()` |
| `src/core/observability/metrics/cqrs/metered-query-bus.ts` | New | `QueryBus` subclass timing `execute()` |
| `src/core/observability/metrics/cqrs/metered-event-bus.ts` | New | `EventBus` subclass counting publishes |
| `src/app.module.ts` | Modified | Import `MetricsModule` |
| `src/core/observability/metrics/**/*.spec.ts` | New | Unit specs |
| `test/e2e/metrics/metrics.e2e-spec.ts` | New | E2E: public 200 + metric families present |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Missing `@SkipSpace()` → 401/400 on scrape | Med | Decorator on route; E2E hits `/api/metrics` with no auth/`X-Space-ID`, asserts 200 |
| High label cardinality (raw URLs, IDs) blows up Prometheus | Med | Use matched route template (`/api/plants/:id`), never raw path; bounded label set |
| Metered bus subclass diverges from `@nestjs/cqrs` internals on upgrade | Low | Override only the public `execute`/`publish` surface; unit specs lock behaviour |
| Default collectors clash if registered twice (tests) | Low | Single `PrometheusModule.register({ defaultMetrics })`; clear registry between unit tests |
| Metrics route accidentally tenant-guarded breaks scraping silently | Med | E2E regression asserting unauthenticated 200 |

## Rollback Plan

Remove `MetricsModule` from `src/app.module.ts`, delete `src/core/observability/metrics/`, and drop the two dependencies from `package.json`. Self-contained — no migrations, no schema or shared-state changes. Reverting the metered-bus providers restores the stock `@nestjs/cqrs` buses transparently.

## Dependencies

- `@willsoto/nestjs-prometheus` (NestJS 10-compatible, v6.x)
- `prom-client` (peer dependency)
- Existing `@SkipSpace()` decorator and global-guard short-circuit behaviour.

## Success Criteria

- [ ] `GET /api/metrics` returns `200` Prometheus text WITHOUT JWT and WITHOUT `X-Space-ID`.
- [ ] Output includes Node/process default series (`process_cpu_*`, `nodejs_eventloop_lag_*`, heap).
- [ ] Every REST and GraphQL request increments `http_requests_total` and observes `http_request_duration_seconds` with bounded labels.
- [ ] Every command/query increments `cqrs_handler_total` and observes `cqrs_handler_duration_seconds`, labelled by type and `success`/`error`; published events increment `cqrs_events_published_total`.
- [ ] Handlers across contexts remain unedited (buses swapped via DI).
- [ ] Unit + E2E specs pass; `pnpm build`, `pnpm lint`, `tsc --noEmit` clean.
