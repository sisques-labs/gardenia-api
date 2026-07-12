# Design: Nodes Bounded Context (IoT integration)

> Technical design for `nodes` — the first context with a Kafka **consumer**
> and the first with insert-only historical records (no aggregate ceremony).
> Everything else composes existing, proven patterns (`plants` for CRUD
> shape, `spaces` for claim-style state transitions, `qr`/`files` for MCP
> tooling).

---

## 1. Approach Summary

- **`BridgeAggregate`/`NodeAggregate`** follow the standard
  `BaseAggregate`/`Builder`/`ViewModel` shape used everywhere else in the
  codebase — VO-typed domain fields, bare-string FK fields (`spaceId`,
  `bridgeId`), whole-aggregate events.
- **`NodeTelemetryReading`/`NodeCommandAck` are deliberately NOT aggregates.**
  The proposal is explicit that these have no invariants beyond "store this
  reading" — introducing `BaseAggregate`/domain events/a write-side
  `IBaseWriteRepository<Aggregate>` for them would be ceremony with no
  payoff. They get a narrower shape: a plain primitives interface, a
  `BaseViewModel`-based read side (so they plug into the mandatory Criteria
  pattern for `NodeTelemetryReadingFindByCriteria`), and a **write-only
  `insert()` repository method** instead of the base `save`/`delete`
  contract. This is a conscious, documented deviation — see §3.4.
- **Kafka consumer** is a single `NodesKafkaConsumerBootstrapService`
  (`OnModuleInit`) that calls the new `EVENT_CONSUMER.run()` three times, one
  per inbound topic, each dispatching a raw parsed message to a dedicated
  internal `CommandBus` command. This keeps all three call sites identical in
  shape and keeps parsing/validation inside the command handlers (testable
  without Kafka).
- **Kafka producer for `SendNodeCommand`** intentionally does **not** reuse
  `IEventPublisher`/`EVENT_PUBLISHER`. That port's envelope
  (`eventId`/`aggregateRootType`/`schemaVersion`/…) and topic scheme
  (`${topicPrefix}.${module}`) are shaped for domain-event forwarding, not
  for a device command. Forcing a command into that envelope would mean
  `gardenia-bridge` receiving domain-event framing on `gardenia-api.nodes`
  instead of the fixed `gardenia-bridge.commands` topic it already listens
  to. A second kit-level port for "raw message to an explicit topic" is
  reasonable long-term, but not worth another cross-repo release cycle for
  one call site right now — this change adds a narrow, gardenia-api-local
  `NodesKafkaCommandProducerAdapter` using `kafkajs` directly (same
  `IKafkaConfig` config namespace, `KAFKA_ENABLED` no-op gate, one
  `Producer`). Revisit folding this into the kit if a second raw-publish
  use case shows up.
- **Bootstrap endpoint auth**: reuses the existing `@SkipSpace()` decorator
  (`src/shared/decorators/skip-space.decorator.ts`), which already bypasses
  **both** `OptionalJwtAuthGuard` and `SpaceGuard` for routes like
  `/auth/register`. No new guard mechanism needed.

---

## 2. File Tree

All paths relative to repo root. `*` marks new files.

