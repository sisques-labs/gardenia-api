# Prometheus Metrics Specification

## Purpose

Defines the Prometheus metrics capability for Gardenia API. Enables scraping of process, HTTP, and
CQRS metrics so operators can build dashboards and alerts on throughput, latency, and saturation,
without authentication and without coupling to any bounded context.

## Requirements

### Requirement: Metrics Exposition Endpoint

The system MUST expose `GET /api/metrics` returning HTTP 200 with the Prometheus text exposition
format (`Content-Type: text/plain; version=0.0.4`).

The endpoint MUST NOT require a JWT token or an `X-Space-ID` header. The `@SkipSpace()` decorator
MUST be present on the route so both `OptionalJwtAuthGuard` and `SpaceGuard` bypass it.

The capability MUST reside under `src/core/metrics/` — not under `src/contexts/`.

The implementation MUST use a single shared `prom-client` registry via
`@willsoto/nestjs-prometheus`; it MUST NOT instantiate ad-hoc registries.

#### Scenario: Unauthenticated scrape succeeds

- GIVEN the API is running
- WHEN a client sends `GET /api/metrics` with no `Authorization` header and no `X-Space-ID` header
- THEN the response status is `200 OK`
- AND the body is Prometheus exposition text

#### Scenario: Default process metrics are present

- GIVEN the API is running
- WHEN a client scrapes `GET /api/metrics`
- THEN the body contains Node/process default series (e.g. `process_cpu_user_seconds_total` and an
  `nodejs_eventloop_lag` family)

### Requirement: HTTP Request Metrics

The system MUST record, for every REST and GraphQL request, a duration observation in a histogram
named `http_request_duration_seconds` and an increment of a counter named `http_requests_total`.

Both metrics MUST be labelled with `method`, `route`, `status_code`, and `transport`
(`http` | `graphql`).

Labels MUST use the matched route template (REST) or resolver field name (GraphQL); they MUST NOT
contain raw URLs, query strings, path parameter values, or tenant identifiers.

#### Scenario: REST request is measured with a route template

- GIVEN the API is running
- WHEN a client calls a REST endpoint such as `GET /api/plants/123`
- THEN `http_requests_total` is incremented with `route` equal to the matched template
  (e.g. `/api/plants/:id`), `method='GET'`, `transport='http'`, and `status_code` of the response
- AND `http_request_duration_seconds` observes the request duration with the same labels
- AND no label contains the literal id `123`

#### Scenario: GraphQL operation is measured

- GIVEN the API is running
- WHEN a client executes a GraphQL query or mutation
- THEN `http_requests_total` is incremented with `transport='graphql'` and `route` equal to the
  resolver field name
- AND `http_request_duration_seconds` observes the duration with the same labels

#### Scenario: Failed request records an error status

- GIVEN the API is running
- WHEN a request handler throws
- THEN the metrics are still recorded with `status_code` reflecting the error status (or `500` when
  none is present)

### Requirement: CQRS Handler Metrics

The system MUST record, for every command and query dispatched through the CQRS buses, a duration
observation in `cqrs_handler_duration_seconds` and an increment of `cqrs_handler_total`, labelled
with `type` (the command/query class name), `kind` (`command` | `query`), and `status`
(`success` | `error`).

Instrumentation MUST be achieved without editing individual command/query handlers. Because
`@nestjs/cqrs@10` registers handlers onto the single global `CommandBus`/`QueryBus` instances and
exposes no command/query middleware, the system MUST wrap the `execute` method of those shared
instances at startup (a DI `useClass` override would create a second, handler-less instance).

The system MUST increment a counter `cqrs_events_published_total`, labelled `event` (the event class
name), for every domain event published on the `EventBus`.

#### Scenario: Successful command is measured

- GIVEN the API is running
- WHEN a command is dispatched and its handler completes successfully
- THEN `cqrs_handler_total` is incremented with `kind='command'`, `status='success'`, and `type`
  equal to the command class name
- AND `cqrs_handler_duration_seconds` observes the handler duration with the same labels

#### Scenario: Failing query is measured and the error propagates

- GIVEN the API is running
- WHEN a query handler throws
- THEN `cqrs_handler_total` is incremented with `kind='query'` and `status='error'`
- AND the original error is rethrown to the caller (metrics MUST NOT swallow it)

#### Scenario: Published domain event is counted

- GIVEN the API is running
- WHEN a handler publishes a domain event on the `EventBus`
- THEN `cqrs_events_published_total` is incremented with `event` equal to the event class name

### Requirement: Handlers Remain Unmodified

Existing command, query, and event handlers across all bounded contexts MUST NOT be edited to add
metrics. Instrumentation MUST be transparent via the wrapped shared CQRS buses and the global HTTP
interceptor.

#### Scenario: No handler files change

- GIVEN the metrics change is applied
- WHEN the diff is inspected
- THEN no files under `src/contexts/**/application/**/*.handler.ts` are modified for metrics purposes
