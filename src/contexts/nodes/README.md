# Nodes Module (IoT integration)

Owns the IoT integration between `gardenia-api`, `gardenia-bridge` (the
per-site Kafka↔MQTT edge gateway), and physical sensor/actuator nodes. It's
the first context in `gardenia-api` with a Kafka **consumer** — every other
context only ever produces domain events via
`@sisques-labs/nestjs-kit`'s `MessagingModule`.

Full design rationale lives in
`openspec/changes/nodes-context/{proposal,design}.md`.

---

## Quick orientation

```
src/contexts/nodes/
├── domain/
│   ├── aggregates/        # BridgeAggregate (claim state machine), NodeAggregate (online/offline)
│   ├── records/           # NodeTelemetryReading, NodeCommandAck — insert-only, NOT aggregates
│   ├── builders/          # BridgeBuilder, NodeBuilder
│   ├── enums/              # BridgeStatusEnum, NodeStatusEnum, SensorTypeEnum (closed catalog)
│   ├── events/             # BridgeBootstrapped, BridgeClaimed, NodeCreated, NodeWentOnline/Offline
│   ├── exceptions/         # BridgeNotFound, BridgeAlreadyClaimed, InvalidPairingCode, NodeNotFound
│   └── repositories/       # standard read/write ports + narrow insert-only ports for the records
├── application/
│   ├── commands/
│   │   ├── bootstrap-bridge/       # unauthenticated — bridge self-announcement
│   │   ├── claim-bridge/           # authenticated — links bridgeId -> active Space
│   │   ├── send-node-command/      # authenticated — produces to gardenia-bridge.commands
│   │   ├── record-telemetry-reading/  # INTERNAL — dispatched only by the Kafka consumer
│   │   ├── record-node-heartbeat/     # INTERNAL
│   │   └── record-node-command-ack/   # INTERNAL
│   ├── queries/            # node/bridge find-by-id/-criteria, telemetry find-by-criteria
│   ├── ports/               # INodeCommandProducerPort (outbound command producer)
│   └── services/
│       ├── write/find-or-create-node/   # resolves spaceId from the node's bridge, first-seen upsert
│       └── write|read/assert-*-exists/  # standard assert services
├── infrastructure/
│   ├── persistence/typeorm/    # entities, mappers, repositories
│   └── messaging/
│       ├── kafka/nodes-kafka-topics.constants.ts        # literal gardenia-bridge.* topic names
│       ├── kafka/nodes-kafka-consumer-bootstrap.service.ts  # 3x EVENT_CONSUMER.run()
│       ├── kafka/nodes-kafka-command-producer.adapter.ts    # raw kafkajs producer for .commands
│       └── parsers/            # Zod parsers, one per inbound message type
└── transport/
    ├── rest/        # BridgesController — POST /nodes/bridges/bootstrap only (@SkipSpace())
    ├── graphql/     # bridgeClaim, nodeSendCommand mutations; node/bridge/telemetry queries
    └── mcp/         # 7 tools (bridge_bootstrap deliberately excluded — no session context)
```

---

## The claim/pairing flow

```
1. Bridge boots, generates its own bridgeId (UUID), persists it locally.
2. POST /nodes/bridges/bootstrap { bridgeId }  — no auth, no space
     └─ BootstrapBridgeCommand
          ├─ creates/re-fetches BridgeAggregate
          ├─ bridge.bootstrap() → status=UNCLAIMED, fresh pairing code
          └─ pairing code is LOGGED (console/logs only — no other display channel)
3. User, inside their Space in gardenia-web, submits the pairing code.
     └─ GraphQL mutation `bridgeClaim { bridgeId, pairingCode }`
          └─ ClaimBridgeCommand (spaceId from SpaceContext)
               └─ bridge.claim(spaceId, code) → status=ACTIVE, spaceId set, code cleared
4. From here, any node relayed by that bridge inherits its Space implicitly
   — no per-node manual registration (see FindOrCreateNodeService below).
```

