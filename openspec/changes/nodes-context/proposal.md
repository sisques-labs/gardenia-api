# Proposal: Nodes Bounded Context (IoT integration)

## Intent

Gardenia is expanding beyond manual data entry into IoT: physical sensors and
(later) actuators report telemetry through a per-site edge gateway
(`gardenia-bridge`, already built, PR #16) that relays MQTT↔Kafka. Today
`gardenia-api` only ever *produces* to Kafka (domain-event forwarding via
`@sisques-labs/nestjs-kit`'s `MessagingModule`) — it has never consumed a
message. This change introduces `nodes` as a new bounded context that:
(1) lets a bridge self-register and be claimed into a `Space` without manual
ID configuration, (2) consumes telemetry/heartbeat/command-ack messages from
Kafka and persists them tenant-scoped, and (3) lets a user send a command to
a node from `gardenia-web`.

Why now: `gardenia-bridge` is built and the topology/claim/routing design has
been discussed and resolved (see the architecture vision doc this proposal is
derived from). The Kafka **consumer** capability this context depends on
(`IEventConsumer`/`KafkajsEventConsumerAdapter`) was just added to
`@sisques-labs/nestjs-kit` and published as `v1.3.0` — the blocking
dependency is now unblocked.

Success looks like: a freshly-flashed `gardenia-bridge` can announce itself,
get claimed from `gardenia-web` into a Space with a short pairing code, and
from that point on every telemetry/heartbeat message it relays is persisted
under the right Space with zero further manual node registration. A user can
send a command to a node and, once `gardenia-bridge` supports it, see the ack
persisted.

## Scope

### In Scope

- New `nodes` bounded context under `src/contexts/nodes/` (domain →
  application → infrastructure → transport), DDD + CQRS + Hexagonal.
- `BridgeAggregate` — gateway identity + claim state machine
  (`unclaimed` → `active`). No rich business behavior beyond claim/rename.
- `NodeAggregate` — sensor/actuator identity with real behavior:
  `create()`, `markOnline()`/`markOffline()` emitting `NodeWentOnline`/
  `NodeWentOffline`.
- `NodeTelemetryReading` — insert-only historical record (no aggregate
  ceremony, same treatment as an audit log). One row per sensor reading.
- `NodeCommandAck` — insert-only record of a command acknowledgement (same
  treatment as telemetry).
- `SensorTypeEnum` — closed domain enum: `SOIL_MOISTURE`,
  `SOIL_TEMPERATURE`, `AMBIENT_TEMPERATURE`, `AMBIENT_HUMIDITY`,
  `LIGHT_LEVEL`, `RAIN`, `WATER_LEVEL`.
- `SendNodeCommand` — plain CQRS command, no persisted pending/acked/failed
  lifecycle. Validates the node belongs to the active Space, produces to
  `gardenia-bridge.commands` with a generated `commandId`.
- Two new REST endpoints:
  - `POST /nodes/bridges/bootstrap` — **unauthenticated**, called by a bridge
    on first boot with its self-generated `bridgeId`. Creates a
    `BridgeAggregate` in `unclaimed` status and returns/logs a pairing code.
  - Bridge claim — **authenticated, space-scoped** — links `bridgeId` to the
    active `SpaceContext` Space and flips the bridge to `active`. Exposed as
    both REST and a GraphQL mutation (`gardenia-web` will use GraphQL per its
    own conventions; REST bootstrap must stay REST since the bridge has no
    GraphQL client).
- A first-ever Kafka **consumer** wired into `gardenia-api`: bump
  `@sisques-labs/nestjs-kit` to `^1.3.0`, inject the new `EVENT_CONSUMER`
  port, and run three consumer groups against `gardenia-bridge.telemetry`,
  `gardenia-bridge.heartbeat`, and `gardenia-bridge.command-acks` (NOT
  `.commands` — that topic is outbound-only, bridge-consumed).
- Queries: `NodeFindById`, `NodeFindByCriteria`, `BridgeFindById`,
  `BridgeFindByCriteria`, `NodeTelemetryReadingFindByCriteria` (tenant-scoped
  history for a node/space).
- MCP tools for every public command/query per `openspec/config.yaml`,
  except the unauthenticated bootstrap endpoint (excluded — no session/space
  context to bind an MCP tool to, same rationale as the `auth` exemption).
- Register `NodesModule` in `AppModule`.

### Out of Scope (explicit)

- **`gardenia-bridge` changes** — adding `bridgeId` and `commandId` to the
  Kafka message envelopes is a separate, not-yet-started change in that
  repo, owned by the user later. This proposal's consumer/`NodeCommandAck`
  design assumes those fields will exist but is not blocked on them (see
  Risks — `commandId` correlation is a known gap until the bridge ships it).
- **`gardenia-web` UI** — the claim/pairing screen, node dashboard, and
  telemetry charts are a separate, later OpenSpec proposal in that repo.
  This proposal only ships the API surface `gardenia-web` will call.
- **Pairing code display beyond logging** — no local web page served by the
  bridge, no push-to-web-UI mechanism. Confirmed decision: log/console only.
- **`command-ack` correlation enforcement** — until `gardenia-bridge` emits
  `commandId`, the consumer persists whatever it receives; a `NodeCommandAck`
  row may carry a `null`/empty `commandId` in the interim. No validation
  failure, no dead-letter handling for this gap.
- **Node/bridge `offline` health-check sweep** — `markOffline()` exists on
  `NodeAggregate` as a domain operation, but nothing in this change schedules
  a cron/sweep that calls it after a `lastSeenAt` timeout. Tracked as a
  follow-up (see Pending Features).
- **Actuator command catalog / validation** — `SendNodeCommand` accepts an
  opaque `commandType` + payload; this change does not define a closed
  catalog of valid commands (only sensors have a closed catalog).
- **Battery level as telemetry** — confirmed NOT a `SensorType`; battery
  belongs on the node's health/heartbeat handling, out of scope for
  `NodeTelemetryReading` itself (heartbeat handling only updates
  `lastSeenAt`/`status` in this change — persisting a battery percentage is
  deferred until a concrete UI need exists).

## Domain Model

### `BridgeAggregate` (extends `BaseAggregate`)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` (`bridgeId`) | `BridgeId` (UUID VO) | yes | supplied by the bridge itself at bootstrap, not generated by `gardenia-api` |
| `spaceId` | `string \| null` | no | `null` until claimed |
| `name` | `BridgeName` (String VO) | no | user-assigned label; nullable until renamed |
| `status` | `BridgeStatusValueObject` (Enum VO) | yes | `unclaimed` / `active` / `offline` |
| `pairingCode` | `PairingCode` (String VO) | no | set at bootstrap, cleared on claim |
| `lastSeenAt` | `Date \| null` | no | optional health tracking |

Behavior: `bootstrap()` (sets `unclaimed` + generates `pairingCode`, emits
`BridgeBootstrapped`), `claim(spaceId)` (sets `spaceId`, `active`, clears
`pairingCode`, emits `BridgeClaimed` — throws if already claimed or code
mismatch), `rename()`.

### `NodeAggregate` (extends `BaseAggregate`)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` (`nodeId`) | `NodeId` (UUID VO) | yes | same id the physical node uses on MQTT topics |
| `spaceId` | `string` | yes | inherited from the serving bridge at first-seen time |
| `bridgeId` | `string` | yes | which bridge is relaying this node |
| `name` | `NodeName` (String VO) | no | user-assigned label |
| `status` | `NodeStatusValueObject` (Enum VO) | yes | `online` / `offline` |
| `lastSeenAt` | `Date \| null` | no | updated by every heartbeat |

Behavior: `create()` (first-seen, from telemetry/heartbeat when no existing
node row matches `nodeId`+`spaceId`), `markOnline()` / `markOffline()` —
real state transitions emitting `NodeWentOnline` / `NodeWentOffline` only
when the status actually flips (no-op, no event, if already in that state).

### `NodeTelemetryReading` (insert-only, no aggregate)

| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid | |
| `spaceId` | uuid | |
| `nodeId` | uuid | |
| `sensorType` | `SensorTypeEnum` | |
| `value` | numeric | |
| `unit` | string, nullable | |
| `recordedAt` | timestamp | from the message, not insertion time |

Index: `(space_id, node_id, recorded_at)`.

### `NodeCommandAck` (insert-only, no aggregate)

| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid | |
| `commandId` | string, nullable | correlates to `SendNodeCommand` — nullable until bridge ships the field (see Out of Scope) |
| `nodeId` | uuid | |
| `spaceId` | uuid | |
| `result` | string (`success`/`error` or free text from the node) | |
| `receivedAt` | timestamp | |

### `SensorTypeEnum`

`SOIL_MOISTURE`, `SOIL_TEMPERATURE`, `AMBIENT_TEMPERATURE`,
`AMBIENT_HUMIDITY`, `LIGHT_LEVEL`, `RAIN`, `WATER_LEVEL`. Closed catalog —
no extensibility mechanism in this change.

## Commands

| Command | Inputs | Auth | Behavior |
|---------|--------|------|----------|
| `BootstrapBridge` | `bridgeId` | **none** (bridge has no account) | Creates or re-fetches a `BridgeAggregate`, sets `unclaimed` + fresh `pairingCode` if not already claimed; idempotent re-bootstrap of an already-`active` bridge is a no-op returning its current state. |
| `ClaimBridge` | `bridgeId`, `pairingCode`, `spaceId` (from `SpaceContext`) | authenticated, space member | Loads bridge by id, validates `pairingCode` matches and status is `unclaimed`, calls `claim(spaceId)`, persists, emits `BridgeClaimed`. Wrong code / already-claimed → domain exception. |
| `SendNodeCommand` | `nodeId`, `commandType`, `payload`, `spaceId` (from `SpaceContext`) | authenticated, space member | Asserts the node belongs to the active Space; generates `commandId`; produces to `gardenia-bridge.commands` via `IEventPublisher`-style adapter (see Design §Kafka producer for commands). No persisted lifecycle. |
| `RecordTelemetryReading` | parsed telemetry message | **internal** — dispatched by the Kafka consumer, not transport-facing | Resolves `spaceId` via the node's bridge; upserts the `NodeAggregate` if first-seen (`create()`); persists a `NodeTelemetryReading` row. |
| `RecordNodeHeartbeat` | parsed heartbeat message | **internal** | Resolves node + space; `markOnline()` if currently `offline`; updates `lastSeenAt`. |
| `RecordNodeCommandAck` | parsed command-ack message | **internal** | Persists a `NodeCommandAck` row (`commandId` possibly `null` — see Out of Scope). |

## Queries

| Query | Inputs | Scope | Returns |
|-------|--------|-------|---------|
| `NodeFindById` | `nodeId` | tenant | `NodeViewModel` |
| `NodeFindByCriteria` | `Criteria` | tenant | `PaginatedResult<NodeViewModel>` |
| `BridgeFindById` | `bridgeId` | tenant (bridges visible only once claimed into the caller's space) | `BridgeViewModel` |
| `BridgeFindByCriteria` | `Criteria` | tenant | `PaginatedResult<BridgeViewModel>` |
| `NodeTelemetryReadingFindByCriteria` | `Criteria` (typically filtered by `nodeId`) | tenant | `PaginatedResult<NodeTelemetryReadingViewModel>` |

## Transport

- **REST**: `POST /nodes/bridges/bootstrap` (no guards — public bootstrap,
  see Design for how it is exempted from the global `SpaceGuard`).
- **GraphQL**: `bridgeClaim` mutation, `node`/`nodes`/`bridge`/`bridges`/
  `nodeTelemetryReadings` queries, `nodeSendCommand` mutation — all under the
  standard `JwtAuthGuard` + `SpaceGuard` stack (`gardenia-web` is
  GraphQL-first per its own `AGENTS.md`).
- **Kafka consumer** (new): three `EVENT_CONSUMER.run()` calls in a
  `NodesKafkaConsumerBootstrapService`, one per inbound topic, each
  dispatching to the matching internal command above via `CommandBus`.
- **MCP tools**: `node_find_by_id`, `node_find_by_criteria`,
  `bridge_find_by_id`, `bridge_find_by_criteria`,
  `node_telemetry_reading_find_by_criteria`, `bridge_claim`,
  `node_send_command`. `bridge_bootstrap` is explicitly NOT exposed as an MCP
  tool (no space/session context — same exemption class as `auth`).

## Kafka Topics (consumed, not produced by this context)

| Topic | Direction | Handler |
|-------|-----------|---------|
| `gardenia-bridge.telemetry` | consume | `RecordTelemetryReadingCommand` |
| `gardenia-bridge.heartbeat` | consume | `RecordNodeHeartbeatCommand` |
| `gardenia-bridge.command-acks` | consume | `RecordNodeCommandAckCommand` |
| `gardenia-bridge.commands` | **produce** | `SendNodeCommandHandler` (existing outbound path, new topic — NOT the domain-event forwarder's topic scheme) |

`gardenia-bridge.commands` is produced outside the `DomainEventForwarderService`
convention (that service only forwards in-process domain events under
`${topicPrefix}.${module}`); `SendNodeCommand` publishes a raw command
envelope directly. See Design §Kafka producer for commands for how this
coexists with the existing `EVENT_PUBLISHER` wiring without conflating the
two message shapes.

## Pending Features (tracked separately, not this change)

- **`gardenia-bridge` envelope change** — add `bridgeId` to every message and
  `commandId` to `command`/`command-ack`. Owned by the user, other repo.
- **`gardenia-web` claim/dashboard UI** — separate OpenSpec proposal in
  `gardenia-web`.
- **Node/bridge offline sweep** — a scheduled job that calls `markOffline()`
  after a `lastSeenAt` timeout. Recommended change id: `nodes-offline-sweep`.
- **Sensor telemetry retention/partitioning** — if `NodeTelemetryReading`
  volume grows beyond what a single Postgres table + composite index
  handles, revisit (partitioning or a different store). Explicitly deferred
  per the architecture vision doc.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Unauthenticated bootstrap endpoint is a public write surface | Med | Med | Rate-limit-worthy but out of scope for this change; input is limited to a self-generated UUID, no PII; a spammed `unclaimed` bridge row is low-impact and claimable/prunable later |
| `commandId` correlation gap until `gardenia-bridge` ships the field | High (known, accepted) | Low | `NodeCommandAck.commandId` nullable; UI (later, gardenia-web) can display "unmatched" acks; not a data-loss risk |
| First-seen `NodeAggregate.create()` racing across concurrent telemetry/heartbeat messages for the same new node | Low | Med | Handler-level find-or-create with a DB unique constraint on `id` as the backstop; a duplicate-key race becomes a benign no-op retry, not a corrupt state |
| Kafka consumer failures silently swallowed (per `IEventConsumer` best-effort contract) could hide a systemic parsing bug | Med | Med | Log every swallowed handler error (kit already does); this change adds a metric/log line per topic so failures are visible in Grafana/logs, not just dropped |
| Bridge claim races (two users claim the same code simultaneously) | Low | Low | `claim()` is a single aggregate-level state transition guarded by `status === unclaimed`; the loser gets a domain exception, no double-claim possible |
| `SpaceGuard` currently assumes every route needs a Space — bootstrap must be explicitly exempted | Med | High (would break bridge onboarding entirely) | Use the existing `@SkipSpace()` decorator (see Design) — same mechanism already used elsewhere for space-less routes |

## Rollback Plan

The context is net-new and additive (no existing files modified except
`AppModule` import, `nestjs-kit` version bump, and metrics-exempt-route list
if bootstrap needs `@SkipSpace()` registration there too). Rollback = revert
the branch and roll back the three new migrations (`bridges`, `nodes`,
`node_telemetry_readings`, `node_command_acks` tables). No other context
depends on `nodes` yet.

## Success Criteria

- [ ] A bridge can `POST /nodes/bridges/bootstrap` with a self-generated
      `bridgeId` and receive/have logged a pairing code.
- [ ] An authenticated space member can claim that bridge via GraphQL
      mutation using the pairing code; bridge flips to `active`.
- [ ] The Kafka consumer is wired and, when `KAFKA_ENABLED=true`, subscribes
      to all three inbound topics without crashing the app when disabled.
- [ ] A telemetry message for a brand-new `nodeId` creates a `NodeAggregate`
      and a `NodeTelemetryReading` row, both correctly `spaceId`-scoped via
      the owning bridge.
- [ ] A heartbeat message flips a node from `offline`/unseen to `online` and
      updates `lastSeenAt`.
- [ ] A user can dispatch `SendNodeCommand` for a node in their active Space
      and NOT for a node in another Space (403/`NotFoundException`).
- [ ] `NodesModule` registered in `AppModule`; all four migrations apply
      cleanly.
- [ ] Unit + integration + e2e tests green; coverage ≥ 80%.
