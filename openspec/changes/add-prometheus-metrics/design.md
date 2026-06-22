# Technical Design — add-prometheus-metrics

## 1. Overview

Expose a public `GET /api/metrics` endpoint in Prometheus exposition format, backed by a single
shared `prom-client` registry wired through `@willsoto/nestjs-prometheus`. Three metric sources
feed the registry:

1. **Default process/Node metrics** — enabled by the library's default collectors.
2. **HTTP metrics** — one global `APP_INTERCEPTOR` observing REST + GraphQL executions.
3. **CQRS metrics** — a `CqrsMetricsService` that wraps the shared `CommandBus`/`QueryBus`
   `execute` at startup and subscribes to the `EventBus` stream.

The module lives in `src/core/metrics/` (cross-cutting infra, no domain model) and
is wired into `AppModule`. The route bypasses both global guards via `@SkipSpace()`, exactly like
`HealthController`.

## 2. Architecture Approach

- **Pattern**: Plain NestJS module + transport controller (extends the library's
  `PrometheusController`) + one global interceptor + a startup service that wraps the shared CQRS
  buses. No domain/application layers — there is no business model, this is operational
  instrumentation (screaming architecture: the code DOES "measure and expose").
- **Single registry**: `PrometheusModule.register()` owns one global `Registry`. All custom metrics
  are registered as Nest providers (`makeHistogramProvider` / `makeCounterProvider`) against that
  registry and injected where needed. No ad-hoc `new Registry()`.
- **Zero handler edits**: CQRS instrumentation wraps the `execute` of the single shared
  `CommandBus`/`QueryBus` instances at `onModuleInit` (a DI `useClass` override would create a
  second, handler-less instance), so the bounded contexts and all their handlers stay untouched.
- **Bounded label cardinality**: HTTP labels use the *matched route template* and a coarse status,
  never raw URLs, query strings, IDs, or per-tenant values.

## 3. File Tree (exact paths)

```
src/core/metrics/
├── metrics.module.ts
├── metrics.constants.ts
├── transport/
│   ├── metrics.controller.ts          # only if a custom @SkipSpace route is needed (see §6.1)
│   └── metrics.controller.spec.ts
├── interceptors/
│   ├── http-metrics.interceptor.ts
│   └── http-metrics.interceptor.spec.ts
└── cqrs/
    ├── cqrs-metrics.service.ts
    └── cqrs-metrics.service.spec.ts
```

Plus:
- Modify `src/app.module.ts` — add `MetricsModule` to `imports`.
- Modify `package.json` — add `@willsoto/nestjs-prometheus`, `prom-client`.
- New E2E: `test/e2e/metrics/metrics.e2e-spec.ts`.

## 4. Component Design

### 4.1 `metrics.constants.ts`

Centralises metric names, help text, label keys, and histogram buckets so providers, interceptor,
and buses share one source of truth.

```ts
export const HTTP_REQUEST_DURATION = 'http_request_duration_seconds';
export const HTTP_REQUESTS_TOTAL = 'http_requests_total';
export const CQRS_HANDLER_DURATION = 'cqrs_handler_duration_seconds';
export const CQRS_HANDLER_TOTAL = 'cqrs_handler_total';
export const CQRS_EVENTS_PUBLISHED_TOTAL = 'cqrs_events_published_total';

export const HTTP_LABELS = ['method', 'route', 'status_code', 'transport'] as const;
export const CQRS_LABELS = ['type', 'kind', 'status'] as const; // kind: command|query

// Seconds. Tuned for sub-second API + occasional slow paths.
export const DURATION_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];
```

### 4.2 `metrics.module.ts`