**Re-bootstrap semantics**: an `UNCLAIMED` bridge that re-announces gets a
**fresh** pairing code (old one invalidated). An `ACTIVE` bridge that
re-announces is a **no-op** — it can never be un-claimed by re-announcing.

---

## Kafka consumer — the novel piece

`gardenia-api` had never consumed from Kafka before this context. The
consumer capability (`IEventConsumer`/`KafkajsEventConsumerAdapter`) lives in
`@sisques-labs/nestjs-kit` (`^1.3.0`), symmetric to the existing
`IEventPublisher`. `NodesKafkaConsumerBootstrapService` (`OnModuleInit`)
opens three independent consumer groups:

| Topic | Handler |
|---|---|
| `gardenia-bridge.telemetry` | `RecordTelemetryReadingCommand` |
| `gardenia-bridge.heartbeat` | `RecordNodeHeartbeatCommand` |
| `gardenia-bridge.command-acks` | `RecordNodeCommandAckCommand` |

`gardenia-bridge.commands` is **outbound only** (`SendNodeCommand` →
`NodesKafkaCommandProducerAdapter`, a narrow gardenia-api-local kafkajs
producer — NOT the kit's `IEventPublisher`, whose envelope/topic scheme is
shaped for domain-event forwarding, not a device command).

### spaceId resolution without an HTTP request

The Kafka consumer path has no `SpaceInterceptor`-opened `SpaceContext` ALS
frame. `spaceId` is **always** resolved from the message's `bridgeId` (never
from the node) via the not-tenant-scoped `BRIDGE_READ_REPOSITORY`, then the
rest of the handler runs inside `spaceContext.run(spaceId, async () => ...)`
— the same tenant-scoped `NODE_READ_REPOSITORY`/`NODE_WRITE_REPOSITORY`
tokens used by HTTP/GraphQL handlers work correctly here too, because
`SpaceContext.run()` doesn't care who opens the ALS frame. See
`FindOrCreateNodeService`.

### Known upstream gap

`gardenia-bridge` does not emit `bridgeId` (on every message) or `commandId`
(on commands/acks) yet — that's a separate, not-yet-started change in that
repo. Until it ships:
- Every telemetry/heartbeat/command-ack message **fails to parse** (Zod
  requires `bridgeId`) and is logged + dropped. This is expected, not a bug
  — the consumer is built and ready, just waiting on the upstream field.
- `NodeCommandAck.commandId` is nullable and will be `null` for every ack in
  the meantime.

---

## Insert-only records — not aggregates

`NodeTelemetryReading` and `NodeCommandAck` are deliberately **not**
`BaseAggregate` subclasses — no domain events, no builder, no
`IBaseWriteRepository`. Their write repositories expose a single `insert()`
method instead (not intercepted by `createTenantRepository`, since
`spaceId` is already resolved and stamped onto the record before insert).
Do not "fix" this by forcing aggregate ceremony onto them — see
`openspec/changes/nodes-context/design.md` §3.4 for the full rationale.

---

## Bridge repositories are NOT tenant-scoped

Every other tenant-scoped repository in this codebase wraps
`createTenantRepository`. `BridgeTypeOrmReadRepository`/`WriteRepository`
deliberately do **not** — a bridge's `spaceId` is nullable and must be
resolvable *before* any space context exists (bootstrap, and the pre-claim
lookup in `AssertBridgeExistsService`). `BridgeTypeOrmReadRepository.findByCriteria`
applies the space filter manually in its own `QueryBuilder` instead (same
pattern every other context's `findByCriteria` already uses, since
`createQueryBuilder` bypasses the tenant proxy regardless).

---

## Out of scope (this context)

- `gardenia-bridge` envelope changes (`bridgeId`, `commandId`) — separate
  repo, separate change, owned by the user.
- `gardenia-web` claim/dashboard UI — separate OpenSpec proposal in that
  repo.
- Pairing code display beyond server logs.
- Node/bridge offline sweep job — `NodeAggregate.markOffline()` exists but
  nothing calls it on a timer yet.
- Actuator command catalog/validation — `SendNodeCommand` accepts an opaque
  `commandType` + payload.
