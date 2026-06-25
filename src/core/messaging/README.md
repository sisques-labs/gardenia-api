# Messaging (`src/core/messaging`)

Bridges the in-process domain `EventBus` (`@nestjs/cqrs`) to **Kafka**. Every domain
event published by a command handler is delivered in-process *and*, additionally,
forwarded to a Kafka topic — without editing a single handler or aggregate.

Cross-cutting operational infra (no domain model), beside `metrics/`, `observability/`
and `health/`.

## How it works

`@nestjs/cqrs@10` registers handlers onto the single global `EventBus` singleton,
which extends `Observable`. `DomainEventForwarderService` subscribes to that stream
at `onModuleInit` (the same technique as `CqrsMetricsService`) and republishes each
event through the `EVENT_PUBLISHER` port. **No handler or aggregate is touched.**

```
EventBus (in-process)  ──subscribe──▶  DomainEventForwarderService
                                              │  resolve module + action
                                              ▼
                                       IEventPublisher (port)
                                       └─ KafkajsEventPublisherAdapter
                                          (no-op when KAFKA_ENABLED=false)
```

Forwarding is **best-effort**: a publish failure is logged and swallowed, never
affecting the command flow. The in-process bus already delivered the event; Kafka is
a secondary, downstream consumer. (No transactional outbox — see *Guarantees*.)

## Topics & message shape

| Aspect | Value | Rationale |
|--------|-------|-----------|
| Topic | `${KAFKA_TOPIC_PREFIX}.${module}` — e.g. `gardenia-api.plants` | One topic per bounded context; bounded topic count |
| Partition key | `aggregateRootId` | Preserves per-entity ordering |
| Action | `event-type` header — e.g. `plant-updated` | Routing/filtering without topic explosion |
| Value | JSON envelope (metadata + `data`) | Self-describing, language-agnostic |

### Headers

`event-id`, `event-type` (kebab action), `event-class` (raw, e.g. `PlantUpdatedEvent`),
`aggregate-type`, `entity-id`, `entity-type`, `schema-version`, `occurred-at` (ISO),
and `correlation-id` / `causation-id` when present.

### Module mapping

A `BaseEvent` carries `aggregateRootType` (`PlantAggregate`) but not its bounded
context, and the relationship is not derivable by convention (`auth` owns three
aggregates; modules are pluralised/kebab-cased independently). The mapping is therefore
**explicit** in `domain/topics/aggregate-module.map.ts`.

> **When you add a new aggregate, add it to `AGGREGATE_MODULE_MAP`.** Unmapped
> aggregates are routed to the `${prefix}.unmapped` topic and logged with a warning
> (once per type) so nothing is silently dropped.

## Configuration

Opt-in via `KAFKA_ENABLED` (default `false`) — the adapter creates no producer and
is a no-op when disabled, so the app boots without a broker locally and in tests.
See `.env.example` for the full list.

| Var | Default | Notes |
|-----|---------|-------|
| `KAFKA_ENABLED` | `false` | `true` to forward |
| `KAFKA_BROKERS` | — | Comma-separated; **required** when enabled |
| `KAFKA_CLIENT_ID` | `gardenia-api` | |
| `KAFKA_TOPIC_PREFIX` | `gardenia-api` | Topic = `${prefix}.${module}` |
| `KAFKA_SSL` | `false` | |
| `KAFKA_SASL_MECHANISM` / `_USERNAME` / `_PASSWORD` | — | SASL enabled when username+password set |

## Structure (DDD layers)

```
src/core/messaging/
├── messaging.module.ts
├── domain/
│   ├── interfaces/outbound-event.interface.ts   — transport-agnostic event shape
│   ├── ports/event-publisher.port.ts            — IEventPublisher + EVENT_PUBLISHER token
│   └── topics/
│       ├── aggregate-module.map.ts              — aggregateRootType -> module
│       └── event-routing.ts                     — resolveModule + deriveAction (pure)
├── application/
│   └── services/domain-event-forwarder.service.ts  — subscribes to EventBus, forwards
└── infrastructure/
    └── kafka/
        └── kafkajs-event-publisher.adapter.ts   — kafkajs producer (no-op when disabled)
```

## Guarantees

Best-effort / fire-and-forget (at-most-once from Kafka's perspective). Because we
write to Postgres and then publish in-memory, an event can be lost if the broker is
unreachable at publish time. If at-least-once delivery becomes a requirement, the
next step is a **transactional outbox** (persist events in the same DB transaction,
relay to Kafka from a poller) — a deliberately larger change, intentionally out of
scope here.

## Tests

Unit only (`*.spec.ts`, co-located): routing, forwarder (mocked `EventBus` + port),
kafkajs adapter (mocked `kafkajs`), and config parsing. Integration/E2E are skipped:
they would require a live broker, and the forwarder is decoupled from the command
flow (disabled by default), so HTTP/persistence E2E behaviour is unchanged.
```
