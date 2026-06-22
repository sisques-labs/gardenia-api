# Metrics (`src/core/metrics`)

Prometheus instrumentation for Gardenia API. Cross-cutting operational infra (no
domain model) — lives in `core/`, beside `observability/` (Sentry) and `health/`.

## Endpoint

`GET /api/metrics` → `200`, `Content-Type: text/plain; version=0.0.4`.

Public via `@SkipSpace()` (both global guards short-circuit) — **no JWT, no
`X-Space-ID`**, same posture as `/api/health`. Access is expected to be restricted
at the network layer (k8s NetworkPolicy / firewall); there is no auth on the route.

## Exposed metrics

| Metric | Type | Labels | Source |
|--------|------|--------|--------|
| `process_*`, `nodejs_*` | various | — | `prom-client` default collectors |
| `http_request_duration_seconds` | histogram | `method`, `route`, `status_code`, `transport` | `HttpMetricsInterceptor` |
| `http_requests_total` | counter | `method`, `route`, `status_code`, `transport` | `HttpMetricsInterceptor` |
| `cqrs_handler_duration_seconds` | histogram | `type`, `kind`, `status` | `CqrsMetricsService` |
| `cqrs_handler_total` | counter | `type`, `kind`, `status` | `CqrsMetricsService` |
| `cqrs_events_published_total` | counter | `event` | `CqrsMetricsService` |

`transport` is `http` | `graphql`; `kind` is `command` | `query`; `status` is
`success` | `error`. A `defaultLabels.app=gardenia-api` is applied to every series.

### Label cardinality

Labels are deliberately bounded. HTTP `route` uses the **matched route template**
(`/api/plants/:id`) for REST and the **resolver field name** for GraphQL — never raw
URLs, path/param values, query strings, or tenant ids. CQRS `type`/`event` use class
names. Do not add high-cardinality labels (ids, emails, free text).

## How it works

- **HTTP** — a single global `APP_INTERCEPTOR` (`HttpMetricsInterceptor`) observes
  both REST and GraphQL executions, branching on `context.getType()`.
- **CQRS** — `@nestjs/cqrs@10` has no command/query middleware and registers handlers
  onto the single global `CommandBus`/`QueryBus` singletons. A DI override would
  create a second, handler-less instance, so `CqrsMetricsService` wraps the shared
  instances' `execute` at `onModuleInit` and subscribes to the `EventBus` stream for
  publish counts. **No handler is edited.**

## Adding a new metric

1. Add the name + labels to `metrics.constants.ts`.
2. Register a provider in `metrics.module.ts` via `makeCounterProvider` /
   `makeHistogramProvider` / `makeGaugeProvider` (they register on the shared
   `prom-client` registry that the endpoint exposes).
3. Inject it with `@InjectMetric(NAME)` where you record it.