```ts
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';
import {
  PrometheusModule,
  makeCounterProvider,
  makeHistogramProvider,
} from '@willsoto/nestjs-prometheus';

import { HttpMetricsInterceptor } from './interceptors/http-metrics.interceptor';
import { CqrsMetricsService } from './cqrs/cqrs-metrics.service';
import { MetricsController } from './transport/metrics.controller';
import * as M from './metrics.constants';

@Module({
  imports: [
    CqrsModule,
    PrometheusModule.register({
      // Custom controller carries @SkipSpace(); the module forces the path to
      // /metrics → /api/metrics under the global 'api' prefix.
      controller: MetricsController,
      defaultMetrics: { enabled: true },
      defaultLabels: { app: 'gardenia-api' },
    }),
  ],
  providers: [
    makeHistogramProvider({
      name: M.HTTP_REQUEST_DURATION,
      help: 'HTTP request duration in seconds',
      labelNames: [...M.HTTP_LABELS],
      buckets: M.DURATION_BUCKETS,
    }),
    makeCounterProvider({
      name: M.HTTP_REQUESTS_TOTAL,
      help: 'Total HTTP requests',
      labelNames: [...M.HTTP_LABELS],
    }),
    makeHistogramProvider({
      name: M.CQRS_HANDLER_DURATION,
      help: 'CQRS command/query handler duration in seconds',
      labelNames: [...M.CQRS_LABELS],
      buckets: M.DURATION_BUCKETS,
    }),
    makeCounterProvider({
      name: M.CQRS_HANDLER_TOTAL,
      help: 'Total CQRS commands/queries executed',
      labelNames: [...M.CQRS_LABELS],
    }),
    makeCounterProvider({
      name: M.CQRS_EVENTS_PUBLISHED_TOTAL,
      help: 'Total domain events published',
      labelNames: ['event'],
    }),
    { provide: APP_INTERCEPTOR, useClass: HttpMetricsInterceptor },
    // Wraps the shared CommandBus/QueryBus execute at startup + subscribes EventBus.
    CqrsMetricsService,
  ],
})
export class MetricsModule {}
```

> Note: the providers register custom metrics on the shared `prom-client` registry, which the
> library's `PrometheusController.index` (extended by `MetricsController`) serialises at scrape time.
> CQRS instrumentation does NOT override the bus tokens (see ADR-3) — it wraps the singletons.

### 4.3 `interceptors/http-metrics.interceptor.ts`

One interceptor handles REST and GraphQL. It branches on `context.getType()`.

```ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';
import { Observable, tap } from 'rxjs';

import * as M from '../metrics.constants';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric(M.HTTP_REQUEST_DURATION) private readonly duration: Histogram<string>,
    @InjectMetric(M.HTTP_REQUESTS_TOTAL) private readonly total: Counter<string>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const start = process.hrtime.bigint();
    const transport = context.getType<'http' | 'graphql'>();

    const record = (statusCode: number) => {
      const seconds = Number(process.hrtime.bigint() - start) / 1e9;
      const { method, route } = this.resolve(context, transport);
      const labels = { method, route, status_code: String(statusCode), transport };
      this.duration.observe(labels, seconds);
      this.total.inc(labels);
    };

    return next.handle().pipe(
      tap({
        next: () => record(this.successStatus(context, transport)),
        error: (err: { status?: number }) => record(err?.status ?? 500),
      }),
    );
  }

  private resolve(context: ExecutionContext, transport: 'http' | 'graphql') {
    if (transport === 'graphql') {
      const gql = GqlExecutionContext.create(context);
      const info = gql.getInfo<{ operation?: { operation?: string }; fieldName?: string }>();
      return {
        method: info?.operation?.operation ?? 'query', // query|mutation|subscription
        route: info?.fieldName ?? 'unknown',            // resolver field — bounded cardinality
      };
    }
    const req = context.switchToHttp().getRequest<{ method: string; route?: { path?: string } }>();
    return { method: req.method, route: req.route?.path ?? 'unknown' };
  }

  private successStatus(context: ExecutionContext, transport: 'http' | 'graphql'): number {
    if (transport === 'graphql') return 200;
    return context.switchToHttp().getResponse<{ statusCode?: number }>().statusCode ?? 200;
  }
}
```

Cardinality guard: REST uses `req.route.path` (the matched template, e.g. `/api/plants/:id`), NOT
`req.url`. GraphQL uses the resolver `fieldName` — a fixed set from the schema. This keeps label
sets small and stable.

