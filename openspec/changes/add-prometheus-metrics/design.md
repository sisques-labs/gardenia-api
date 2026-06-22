# Technical Design — add-prometheus-metrics

## 1. Overview

Expose a public `GET /api/metrics` endpoint in Prometheus exposition format, backed by a single
shared `prom-client` registry wired through `@willsoto/nestjs-prometheus`. Three metric sources
feed the registry:

1. **Default process/Node metrics** — enabled by the library's default collectors.
2. **HTTP metrics** — one global `APP_INTERCEPTOR` observing REST + GraphQL executions.
3. **CQRS metrics** — metered `CommandBus`/`QueryBus` subclasses + an `EventBus` subscriber.

The module lives in `src/core/observability/metrics/` (cross-cutting infra, no domain model) and
is wired into `AppModule`. The route bypasses both global guards via `@SkipSpace()`, exactly like
`HealthController`.

## 2. Architecture Approach

- **Pattern**: Plain NestJS module + transport controller (provided by the library) + one global
  interceptor + DI-swapped CQRS buses. No domain/application layers — there is no business model,
  this is operational instrumentation (screaming architecture: the code DOES "measure and expose").
- **Single registry**: `PrometheusModule.register()` owns one global `Registry`. All custom metrics
  are registered as Nest providers (`makeHistogramProvider` / `makeCounterProvider`) against that
  registry and injected where needed. No ad-hoc `new Registry()`.
- **Zero handler edits**: CQRS instrumentation is achieved by replacing the framework buses via DI
  (`{ provide: CommandBus, useClass: MeteredCommandBus }`), so the ~11 bounded contexts and all
  their handlers stay untouched.
- **Bounded label cardinality**: HTTP labels use the *matched route template* and a coarse status,
  never raw URLs, query strings, IDs, or per-tenant values.

## 3. File Tree (exact paths)

```
src/core/observability/metrics/
├── metrics.module.ts
├── metrics.constants.ts
├── transport/
│   ├── metrics.controller.ts          # only if a custom @SkipSpace route is needed (see §6.1)
│   └── metrics.controller.spec.ts
├── interceptors/
│   ├── http-metrics.interceptor.ts
│   └── http-metrics.interceptor.spec.ts
└── cqrs/
    ├── metered-command-bus.ts
    ├── metered-command-bus.spec.ts
    ├── metered-query-bus.ts
    ├── metered-query-bus.spec.ts
    └── event-metrics.subscriber.ts
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
import { CommandBus, CqrsModule, EventBus, QueryBus } from '@nestjs/cqrs';
import {
  PrometheusModule,
  makeCounterProvider,
  makeHistogramProvider,
} from '@willsoto/nestjs-prometheus';

import { HttpMetricsInterceptor } from './interceptors/http-metrics.interceptor';
import { MeteredCommandBus } from './cqrs/metered-command-bus';
import { MeteredQueryBus } from './cqrs/metered-query-bus';
import { EventMetricsSubscriber } from './cqrs/event-metrics.subscriber';
import * as M from './metrics.constants';

@Module({
  imports: [
    CqrsModule,
    PrometheusModule.register({
      // Route resolves to /api/metrics under the global 'api' prefix; SkipSpace applied
      // via a custom controller (see §6.1) OR by extending the default controller.
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
    // Swap the framework buses for metered subclasses — handlers inject CommandBus/QueryBus
    // by token and transparently get the metered version.
    { provide: CommandBus, useClass: MeteredCommandBus },
    { provide: QueryBus, useClass: MeteredQueryBus },
    EventMetricsSubscriber,
  ],
})
export class MetricsModule {}
```

> Note: `{ provide: CommandBus, useClass: MeteredCommandBus }` must live where it overrides the
> global CqrsModule binding. Verify at apply-time that handlers across contexts resolve the metered
> bus (they inject by the `CommandBus`/`QueryBus` token). If the global override proves unreliable
> across feature modules, fall back to subscribing to the buses' observable streams (see ADR-3
> alternative) — counting via stream, timing via a thin wrapper provider exported from this module.

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