```
src/contexts/nodes/
├── domain/
│   ├── aggregates/
│   │   ├── bridge.aggregate.ts                                    *
│   │   └── node.aggregate.ts                                      *
│   ├── builders/
│   │   ├── bridge.builder.ts                                      *
│   │   └── node.builder.ts                                        *
│   ├── records/
│   │   ├── node-telemetry-reading.record.ts                       *   (plain class, no BaseAggregate)
│   │   └── node-command-ack.record.ts                             *
│   ├── interfaces/
│   │   ├── bridge.interface.ts                                    *
│   │   ├── node.interface.ts                                      *
│   │   ├── node-telemetry-reading.interface.ts                    *
│   │   └── node-command-ack.interface.ts                          *
│   ├── primitives/
│   │   ├── bridge.primitives.ts                                   *
│   │   └── node.primitives.ts                                     *
│   ├── view-models/
│   │   ├── bridge.view-model.ts                                   *
│   │   ├── node.view-model.ts                                     *
│   │   └── node-telemetry-reading.view-model.ts                   *
│   ├── value-objects/
│   │   ├── bridge-id/bridge-id.value-object.ts                    *
│   │   ├── bridge-name/bridge-name.value-object.ts                *
│   │   ├── bridge-status/bridge-status.value-object.ts            *
│   │   ├── pairing-code/pairing-code.value-object.ts               *
│   │   ├── node-id/node-id.value-object.ts                        *
│   │   ├── node-name/node-name.value-object.ts                    *
│   │   └── node-status/node-status.value-object.ts                *
│   ├── enums/
│   │   ├── bridge-status.enum.ts                                  *   (UNCLAIMED, ACTIVE, OFFLINE)
│   │   ├── node-status.enum.ts                                    *   (ONLINE, OFFLINE)
│   │   └── sensor-type.enum.ts                                    *   (7-value closed catalog)
│   ├── events/
│   │   ├── interfaces/
│   │   │   ├── bridge-event-data.interface.ts                     *
│   │   │   └── node-event-data.interface.ts                       *
│   │   ├── bridge-bootstrapped/bridge-bootstrapped.event.ts        *
│   │   ├── bridge-claimed/bridge-claimed.event.ts                 *
│   │   ├── node-created/node-created.event.ts                     *
│   │   ├── node-went-online/node-went-online.event.ts             *
│   │   └── node-went-offline/node-went-offline.event.ts           *
│   ├── exceptions/
│   │   ├── bridge-not-found.exception.ts                          *
│   │   ├── bridge-already-claimed.exception.ts                    *
│   │   ├── invalid-pairing-code.exception.ts                      *
│   │   └── node-not-found.exception.ts                            *
│   └── repositories/
│       ├── read/
│       │   ├── bridge-read.repository.ts                          *
│       │   ├── node-read.repository.ts                            *
│       │   └── node-telemetry-reading-read.repository.ts          *
│       └── write/
│           ├── bridge-write.repository.ts                         *
│           ├── node-write.repository.ts                           *
│           ├── node-telemetry-reading-write.repository.ts         *   (insert-only interface)
│           └── node-command-ack-write.repository.ts               *   (insert-only interface)
├── application/
│   ├── commands/
│   │   ├── bootstrap-bridge/{bootstrap-bridge.command.ts,.handler.ts}         *
│   │   ├── claim-bridge/{claim-bridge.command.ts,.handler.ts}                 *
│   │   ├── send-node-command/{send-node-command.command.ts,.handler.ts}       *
│   │   ├── record-telemetry-reading/{….command.ts,.handler.ts}                *   (internal — Kafka-dispatched)
│   │   ├── record-node-heartbeat/{….command.ts,.handler.ts}                   *   (internal)
│   │   └── record-node-command-ack/{….command.ts,.handler.ts}                 *   (internal)
│   ├── queries/
│   │   ├── node-find-by-id/{….query.ts,.handler.ts}                          *
│   │   ├── node-find-by-criteria/{….query.ts,.handler.ts}                    *
│   │   ├── bridge-find-by-id/{….query.ts,.handler.ts}                        *
│   │   ├── bridge-find-by-criteria/{….query.ts,.handler.ts}                  *
│   │   └── node-telemetry-reading-find-by-criteria/{….query.ts,.handler.ts}  *
│   └── services/
│       ├── read/
│       │   ├── assert-bridge-view-model-exists/….service.ts                  *
│       │   └── assert-node-view-model-exists/….service.ts                    *
│       └── write/
│           ├── assert-bridge-exists/….service.ts                             *
│           ├── assert-node-exists/….service.ts                               *
│           └── find-or-create-node/find-or-create-node.service.ts            *   (first-seen upsert, shared by telemetry+heartbeat handlers)
├── infrastructure/
│   ├── persistence/typeorm/
│   │   ├── entities/
│   │   │   ├── bridge.entity.ts                                   *
│   │   │   ├── node.entity.ts                                     *
│   │   │   ├── node-telemetry-reading.entity.ts                   *
│   │   │   └── node-command-ack.entity.ts                         *
│   │   ├── mappers/
│   │   │   ├── bridge-typeorm.mapper.ts                           *
│   │   │   ├── node-typeorm.mapper.ts                             *
│   │   │   └── node-telemetry-reading-typeorm.mapper.ts           *
│   │   └── repositories/
│   │       ├── bridge-typeorm-{read,write}.repository.ts          *
│   │       ├── node-typeorm-{read,write}.repository.ts            *
│   │       ├── node-telemetry-reading-typeorm-{read,write}.repository.ts *
│   │       └── node-command-ack-typeorm-write.repository.ts       *
│   └── messaging/
│       ├── kafka/
│       │   ├── nodes-kafka-topics.constants.ts                    *   (literal gardenia-bridge.* topic names)
│       │   ├── nodes-kafka-consumer-bootstrap.service.ts          *   (OnModuleInit, 3x EVENT_CONSUMER.run())
│       │   └── nodes-kafka-command-producer.adapter.ts            *   (raw kafkajs Producer for gardenia-bridge.commands)
│       └── parsers/
│           ├── telemetry-message.parser.ts                        *   (Zod schema + parse)
│           ├── heartbeat-message.parser.ts                        *
│           └── command-ack-message.parser.ts                      *
├── transport/
│   ├── rest/
│   │   ├── controllers/
│   │   │   └── bridges.controller.ts                               *   (POST /nodes/bridges/bootstrap only)
│   │   └── dtos/
│   │       ├── bootstrap-bridge.dto.ts                             *
│   │       └── bridge-rest-response.dto.ts                        *
│   ├── graphql/
│   │   ├── resolvers/
│   │   │   ├── bridge-queries.resolver.ts                          *
│   │   │   ├── bridge-mutations.resolver.ts                        *   (bridgeClaim only — bootstrap is REST-only)
│   │   │   ├── node-queries.resolver.ts                            *
│   │   │   └── node-mutations.resolver.ts                          *   (nodeSendCommand)
│   │   ├── dtos/requests/…, dtos/responses/…                       *   (per query/mutation, mirrors plants pattern)
│   │   ├── enums/nodes-registered-enums.graphql.ts                 *   (BridgeStatus, NodeStatus, SensorType)
│   │   ├── enums/{node,bridge,node-telemetry-reading}-queryable-field.enum.ts *
│   │   └── registries/{node,bridge,node-telemetry-reading}-filterable-fields.registry.ts (+ .spec.ts) *
│   └── mcp/
│       ├── tools/
│       │   ├── bridge-claim.tool.ts                                *
│       │   ├── bridge-find-by-id.tool.ts                           *
│       │   ├── bridge-find-by-criteria.tool.ts                     *
│       │   ├── node-find-by-id.tool.ts                             *
│       │   ├── node-find-by-criteria.tool.ts                       *
│       │   ├── node-send-command.tool.ts                           *
│       │   └── node-telemetry-reading-find-by-criteria.tool.ts     *
│       └── schemas/                                                 *   (one Zod schema file per tool)
└── nodes.module.ts                                                 *

src/database/migrations/
├── {next}-CreateBridges.ts                                        *
├── {next+1}-CreateNodes.ts                                        *
├── {next+2}-CreateNodeTelemetryReadings.ts                        *
└── {next+3}-CreateNodeCommandAcks.ts                               *

src/app.module.ts                          MODIFIED (add NodesModule)
src/core/filters/base-exception.filter.ts  MODIFIED (register 4 new exceptions)
package.json                                MODIFIED (@sisques-labs/nestjs-kit -> ^1.3.0)
```