### 4.4 `cqrs/cqrs-metrics.service.ts`

A single startup service instruments commands, queries AND events. It injects the shared
`CommandBus`/`QueryBus`/`EventBus` (the global instances `CqrsModule` registers handlers on),
wraps `execute` on the two buses at `onModuleInit`, and subscribes to the `EventBus` stream.

```ts
@Injectable()
export class CqrsMetricsService implements OnModuleInit, OnModuleDestroy {
  private subscription?: Subscription;

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly eventBus: EventBus,
    @InjectMetric(CQRS_HANDLER_DURATION) private readonly duration: Histogram<string>,
    @InjectMetric(CQRS_HANDLER_TOTAL) private readonly total: Counter<string>,
    @InjectMetric(CQRS_EVENTS_PUBLISHED_TOTAL) private readonly events: Counter<string>,
  ) {}

  onModuleInit(): void {
    this.instrument(this.commandBus as unknown as ExecutableBus, 'command');
    this.instrument(this.queryBus as unknown as ExecutableBus, 'query');
    this.subscription = this.eventBus.subscribe((event: IEvent) => {
      this.events.inc({ event: event.constructor.name });
    });
  }

  onModuleDestroy(): void {
    this.subscription?.unsubscribe();
  }

  instrument(bus: ExecutableBus, kind: CqrsKind): void {
    const original = bus.execute.bind(bus);
    bus.execute = async (payload) => {
      const type = payload.constructor.name;
      const start = process.hrtime.bigint();
      try {
        const result = await original(payload);
        this.observe(type, kind, 'success', start);
        return result;
      } catch (error) {
        this.observe(type, kind, 'error', start);
        throw error;
      }
    };
  }
  // observe() records duration + count with { type, kind, status } labels.
}
```

> Why wrap, not subclass: `EventBus extends ObservableBus<IEvent>` (an RxJS `Observable`), so a
> subscription counts publishes without coupling to its 3-arg constructor. For commands/queries a
> DI `useClass` override fails (ADR-3): handlers are registered on the global instance, so a second
> instance would receive none. Wrapping the public `execute` of the shared instance is the reliable
> path and is fully unit-tested (success, error+rethrow, event count, unsubscribe on destroy).

### 4.5 `transport/metrics.controller.ts`

A thin controller extends the library's `PrometheusController` solely to attach `@SkipSpace()`
(and Swagger tags). The module forces the route path to `/metrics` (→ `/api/metrics`).

```ts
@ApiTags('metrics')
@Controller()
export class MetricsController extends PrometheusController {
  @Get()
  @SkipSpace()
  index(@Res({ passthrough: true }) response: Response): Promise<string> {
    return super.index(response);
  }
}
```

## 5. Data Flow

```
Prometheus scrape: GET /api/metrics
  → OptionalJwtAuthGuard ─┐ short-circuit on SKIP_SPACE_KEY
  → SpaceGuard           ─┘ → no JWT / X-Space-ID needed
  → Metrics controller → registry.metrics() → 200 text/plain exposition

Live request (REST or GraphQL):
  → HttpMetricsInterceptor.start = hrtime
  → handler / resolver runs
      → CommandBus.execute / QueryBus.execute  (MeteredCommandBus/MeteredQueryBus time + count)
          → handler publishes domain events → EventBus stream → EventMetricsSubscriber.inc
  → interceptor tap(next|error) → observe duration + inc counter with bounded labels
```

## 6. Integration Points

### 6.1 Public route + global prefix (the critical decision)

The route MUST resolve to `/api/metrics` (global `api` prefix set in `main.ts:14` and replicated in
`createE2EApp`) and carry `@SkipSpace()` so both global `APP_GUARD`s short-circuit (verified:
`skip-space.decorator.ts`, `optional-jwt-auth.guard.ts`, `space.guard.ts`; same mechanism as
`HealthController`).