### 4.4 `cqrs/metered-command-bus.ts`

```ts
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { CommandBus, ICommand } from '@nestjs/cqrs';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';

import * as M from '../metrics.constants';

@Injectable()
export class MeteredCommandBus extends CommandBus {
  constructor(
    moduleRef: ModuleRef,
    @InjectMetric(M.CQRS_HANDLER_DURATION) private readonly duration: Histogram<string>,
    @InjectMetric(M.CQRS_HANDLER_TOTAL) private readonly total: Counter<string>,
  ) {
    super(moduleRef);
  }

  async execute<T extends ICommand, R = unknown>(command: T): Promise<R> {
    const type = command.constructor.name;
    const start = process.hrtime.bigint();
    try {
      const result = await super.execute<T, R>(command);
      this.observe(type, 'success', start);
      return result;
    } catch (err) {
      this.observe(type, 'error', start);
      throw err;
    }
  }

  private observe(type: string, status: 'success' | 'error', start: bigint) {
    const labels = { type, kind: 'command', status };
    this.duration.observe(labels, Number(process.hrtime.bigint() - start) / 1e9);
    this.total.inc(labels);
  }
}
```

`MeteredQueryBus` is identical with `QueryBus`, `IQuery`, and `kind: 'query'`.

> Version caveat (`@nestjs/cqrs@10.2.8`): `CommandBus`/`QueryBus` constructors take `ModuleRef`.
> The explicit constructor above is REQUIRED — a subclass without a declared constructor emits no
> `design:paramtypes`, so Nest could not inject `ModuleRef`/metrics. Apply-time MUST confirm the
> `super(...)` signature against the installed version.

### 4.5 `cqrs/event-metrics.subscriber.ts`

Events are counted by subscribing to the stock `EventBus` observable stream — no subclassing,
avoiding its heavier constructor (`commandBus`, `moduleRef`, `unhandledExceptionBus`).

```ts
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { EventBus, IEvent } from '@nestjs/cqrs';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter } from 'prom-client';
import { Subscription } from 'rxjs';

import { CQRS_EVENTS_PUBLISHED_TOTAL } from '../metrics.constants';

@Injectable()
export class EventMetricsSubscriber implements OnModuleInit, OnModuleDestroy {
  private subscription?: Subscription;

  constructor(
    private readonly eventBus: EventBus,
    @InjectMetric(CQRS_EVENTS_PUBLISHED_TOTAL) private readonly counter: Counter<string>,
  ) {}

  onModuleInit(): void {
    // EventBus extends ObservableBus<IEvent> — it is itself an Observable of published events.
    this.subscription = this.eventBus.subscribe((event: IEvent) => {
      this.counter.inc({ event: event.constructor.name });
    });
  }

  onModuleDestroy(): void {
    this.subscription?.unsubscribe();
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
import { MetricsModule } from '@core/observability/metrics/metrics.module';
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

### ADR-1 — Location: `src/core/observability/metrics/`
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

### ADR-3 — CQRS via DI-swapped buses, events via stream subscription
- **Decision**: Replace `CommandBus`/`QueryBus` with metered subclasses through DI; count events by
  subscribing to the stock `EventBus` observable.
- **Rationale**: `@nestjs/cqrs` has no command/query middleware. Subclassing + DI override times every
  command/query with ZERO edits to the ~11 contexts and their handlers. Events are already an
  observable stream on `EventBus`, so a subscriber counts publishes without touching the bus's heavier
  constructor.
- **Rejected**: editing every handler (huge churn, easy to miss new handlers); subclassing `EventBus`
  (couples to a 3-arg constructor that is more fragile across versions).
- **Fallback**: if the global `useClass` override does not reach buses resolved inside feature modules,
  wrap timing in an exported provider and subscribe to `CommandBus`/`QueryBus` streams for counting —
  documented here so apply-time has a known path.

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