---

## 3. Domain Layer Design

### 3.1 `BridgeAggregate` (extends `BaseAggregate`)

**Fields:** `_id: BridgeIdValueObject` (readonly — supplied by the bridge,
NOT generated here), `_spaceId: string | null`, `_name:
BridgeNameValueObject | null`, `_status: BridgeStatusValueObject`,
`_pairingCode: PairingCodeValueObject | null`, `_lastSeenAt: Date | null`.

- **`bootstrap(): void`** — only callable from `unclaimed` state (idempotent
  re-bootstrap of an already-`active` bridge is a **no-op**, not an error —
  a bridge that reboots after being claimed should not be able to un-claim
  itself by re-announcing). Sets a freshly-generated `PairingCodeValueObject`
  (format `GRDN-XXXX`, 4 uppercase alphanumerics), emits
  `BridgeBootstrappedEvent`.
- **`claim(spaceId: string, suppliedCode: string): void`** — throws
  `InvalidPairingCodeException` if `_status !== UNCLAIMED` or
  `suppliedCode !== _pairingCode?.value`. On success: `_spaceId = spaceId`,
  `_status = ACTIVE`, `_pairingCode = null`, emits `BridgeClaimedEvent`.
- **`rename(name: string): void`** — sets `_name`, `touch()`. No event (not
  in proposal scope beyond the field existing — mirrors how `plants`
  auxiliary fields don't each get an event; a future feature can add one).
- **`toPrimitives(): IBridgePrimitives`**.
- Getters: `id`, `spaceId`, `name`, `status`, `pairingCode`, `lastSeenAt`.

> **Why `bridgeId` is NOT generated by `gardenia-api`:** unlike every other
> aggregate in this codebase, the bridge supplies its own UUID at bootstrap
> (generated on-device, persisted to its local disk per the architecture
> vision doc). `BootstrapBridgeCommandHandler` therefore does **not** call
> `UuidValueObject.generate()` — it takes the incoming `bridgeId` string
> directly. `BridgeIdValueObject` still validates UUID shape.

### 3.2 `NodeAggregate` (extends `BaseAggregate`)

**Fields:** `_id: NodeIdValueObject` (readonly, node-supplied like
`bridgeId`), `_spaceId: string`, `_bridgeId: string`, `_name:
NodeNameValueObject | null`, `_status: NodeStatusValueObject`,
`_lastSeenAt: Date | null`.

- **`create(): void`** — emits `NodeCreatedEvent`. Called on first-seen
  (see `FindOrCreateNodeService`, §4.6).
- **`markOnline(): void`** — no-op (no event) if already `ONLINE`; otherwise
  sets `_status = ONLINE`, `touch()`, emits `NodeWentOnlineEvent`.
- **`markOffline(): void`** — symmetric, emits `NodeWentOfflineEvent`. Not
  called anywhere in this change (no sweep job — see proposal Out of Scope);
  exists so the offline-sweep follow-up is a pure application-layer addition
  with zero domain changes.
- **`touchLastSeen(at: Date): void`** — updates `_lastSeenAt` without
  necessarily flipping status (heartbeat handler calls both `markOnline()`
  and `touchLastSeen()`).
- Getters: `id`, `spaceId`, `bridgeId`, `name`, `status`, `lastSeenAt`.

### 3.3 Value Objects

| VO | Base | Rules |
|----|------|-------|
| `BridgeIdValueObject` | `UuidValueObject` | one-liner |
| `BridgeNameValueObject` | `StringValueObject` | `maxLength: 100`, optional |
| `BridgeStatusValueObject` | `EnumValueObject<typeof BridgeStatusEnum>` | copy of `UserStatusValueObject` shape |
| `PairingCodeValueObject` | `StringValueObject` | `maxLength: 16`, format `GRDN-[A-Z0-9]{4}` validated in constructor (throws `InvalidPairingCodeException` — reused across "malformed" and "mismatched" cases per §3.6) |
| `NodeIdValueObject` | `UuidValueObject` | one-liner |
| `NodeNameValueObject` | `StringValueObject` | `maxLength: 100`, optional |
| `NodeStatusValueObject` | `EnumValueObject<typeof NodeStatusEnum>` | |

### 3.4 Insert-only records — `NodeTelemetryReading` / `NodeCommandAck`

**Deliberately not `BaseAggregate` subclasses.** Shape:

```ts
// domain/records/node-telemetry-reading.record.ts
export class NodeTelemetryReading {
  private constructor(
    public readonly id: string,
    public readonly spaceId: string,
    public readonly nodeId: string,
    public readonly sensorType: SensorTypeEnum,
    public readonly value: number,
    public readonly unit: string | null,
    public readonly recordedAt: Date,
  ) {}

  static create(props: {
    spaceId: string; nodeId: string; sensorType: SensorTypeEnum;
    value: number; unit: string | null; recordedAt: Date;
  }): NodeTelemetryReading {
    return new NodeTelemetryReading(
      UuidValueObject.generate().value, props.spaceId, props.nodeId,
      props.sensorType, props.value, props.unit, props.recordedAt,
    );
  }
}
```

No `BaseAggregate`, no domain events, no builder. `NodeCommandAck` mirrors
this exactly (`commandId: string | null`, `nodeId`, `spaceId`, `result:
string`, `receivedAt: Date`).

**Read side still uses `BaseViewModel`** — `NodeTelemetryReadingViewModel
extends BaseViewModel` with the same fields — because
`NodeTelemetryReadingFindByCriteria` MUST use the mandatory Criteria/read
repository pattern (`IBaseReadRepository<T>`, `findByCriteria` via
`QueryBuilder`), and that pattern is defined against `BaseViewModel`, not
against aggregates. `NodeCommandAck` gets NO view model / no query in this
change (see proposal — not surfaced yet) but keeps the same
primitives/entity shape for consistency if a query is added later.

**Write side gets a narrower port than `IBaseWriteRepository<Aggregate>`:**

```ts
// domain/repositories/write/node-telemetry-reading-write.repository.ts
export const NODE_TELEMETRY_READING_WRITE_REPOSITORY = Symbol(
  'NODE_TELEMETRY_READING_WRITE_REPOSITORY',
);
export interface INodeTelemetryReadingWriteRepository {
  insert(reading: NodeTelemetryReading): Promise<void>;
}
```

No `findById`/`save`/`delete` — a telemetry reading is never updated or
individually deleted through the application layer (retention/pruning, if
ever needed, is an infra-level bulk operation, not a domain one). This is
the one place in the codebase where a repository interface does NOT extend
the kit's base interfaces — call this out explicitly in code review; it is
intentional, not an oversight.

### 3.5 `SensorTypeEnum` (`domain/enums/sensor-type.enum.ts`)

```ts
export enum SensorTypeEnum {
  SOIL_MOISTURE = 'SOIL_MOISTURE',
  SOIL_TEMPERATURE = 'SOIL_TEMPERATURE',
  AMBIENT_TEMPERATURE = 'AMBIENT_TEMPERATURE',
  AMBIENT_HUMIDITY = 'AMBIENT_HUMIDITY',
  LIGHT_LEVEL = 'LIGHT_LEVEL',
  RAIN = 'RAIN',
  WATER_LEVEL = 'WATER_LEVEL',
}
```

No corresponding value-object wrapper (it is a plain enum column on a
non-aggregate record, same rationale as §3.4) — but it IS registered as a
GraphQL enum (`SensorTypeEnum` via `registerEnumType`) and used by the
`node-telemetry-reading-filterable-fields.registry.ts` as `{ type: 'enum',
enum: SensorTypeEnum }`, per the mandatory Criteria pattern.

### 3.6 Exceptions

- `BridgeNotFoundException` (404) — copy of `PlantNotFoundException` shape.
- `BridgeAlreadyClaimedException` (409/CONFLICT — first new status code in
  this codebase; see §11 Risk) — thrown by `claim()` when `_status !==
  UNCLAIMED`.
- `InvalidPairingCodeException` (400) — thrown by `claim()` when the code
  doesn't match, and by `PairingCodeValueObject`'s constructor when
  malformed.
- `NodeNotFoundException` (404).

**MANDATORY filter wiring** — add all four to
`src/core/filters/base-exception.filter.ts`. `BridgeAlreadyClaimedException`
needs a **new** `HttpStatus.CONFLICT` branch in `resolveStatus()` (every
existing exception in the codebase maps to 400/403/404 only) — add it
explicitly, don't fold it into 400.

### 3.7 Repository Interfaces

Standard `IBaseReadRepository<ViewModel>`/`IBaseWriteRepository<Aggregate>`
pattern (Symbol tokens) for `Bridge` and `Node`, exactly like `plants`.
`NodeTelemetryReading` read side uses `IBaseReadRepository<…ViewModel>`;
write side uses the narrow `insert()`-only interface from §3.4.
`NodeCommandAck` gets only the narrow write interface (no read repo, no
query in this change).

---

## 4. Application Layer Design

### 4.1 `BootstrapBridgeCommand` + Handler

**Inputs:** `{ bridgeId: string }`. **Handler:**
1. `existing = await bridgeWriteRepository.findById(bridgeId)`.
2. If absent: build a new `BridgeAggregate` (`withId(bridgeId)` — NOT
   generated — `.withStatus(UNCLAIMED)...`), call `.bootstrap()`, save,
   publish events, return `{ bridgeId, pairingCode }`.
3. If present and `status === UNCLAIMED`: call `.bootstrap()` again
   (rotates the pairing code — a bridge that reboots before being claimed
   gets a fresh code, old one invalidated), save, publish, return the new
   code.
4. If present and `status !== UNCLAIMED`: **no-op**, return `{ bridgeId,
   pairingCode: null }` (already claimed — nothing to show).
5. **Logging**: the pairing code is logged at `Logger.log` level in the
   handler (`Bridge ${bridgeId} bootstrapped, pairing code: ${code}`) —
   this IS the "log/console only" display mechanism confirmed in the
   architecture vision doc. No other delivery channel.

No auth — dispatched from an `@SkipSpace()` REST controller.

### 4.2 `ClaimBridgeCommand` + Handler

**Inputs:** `{ bridgeId: string; pairingCode: string; spaceId: string }`
(`spaceId` from `SpaceContext.require()`, injected into the handler exactly
like `CreatePlantCommandHandler` injects `SpaceContext` — see plant-context
design §4.1 for the precedent).

1. `bridge = await assertBridgeExistsService.execute(bridgeId)` — this is
   the ONE place a `BridgeNotFoundException` can surface on claim.
2. `bridge.claim(spaceId, pairingCode)` — throws
   `BridgeAlreadyClaimedException` / `InvalidPairingCodeException`.
3. Save, publish events.

> **Note:** `AssertBridgeExistsService` here is intentionally NOT
> tenant-scoped the way `AssertPlantExistsService` is (`createTenantRepository`
> filters by the ALREADY-active space) — a bridge being claimed has no
> `spaceId` yet (`unclaimed`), so `BridgeTypeOrmWriteRepository` must NOT be
> wrapped in `createTenantRepository` the way `plants`/`nodes` repos are.
> See §5.3 for how bridge repos differ from every other tenant-scoped repo
> in the codebase.

### 4.3 `SendNodeCommandCommand` + Handler

**Inputs:** `{ nodeId: string; commandType: string; payload: unknown;
spaceId: string }` (`spaceId` from `SpaceContext`).

1. `node = await assertNodeExistsService.execute(nodeId)` — tenant-scoped
   (the node's write repo IS wrapped in `createTenantRepository`, so a node
   in another space throws `NodeNotFoundException`, never leaks existence).
2. `commandId = UuidValueObject.generate().value`.
3. `await nodesKafkaCommandProducerAdapter.send({ commandId, nodeId,
   commandType, payload })` → topic `gardenia-bridge.commands`, key =
   `nodeId` (partition-per-node, matching the bridge's existing
   `nodeId`-partitioned topics).
4. Return `commandId` (so `gardenia-web` can, once `gardenia-bridge` ships
   the field, later correlate an ack — see proposal Out of Scope).

No domain event — this command doesn't mutate `NodeAggregate` state; it's
side-effecting I/O, same class of operation as `EnrichPlantWithQrService`
calling out to QR generation.

### 4.4 Internal commands — `RecordTelemetryReading` / `RecordNodeHeartbeat` / `RecordNodeCommandAck`

These are dispatched by `NodesKafkaConsumerBootstrapService`
(`CommandBus.execute(...)`), never by transport. Inputs are already-parsed,
already-validated (Zod, at the parser in `infrastructure/messaging/parsers/`)
plain objects — the command constructors do NOT re-validate Kafka wire
format, only wrap primitives into VOs/records.

- **`RecordTelemetryReadingCommand`** `{ nodeId, bridgeId, sensorType,
  value, unit, recordedAt }`:
  1. `node = await findOrCreateNodeService.execute({ nodeId, bridgeId })`
     (§4.6 — resolves `spaceId` from the bridge, creates the node if
     first-seen).
  2. `await nodeTelemetryReadingWriteRepository.insert(NodeTelemetryReading.create({ spaceId: node.spaceId, nodeId, sensorType, value, unit, recordedAt }))`.
  3. No event publish (insert-only record, no subscribers expected yet).
- **`RecordNodeHeartbeatCommand`** `{ nodeId, bridgeId, seenAt }`:
  1. `node = await findOrCreateNodeService.execute({ nodeId, bridgeId })`.
  2. `node.markOnline()`; `node.touchLastSeen(seenAt)`.
  3. `await nodeWriteRepository.save(node)`; `await publishEvents(node)`.
- **`RecordNodeCommandAckCommand`** `{ commandId, nodeId, spaceId, result,
  receivedAt }` — `spaceId` resolved the same way as telemetry (via the
  node's bridge, looked up by `nodeId`; if the node is unknown the ack is
  logged and dropped — a command-ack for a node `gardenia-api` never sent a
  command to shouldn't fabricate a node record). Straight
  `nodeCommandAckWriteRepository.insert(...)`.

### 4.5 Queries

`NodeFindById`/`NodeFindByCriteria`/`BridgeFindById`/`BridgeFindByCriteria`/
`NodeTelemetryReadingFindByCriteria` — all exact copies of the
`PlantFindById`/`PlantFindByCriteria` shape (§4.4/4.5 of plant-context
design), backed by `AssertNodeViewModelExistsService` /
`AssertBridgeViewModelExistsService`. `BridgeFindByCriteria`/`FindById` are
tenant-scoped normally (a claimed bridge belongs to a space); an
`unclaimed` bridge has `spaceId = null` and is therefore invisible to every
tenant-scoped query — by construction, not a special case (`createTenantRepository`
filters `WHERE space_id = :activeSpaceId`, and `NULL` never matches).

### 4.6 `FindOrCreateNodeService` (write side)

`execute({ nodeId, bridgeId }): Promise<NodeAggregate>`:
1. `existing = await nodeWriteRepository.findById(nodeId)` (tenant-scoped —
   but at this point in the flow there is no active `SpaceContext` ALS
   frame, since this runs from a Kafka consumer, not an HTTP request! See
   §5.4 — the node write repository used HERE must be the **unscoped**
   variant, resolving `spaceId` explicitly from the bridge rather than from
   ALS).
2. If found, return it (with `lastSeenAt`/`spaceId` already consistent).
3. If absent: `bridge = await bridgeReadRepository.findById(bridgeId)` (also
   unscoped) → throws (logs + drops the message) if the bridge itself is
   unknown or still `unclaimed` (a node cannot exist in a space its bridge
   hasn't joined yet). Build a new `NodeAggregate` with `spaceId =
   bridge.spaceId`, `bridgeId`, call `.create()`, save.

---

## 5. Infrastructure Layer Design

### 5.1 TypeORM Entities

`BridgeTypeOrmEntity` (`@Entity('bridges')`): `id` (uuid PK, **NOT**
`@PrimaryGeneratedColumn` — bridge supplies its own id, so plain
`@PrimaryColumn('uuid')`), `space_id` (uuid, nullable), `name` (varchar 100,
nullable), `status` (varchar/enum, not null, default `'UNCLAIMED'`),
`pairing_code` (varchar 16, nullable), `last_seen_at` (timestamp, nullable),
`created_at`/`updated_at`.

`NodeTypeOrmEntity` (`@Entity('nodes')`): same `@PrimaryColumn('uuid')`
pattern for `id` (node-supplied), `space_id` (uuid NOT NULL), `bridge_id`
(uuid NOT NULL), `name` (nullable), `status` (not null, default `'OFFLINE'`),
`last_seen_at` (nullable), timestamps.

`NodeTelemetryReadingTypeOrmEntity` (`@Entity('node_telemetry_readings')`):
`id` (uuid PK, generated — this row IS `gardenia-api`-generated, unlike
bridge/node ids), `space_id`, `node_id`, `sensor_type` (varchar), `value`
(numeric), `unit` (varchar, nullable), `recorded_at` (timestamp NOT NULL).
Composite index `IDX_telemetry_space_node_recorded ON (space_id, node_id,
recorded_at)` — added via `queryRunner.query('CREATE INDEX ...')` in the
migration's `up()`.

`NodeCommandAckTypeOrmEntity` (`@Entity('node_command_acks')`): `id` (uuid
PK, generated), `command_id` (varchar, **nullable**), `node_id`, `space_id`,
`result` (varchar), `received_at`.

### 5.2 Mappers

Standard `toAggregate`/`toEntity`/`toViewModel` trio for Bridge/Node (copy
`PlantTypeOrmMapper` shape). `NodeTelemetryReadingTypeOrmMapper` has only
`toEntity(record: NodeTelemetryReading)` and `toViewModel(entity)` — no
`toAggregate` (there is no aggregate). `NodeCommandAck` needs only
`toEntity` (write-only, no view model in this change).

### 5.3 Repositories — Bridge is NOT tenant-scoped the same way

**`NodeTypeOrmReadRepository`/`WriteRepository`** wrap
`createTenantRepository(rawRepo, spaceContext)` exactly like `plants` — a
node ALWAYS belongs to a space once it exists.

**`BridgeTypeOrmReadRepository`/`WriteRepository`** do **NOT** wrap
`createTenantRepository`. A bridge's `spaceId` is nullable and its identity
must be resolvable BEFORE a space context exists (bootstrap has none;
claim's `AssertBridgeExistsService` call happens before the aggregate's
`spaceId` is set). Instead:
- `findById(bridgeId)` — plain `repo.findOne({ where: { id } })`, no
  space filter.
- `BridgeFindByCriteriaQueryHandler` (the ONLY tenant-facing bridge query)
  manually adds `.andWhere('space_id = :spaceId', { spaceId:
  this.spaceContext.require() })` in its own `QueryBuilder` call — i.e. the
  tenant filter moves from the repository layer (where it lives for every
  other context) to the query handler for bridges specifically. This is a
  deliberate, documented exception — call it out in code review.

**`NodeTelemetryReadingTypeOrmReadRepository`** wraps
`createTenantRepository` (readings are always space-scoped once the owning
node exists).

**Write repositories used by the Kafka consumer path** (`NodeTypeOrmWriteRepository`
inside `FindOrCreateNodeService`, `BridgeTypeOrmReadRepository` inside the
same service) do NOT go through `createTenantRepository` for the reason in
§5.4 below — but `NodeTypeOrmWriteRepository` is the SAME repository class
used by the tenant-scoped HTTP-facing `SendNodeCommand` path. See §5.4 for
how one repository class serves both.

### 5.4 The Kafka-consumer-has-no-`SpaceContext`-ALS-frame problem

`SpaceContext.require()` throws `SpaceContextMissingException` outside an
HTTP request processed by `SpaceInterceptor` (ALS is request-scoped). The
Kafka consumer path (`FindOrCreateNodeService`, heartbeat/telemetry/ack
handlers) runs with NO such frame. `createTenantRepository`'s proxy calls
`spaceContext.require()` on every `find`/`save` — so the SAME
`NodeTypeOrmWriteRepository` instance, injected via `NODE_WRITE_REPOSITORY`,
would throw if used naively from a Kafka-dispatched command handler.

**Resolution:** `createTenantRepository` (from the kit) already supports an
explicit `spaceId` override — no kit change needed for this, it accepts
either an ALS-backed `SpaceContext` OR any object exposing `.require():
string`/`.get(): string | null`. Internal command handlers construct a
throwaway context via a tiny adapter: `{ require: () => resolvedSpaceId }`
is **not** how the DI-bound repository works, though (`NODE_WRITE_REPOSITORY`
is bound once, with the real `SpaceContext` singleton, at module-load time).

Concretely: `FindOrCreateNodeService` and the three internal command
handlers do **not** inject `NODE_WRITE_REPOSITORY`/`NODE_READ_REPOSITORY`
(the tenant-wrapped ones). They inject a second pair of tokens —
`NODE_UNSCOPED_WRITE_REPOSITORY` / `NODE_UNSCOPED_READ_REPOSITORY` — bound
to the **same** `NodeTypeOrmReadRepository`/`WriteRepository` classes but
constructed with `rawRepo` directly (no `createTenantRepository` wrap), and
every method call in the Kafka-consumer path passes `spaceId` explicitly in
the `where` clause instead of relying on ALS. This means
`NodeTypeOrmReadRepository`/`WriteRepository` take an OPTIONAL
`spaceContext: SpaceContext | null` constructor param: when present, wrap
with `createTenantRepository`; when `null`, the caller is responsible for
scoping (`findById` still filters by `id` alone — a node id is globally
unique across the whole system by construction, since it's the physical
device's own UUID — so unscoped `findById` is safe; it's just `findByCriteria`
that would be unsafe unscoped, and the Kafka path never calls that).
`NodesModule` registers two provider entries for the same class with
different tokens/constructor args.

> This is the single most novel piece of plumbing in this change — flag it
> for extra scrutiny in review. The alternative (spinning up a synthetic ALS
> frame per Kafka message via `spaceContext.run(spaceId, () => ...)` if the
> kit's `SpaceContext` exposes a `.run()`/`.enterWith()` escape hatch) may be
> cleaner if `SpaceContext`'s actual implementation supports it — **verify
> `SpaceContext`'s public API during Phase 1 of tasks.md before committing to
> the dual-token approach**; if `.run(spaceId, fn)` exists, prefer it (it
> reuses `NODE_WRITE_REPOSITORY` unmodified, no second token, no optional
> constructor param — strictly simpler).

### 5.5 `NodesKafkaConsumerBootstrapService`

```ts
@Injectable()
export class NodesKafkaConsumerBootstrapService implements OnModuleInit {
  constructor(
    @Inject(EVENT_CONSUMER) private readonly consumer: IEventConsumer,
    private readonly configService: ConfigService,
    private readonly commandBus: CommandBus,
  ) {}

  async onModuleInit(): Promise<void> {
    const clientId = this.configService.getOrThrow<IKafkaConfig>('kafka').clientId;
    await this.consumer.run(`${clientId}-nodes-telemetry`, [NODES_KAFKA_TOPICS.TELEMETRY], (msg) => this.handleTelemetry(msg));
    await this.consumer.run(`${clientId}-nodes-heartbeat`, [NODES_KAFKA_TOPICS.HEARTBEAT], (msg) => this.handleHeartbeat(msg));
    await this.consumer.run(`${clientId}-nodes-command-acks`, [NODES_KAFKA_TOPICS.COMMAND_ACKS], (msg) => this.handleCommandAck(msg));
  }
  // handleTelemetry/handleHeartbeat/handleCommandAck: parse via the Zod
  // parser, map to the internal command, commandBus.execute(...). A parse
  // failure throws — caught and logged by the adapter's best-effort
  // wrapper (see nestjs-kit §run() contract), never crashes the consumer.
}
```

`run()` is a no-op when `KAFKA_ENABLED=false` (adapter-level), so this
service is safe to register unconditionally.

### 5.6 `NodesKafkaCommandProducerAdapter`

Narrow, gardenia-api-local (see §1). `OnModuleInit`/`OnModuleDestroy`
lifecycle identical to `KafkajsEventPublisherAdapter` (connect best-effort,
disconnect on shutdown), reading the same `'kafka'` config namespace.
`send({ commandId, nodeId, commandType, payload })` → `producer.send({
topic: NODES_KAFKA_TOPICS.COMMANDS, messages: [{ key: nodeId, value:
JSON.stringify({ commandId, nodeId, commandType, payload, timestamp: new
Date().toISOString() }) }] })`. No-op when `KAFKA_ENABLED=false` (mirrors
the publisher adapter exactly).

---

## 6. Transport Layer Design

### 6.1 REST — `POST /nodes/bridges/bootstrap`

`BridgesController` (`@Controller('nodes/bridges')`), single endpoint:

```ts
@Post('bootstrap')
@SkipSpace()
@HttpCode(HttpStatus.OK)
async bootstrap(@Body() dto: BootstrapBridgeDto): Promise<BridgeRestResponseDto> {
  this.logger.log(`Bootstrap request from bridge ${dto.bridgeId}`);
  const result = await this.commandBus.execute(new BootstrapBridgeCommand({ bridgeId: dto.bridgeId }));
  return this.mapper.toResponse(result); // { bridgeId, pairingCode: string | null }
}
```

`BootstrapBridgeDto`: `bridgeId` (`@IsUUID @IsNotEmpty`). No `@ApiBearerAuth`
(public). `@SkipSpace()` bypasses BOTH `OptionalJwtAuthGuard` and
`SpaceGuard` (confirmed behavior — see `optional-jwt-auth.guard.ts` comment).

### 6.2 GraphQL

- **`BridgeQueriesResolver`**: `bridgeFindById`, `bridgesFindByCriteria`
  (standard `JwtAuthGuard`+`SpaceGuard`).
- **`BridgeMutationsResolver`**: `bridgeClaim(input: { bridgeId, pairingCode
  })` → dispatches `ClaimBridgeCommand` with `spaceId` from
  `SpaceContext.require()` (handler-injected, same as `CreatePlant`) →
  `MutationResponseDto`.
- **`NodeQueriesResolver`**: `nodeFindById`, `nodesFindByCriteria`,
  `nodeTelemetryReadingsFindByCriteria`.
- **`NodeMutationsResolver`**: `nodeSendCommand(input: { nodeId,
  commandType, payload })` → `MutationResponseDto` carrying the generated
  `commandId` in its `message`/a dedicated field (extend
  `MutationResponseDto` usage the same way other mutations return an id).

All four `*QueryableField` enums (`Node`, `Bridge`, `NodeTelemetryReading`)
+ filterable-fields registries follow the mandatory Criteria pattern
verbatim (see architecture skill §Find-By-Criteria Filters). `SensorType`
is registered via `registerEnumType` in
`nodes-registered-enums.graphql.ts` alongside `BridgeStatus`/`NodeStatus`.

### 6.3 MCP Tools

Seven tools under `transport/mcp/tools/`, each `@McpTool() @Injectable()`
implementing `IMcpTool<IMcpToolContext>`, Zod schema in a sibling
`schemas/{name}.schema.ts` file, dispatch via `CommandBus`/`QueryBus` only,
reading `context.spaceId` (never trusting a `spaceId` in tool args) — exact
copy of the `qr_create` pattern (§ referenced in architecture skill). Wire
names: `bridge_claim`, `bridge_find_by_id`, `bridge_find_by_criteria`,
`node_find_by_id`, `node_find_by_criteria`, `node_send_command`,
`node_telemetry_reading_find_by_criteria`. `bridge_bootstrap` is
**excluded** — no `IMcpToolContext` (no authenticated session) exists at
bootstrap time; exposing it as an MCP tool would need a context shape this
change doesn't define, and doing so is explicitly out of scope (config.yaml:
"Do NOT expose credential/session or PII-sensitive contexts... without an
explicit decision" — bootstrap is the nodes-context analogue of that
exemption).

---

## 7. Module Registration — `NodesModule`

```ts
@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature(INFRASTRUCTURE_ENTITIES)],
  controllers: [BridgesController],
  providers: [
    ...COMMAND_HANDLERS,       // 6 commands
    ...QUERY_HANDLERS,         // 5 queries
    ...APPLICATION_SERVICES,   // 4 assert services + FindOrCreateNodeService
    ...DOMAIN_BUILDERS,        // BridgeBuilder, NodeBuilder
    ...INFRASTRUCTURE_MAPPERS,
    ...INFRASTRUCTURE_REPOSITORIES,  // incl. the dual node-repo tokens, §5.4
    ...MESSAGING_PROVIDERS,    // NodesKafkaConsumerBootstrapService, NodesKafkaCommandProducerAdapter
    ...REST_PROVIDERS,
    ...GRAPHQL_PROVIDERS,
    ...MCP_TOOLS,
  ],
  exports: [],
})
export class NodesModule {}
```

`SpaceContext` not re-declared (global). `AppModule` adds `NodesModule` to
`imports[]`. `nodes-registered-enums.graphql.ts` side-effect import.

---

## 8. Migrations

Four hand-written migrations, next available timestamps after the current
highest in `src/database/migrations/` (confirm exact next value during
apply — do not hardcode a number that may have shifted):

1. `CreateBridges` — `bridges` table per §5.1. No FK constraints (codebase
   convention). `id` has NO default (application-supplied).
2. `CreateNodes` — `nodes` table. `id` has NO default. Consider a plain
   (non-unique-constrained-beyond-PK) index on `bridge_id` for the
   first-seen lookup path (`FindOrCreateNodeService` queries by `bridgeId`
   only when creating — actually it queries by `nodeId` for existence and
   `bridgeId` only to resolve the owning bridge's `spaceId`, so a
   `bridge_id` index is a nice-to-have, not load-bearing; add it, it's
   cheap).
3. `CreateNodeTelemetryReadings` — `node_telemetry_readings` table +
   composite index `(space_id, node_id, recorded_at)` per §5.1.
4. `CreateNodeCommandAcks` — `node_command_acks` table. `command_id`
   nullable + a plain (non-unique) index on it for future correlation
   lookups once `gardenia-bridge` ships the field.

---

## 9. Dependency Injection Map

| Symbol token | Bound class | Notes |
|---|---|---|
| `BRIDGE_READ_REPOSITORY` / `BRIDGE_WRITE_REPOSITORY` | `BridgeTypeOrmRead/WriteRepository` | NOT tenant-wrapped (§5.3) |
| `NODE_READ_REPOSITORY` / `NODE_WRITE_REPOSITORY` | `NodeTypeOrmRead/WriteRepository` (tenant-wrapped instance) | used by HTTP/GraphQL-facing handlers |
| `NODE_UNSCOPED_READ_REPOSITORY` / `NODE_UNSCOPED_WRITE_REPOSITORY` | same classes, unscoped instance (§5.4) | used ONLY by the Kafka-consumer path — **pending validation, may collapse to the single tenant-wrapped token if `SpaceContext.run()` exists (§5.4)** |
| `NODE_TELEMETRY_READING_READ_REPOSITORY` | tenant-wrapped | |
| `NODE_TELEMETRY_READING_WRITE_REPOSITORY` | insert-only (§3.4) | |
| `NODE_COMMAND_ACK_WRITE_REPOSITORY` | insert-only, unscoped (spaceId resolved manually, no ALS available) | |
| `EVENT_CONSUMER` (from `@sisques-labs/nestjs-kit`) | `KafkajsEventConsumerAdapter` | already bound by `MessagingModule.forRoot()` in `CoreModule` — `nodes` only injects it |

---

## 10. Architecture Risks & Assumptions Requiring Validation

1. **§5.4 dual-repository-token plumbing (HIGH — resolve first).** Confirm
   whether `SpaceContext` exposes a `.run(spaceId, fn)` / `enterWith`-style
   API before writing `FindOrCreateNodeService`. If yes, this entire section
   collapses to "call `spaceContext.run(bridge.spaceId, () =>
   nodeWriteRepository.findById(nodeId))`" and the unscoped tokens are
   unnecessary. This is a tasks.md Phase 1 spike, not an implementation
   detail to discover mid-handler-writing.
2. **`BridgeAlreadyClaimedException` → 409 CONFLICT (MED).** First new HTTP
   status code in `resolveStatus()`. Verify `GqlExceptionFilter` also maps
   409 sensibly for GraphQL (the existing filter implements both — confirm
   the GraphQL error `extensions.code` this produces is something
   `gardenia-web` can branch on).
3. **Bootstrap endpoint has no rate limiting (MED, accepted per proposal
   Risks).** Not blocking this change; flag as a fast-follow if abuse is
   observed.
4. **`NodeTelemetryReadingWriteRepository`/`NodeCommandAckWriteRepository`
   breaking `IBaseWriteRepository<Aggregate>` convention (LOW but WILL draw
   review scrutiny).** Documented in §3.4 — do not "fix" this by forcing a
   fake aggregate onto these records; that would reintroduce the ceremony
   the proposal explicitly rejected.
5. **Command producer topic/key format assumptions (MED).** `key: nodeId`
   and the exact JSON shape sent to `gardenia-bridge.commands` are this
   proposal's best guess at what `gardenia-bridge`'s (not-yet-built)
   consumer side will expect — `gardenia-bridge` currently only produces
   to that topic conceptually in the architecture doc, no consumer exists
   there yet either. Treat the wire format as provisional; a follow-up in
   `gardenia-bridge` may require adjusting it.
6. **First-seen node creation race (LOW, mitigated).** Two near-simultaneous
   messages for a brand-new `nodeId` (e.g. telemetry + heartbeat arriving
   together) could both miss the `findById` check and attempt
   `INSERT`. Since `id` is the primary key and application-supplied
   (node's own UUID), the second insert fails on PK conflict — catch that
   specific DB error in `FindOrCreateNodeService` and re-fetch instead of
   propagating, matching the risk mitigation already stated in the
   proposal.