`@willsoto/nestjs-prometheus` registers its own `/metrics` controller. Because `@SkipSpace()` sets
route metadata, the recommended approach is a **thin custom controller** that returns the shared
registry output and carries the decorator, registered via `PrometheusModule.register({ controller:
MetricsController })` (the library supports supplying a custom controller class). The custom
controller extends/wraps the library's `PrometheusController` and adds `@SkipSpace()` +
`@Controller('metrics')` + `@ApiTags('metrics')`, mirroring `HealthController`. Apply-time selects
between (a) custom controller and (b) configuring the default controller path, whichever cleanly
attaches `@SkipSpace()`.

### 6.2 `app.module.ts` change

```ts
import { MetricsModule } from '@core/metrics/metrics.module';
// ...
imports: [
  // ...existing
  ObservabilityModule,
  MetricsModule,
  HealthModule,
  // ...
],
```

`MetricsModule` must be imported AFTER (or alongside) the root `CqrsModule.forRoot()` so the
`{ provide: CommandBus, useClass: MeteredCommandBus }` override applies to the buses handlers
resolve. Apply-time verifies override scope (see ADR-3).

### 6.3 Default collectors registered once

`PrometheusModule.register({ defaultMetrics: { enabled: true } })` is called exactly once. In unit
tests that touch the registry, clear it between cases (`registry.clear()` / `register.clear()`) to
avoid "metric already registered" errors.

## 7. Test Design

### 7.1 Unit — `http-metrics.interceptor.spec.ts`
- Mock `Histogram`/`Counter` with `jest.Mocked<T>`; build a fake `ExecutionContext` for both
  `http` and `graphql` types.
- Assert: on success, `duration.observe` + `total.inc` called once with labels
  `{ method, route, status_code, transport }`; route comes from `req.route.path` (HTTP) and
  `info.fieldName` (GraphQL); on error, `status_code` reflects `err.status ?? 500`.
- Assert raw URL / IDs never leak into labels (pass `req.url` with an id, expect `route` = template).

### 7.2 Unit — `metered-command-bus.spec.ts` / `metered-query-bus.spec.ts`
- Subclass instantiated with a mocked `ModuleRef` and mocked metrics; stub `super.execute` via
  spying on the prototype (or inject a fake handler).
- Assert: success path observes duration + increments total with `status='success'`,
  `kind='command'|'query'`, `type=<command/query class name>`; error path rethrows AND records
  `status='error'`.

### 7.3 Unit — `metrics.controller.spec.ts`
- Assert the controller returns the registry's exposition string and is decorated with `@SkipSpace()`
  (reflect metadata `SKIP_SPACE_KEY === true`).

### 7.4 E2E — `test/e2e/metrics/metrics.e2e-spec.ts`
- Bootstrap with `createE2EApp()` (import `../../helpers/app-bootstrap`). No DB reset needed.
- `GET /api/metrics` with NO `Authorization` and NO `X-Space-ID` → expect `200` (regression guard for
  the `@SkipSpace()` risk).
- Assert body contains default series (`process_cpu_user_seconds_total` or `nodejs_eventloop_lag`),
  `http_requests_total`, and `cqrs_handler_total` family help lines.
- Optionally: issue a known REST/GraphQL request first, then scrape and assert the corresponding
  `http_requests_total{route=...}` sample is present and the CQRS counter advanced.

## 8. ADR-style Decisions

### ADR-1 — Location: `src/core/metrics/`
- **Decision**: Nest the metrics module beside the existing Sentry `ObservabilityModule`.
- **Rationale**: Metrics are cross-cutting operational infra with no domain model — same category as
  `core/config`, `core/filters`, and the existing observability concern. Putting them in
  `src/contexts/` would invent a bounded context that does not exist (screaming-architecture
  violation), forcing an artificial domain/application split for pure instrumentation.
- **Rejected**: `src/contexts/metrics/`; a top-level `src/metrics/` — both misclassify the concern.

### ADR-2 — `@willsoto/nestjs-prometheus` over hand-rolled `prom-client`
- **Decision**: Use the library; do not hand-roll a registry singleton + controller.
- **Rationale**: It owns one shared `Registry`, ships the exposition controller, enables default
  collectors, and exposes typed DI providers (`InjectMetric`) — the same ergonomics the codebase
  already uses for other infra. v6.x supports NestJS 10. Hand-rolling re-implements all of this and
  risks multiple-registry bugs.
- **Rejected**: raw `prom-client` only — more boilerplate, no DI integration, easy to double-register
  default collectors.

### ADR-3 — CQRS via wrapping the shared bus singletons, events via stream subscription
- **Decision**: A `CqrsMetricsService` wraps the `execute` method of the shared `CommandBus`/
  `QueryBus` instances at `onModuleInit`, and counts events by subscribing to the stock `EventBus`
  observable.
- **Context**: `CqrsModule.forRoot()` is `global: true` and its `onApplicationBootstrap` registers
  handlers onto the `CommandBus`/`QueryBus` instances it owns and exports. Verified in
  `node_modules/@nestjs/cqrs/dist/cqrs.module.js`.
- **Rationale**: `@nestjs/cqrs@10` has no command/query middleware. A `{ provide: CommandBus,
  useClass: MeteredCommandBus }` override creates a SECOND instance in the importing module's scope
  with NO handlers registered — resolvers would keep resolving the global one, so metrics would never
  fire. Wrapping the `execute` of the single shared instance times every command/query with ZERO
  handler edits and no instance duplication. Events are already an observable stream on `EventBus`,
  so a subscriber counts publishes without touching the bus's heavier (3-arg) constructor.
- **Rejected**: DI `useClass` override (dual-instance, handler-less — the original plan, disproven
  against the installed source); editing every handler (huge churn); subclassing `EventBus` (fragile
  constructor coupling).
- **Trade-off**: wrapping a framework method is a controlled monkey-patch. It touches only the public
  `execute` surface and is unit-tested, and is the community-standard way to instrument `@nestjs/cqrs`
  v10 given the lack of middleware.

### ADR-4 — Public, network-restricted endpoint (no auth)
- **Decision**: `/api/metrics` is public via `@SkipSpace()`; access is restricted at the network layer.
- **Rationale**: Matches the chosen ops posture and the existing `/api/health` precedent. Bearer-token
  scraping adds secret management for marginal benefit when the network already isolates the endpoint.
- **Rejected**: token guard on the route (deferred; revisit if the endpoint must be internet-exposed);
  separate metrics port (extra server lifecycle, not requested).

### ADR-5 — Bounded label cardinality
- **Decision**: Labels use matched route templates / resolver field names / class names only.
- **Rationale**: Raw URLs, IDs, or tenant IDs as labels cause unbounded time-series growth that
  destroys Prometheus. Templates and class names are a small fixed set.

## 9. Risks / Assumptions

- **R1 (Med→Low)**: Missing `@SkipSpace()` → guards 401/400 the scraper. Mitigated by decorator + E2E
  asserting unauthenticated 200.
- **R2 (Med→Low)**: Label cardinality explosion. Mitigated by ADR-5 + a unit test asserting templates,
  not raw URLs.
- **R3 (Low)**: Bus override scope / constructor drift in `@nestjs/cqrs@10.2.8`. Mitigated by explicit
  constructors, unit specs, and the ADR-3 fallback.
- **R4 (Low)**: Double-registration of default collectors in tests. Mitigated by single `register()` +
  registry clear between unit cases.
- **Assumption**: GraphQL field-level metrics at resolver granularity are sufficient (no per-field
  tracing). Acceptable for throughput/latency dashboards.
- **Assumption**: No multi-process/cluster aggregation needed yet (single process per pod). If cluster
  mode lands, switch to `AggregatorRegistry` — out of scope.

## 10. Out of Scope

DB/TypeORM pool metrics, business/domain counters, token auth on the route, separate metrics port,
cluster aggregation, Grafana dashboards / alert rules / Prometheus scrape config. All deferrable on
the same registry without re-architecting this module.
