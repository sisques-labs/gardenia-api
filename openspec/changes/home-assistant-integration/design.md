# Design: Home Assistant Integration (MQTT bridge + MCP voice)

## Technical Approach

A new shared `core/mqtt` transport owns one managed broker connection. A new
`home-assistant` bounded context (the *bridge*) uses it to (a) publish HA MQTT
**Discovery** config + retained **state** topics so HA auto-creates entities,
and (b) subscribe to HA **command** topics and dispatch `CommandBus` commands.
The bridge is pure translation: it reads/writes other contexts **only** through
`application/ports` implemented by `infrastructure/adapters` that go through the
Query/Command bus — identical to the existing `weather`/`plants` adapter pattern,
so the `boundaries/element-types` ESLint rule stays green. A new
`sensor-readings` context persists physical telemetry ingested from HA. The
`auth` context gains long-lived, space-scoped API tokens so HA's MCP client
authenticates for the voice plane without JWT refresh. Everything is behind
`MQTT_ENABLED` (default off) so the app is unchanged when disabled.

## Architecture Decisions

### Decision: MQTT Discovery over a custom HA component
**Choice**: publish `homeassistant/<component>/<node>/<object>/config` discovery
payloads + retained state, all from `gardenia-api`.
**Alternatives**: RESTful sensors (HA polls); a Python HACS custom integration.
**Rationale**: Discovery yields native entities with zero HA-side YAML, supports
push + commands + availability, and keeps all code in the one repo in scope.
RESTful is read-only and poll-based; a custom component is a second project and
was explicitly excluded.

### Decision: A single `home-assistant` bridge context, boundary-safe
**Choice**: one bounded context that talks to all others via ports/adapters
(QueryBus/CommandBus), never importing their domain/application.
**Alternatives**: per-context MQTT tools (like `transport/mcp`); a `core` module.
**Rationale**: HA mapping is a cohesive concern (topic layout, discovery schema,
entity lifecycle) that does not belong to any single domain context, and putting
it in `core` would let infrastructure depend on many domains. A dedicated context
with adapters honors the boundary rule and keeps the mapping in one place. The
MCP precedent (per-context tools) does not fit because discovery/state is a
cross-entity, stateful publishing concern, not a per-command tool.

### Decision: State-out via reconciliation snapshot first, events later
**Choice**: Phase 2 publishes discovery + retained state on bootstrap and on a
configurable interval (reconciliation), reading view models through adapters.
**Alternatives**: subscribe to domain events (`@EventsHandler`) for instant push.
**Rationale**: There are **no event consumers today**, and domain-event classes
live inside other contexts' `domain/` (boundary-protected). A snapshot keeps
Phase 2 simple, idempotent and boundary-clean. Retained topics mean HA always has
last-known state even across restarts. Event-driven incremental republish is a
deliberate later enhancement; when added, the event subscription is placed in the
bridge's `infrastructure/adapters/` (the only layer permitted to import another
context's events) and translates them into the bridge's own publish calls.
**Tradeoff**: state lag up to the reconciliation interval — acceptable for
gardening cadence; tunable via `HA_RECONCILE_INTERVAL`.

### Decision: Tenancy by topic prefix `{base}/{spaceId}/...`
**Choice**: every published/subscribed topic is built by a single
`HaTopicValueObject` from `base + spaceId + ...`. Commands dispatched from an
inbound message run inside that space's `SpaceContext` (ALS) frame.
**Alternatives**: one broker connection per space; encode space in payload only.
**Rationale**: One connection scales; the prefix is the isolation unit and is
trivially mappable to broker ACLs. Reusing the space id in the ALS frame means
tenant repositories already scope correctly with no extra wiring (same mechanism
as the MCP transport). Which space(s) a connection bridges is config-driven.

### Decision: Two independent auth planes
**Choice**: MQTT = broker-level service account (env). Voice/MCP = long-lived
space-scoped API token (new `auth` capability), accepted by the existing
`OptionalJwtAuthGuard` chain alongside JWTs.
**Alternatives**: tunnel JWT over MQTT; reuse short-lived JWT for HA.
**Rationale**: MQTT has no per-request user — auth is the broker's job; tenancy is
the topic prefix. The MCP client needs a credential it can paste once and keep;
a refreshing JWT is operationally painful in HA. A hashed, revocable, prefixed
token is the standard answer.

### Decision: `sensor-readings` as its own context
**Choice**: new bounded context with a `SensorReadingAggregate` (plantId, metric,
value, unit, measuredAt, source) and its own table.
**Alternatives**: extend `care-log`; attach readings to `plants`.
**Rationale**: Telemetry is high-volume, append-only, and semantically distinct
from human care actions or plant identity. A separate context keeps `plants`/
`care-log` clean and lets readings evolve (retention, aggregation) independently.

## Data Flow

    ┌──────────────── Phase 2/3: MQTT data plane ────────────────┐
    Bootstrap / interval ─→ HaReconcileService
        ─→ ports → adapters → QueryBus → plants/care-log/harvests/inventory/weather VMs
        ─→ HaDiscoveryPublisher → MqttService.publish(config, retain)
        ─→ HaStatePublisher     → MqttService.publish(state,  retain)
                                                            │
                                                       MQTT broker ←→ Home Assistant
                                                            │
    HA button/number ─→ command_topic ─→ MqttService(sub) ─→ HaCommandRouter
        ─→ run-in-space(spaceId) ─→ ports → adapters → CommandBus
        ─→ CreateCareLogEntry / CreateHarvest / AdjustInventoryQuantity

    ┌──────────────── Phase 4: ingest ───────────────────────────┐
    HA sensor state_topic ─→ MqttService(sub) ─→ HaSensorIngestRouter
        ─→ map topic→plant ─→ CommandBus(RecordSensorReadingCommand)
        ─→ sensor_readings row ; latest surfaces back in Phase 2 discovery

    ┌──────────────── Phase 1: voice plane (reuses MCP) ─────────┐
    HA Assist (MCP client) ─→ POST /api/mcp  Authorization: Bearer <api_token>
        ─→ OptionalJwtAuthGuard (now also resolves API tokens) ─→ SpaceGuard
        ─→ existing MCP tools (CommandBus/QueryBus)

## File Changes (indicative — finalized per-phase in tasks)

| File | Action | Phase | Description |
|------|--------|-------|-------------|
| `src/core/mqtt/mqtt.module.ts` | Create | 1 | Wires the connection + service, imported once |
| `src/core/mqtt/services/mqtt.service.ts` | Create | 1 | `connect/publish/subscribe/onMessage`, reconnect, LWT |
| `src/core/mqtt/config/mqtt.config.ts` | Create | 1 | env schema: url, creds, base topic, discovery prefix, flags |
| `src/core/mqtt/health/mqtt.health-indicator.ts` | Create | 1 | Terminus indicator for `core/health` |
| `src/core/mqtt/README.md` | Create | 1 | Mirrors `core/mcp/README.md` |
| `auth/domain/value-objects/api-token/api-token.vo.ts` | Create | 1 | Token VO (prefix + secret) |
| `auth/domain/aggregates/api-token.aggregate.ts` | Create | 1 | hashed secret, spaceId, label, lastUsedAt, revokedAt |
| `auth/application/commands/issue-api-token/*` | Create | 1 | issue (returns plaintext once) |
| `auth/application/commands/revoke-api-token/*` | Create | 1 | revoke |
| `auth/application/queries/find-api-token-by-secret/*` | Create | 1 | hash-lookup for auth |
| `auth/infrastructure/strategies/jwt.strategy.ts` | Modify | 1 | also accept `Bearer ght_...` API tokens |
| `auth/infrastructure/persistence/.../api-token.entity.ts` + migration | Create | 1 | `api_tokens` table |
| `contexts/home-assistant/home-assistant.module.ts` | Create | 2 | bridge wiring (PUBLISHERS, ROUTERS, PORTS, ADAPTERS) |
| `.../domain/value-objects/ha-topic/ha-topic.value-object.ts` | Create | 2 | `{base}/{spaceId}/...` builder |
| `.../domain/services/*-entity-mapper.ts` | Create | 2 | VM → HA discovery+state payloads |
| `.../application/ports/*.port.ts` | Create | 2/3 | read/write ports to other contexts |
| `.../infrastructure/adapters/*.adapter.ts` | Create | 2/3 | QueryBus/CommandBus adapters |
| `.../infrastructure/services/ha-reconcile.service.ts` | Create | 2 | bootstrap + interval snapshot |
| `.../transport/mqtt/ha-command.router.ts` | Create | 3 | command_topic → CommandBus |
| `contexts/sensor-readings/**` | Create | 4 | aggregate, repo, persistence, migration, command/query |
| `.../transport/mqtt/ha-sensor-ingest.router.ts` | Create | 4 | sensor state_topic → RecordSensorReading |
| `src/app.module.ts` | Modify | 1–4 | import new modules |

## Interfaces / Contracts

```ts
// core/mqtt — the only transport primitive the bridge depends on
interface IMqttService {
  publish(topic: string, payload: unknown, opts?: { retain?: boolean }): Promise<void>;
  subscribe(topicFilter: string, handler: (topic: string, payload: Buffer) => void): Promise<void>;
  readonly connected: boolean;
}

// home-assistant — topic builder (tenancy isolation lives here)
class HaTopicValueObject {            // base + spaceId + segments
  static discovery(prefix, component, node, object): string; // homeassistant/<c>/<n>/<o>/config
  state(...segments: string[]): string;   // <base>/<spaceId>/<...>/state
  command(...segments: string[]): string; // <base>/<spaceId>/<...>/set
}

// home-assistant — read/write ports (implemented by adapters via the bus)
interface IPlantStatePort   { listPlantStates(spaceId: string): Promise<PlantHaState[]>; }
interface ICareCommandPort  { recordWatering(input: RecordWateringInput): Promise<void>; }
interface IInventoryCommandPort { adjustQuantity(input: AdjustInput): Promise<void>; }

// auth — API token (voice plane)
interface IApiTokenAuth {
  // strategy resolves "ght_<id>_<secret>" → { userId, spaceId } or 401
  resolve(rawToken: string): Promise<{ userId: string; spaceId: string } | null>;
}
```

HA Discovery payload (example — soil moisture sensor for a plant):

```jsonc
// topic: homeassistant/sensor/gardenia_<spaceId>/plant_<plantId>_moisture/config  (retain)
{
  "name": "Moisture",
  "unique_id": "gardenia_<spaceId>_plant_<plantId>_moisture",
  "state_topic": "gardenia/<spaceId>/plant/<plantId>/moisture/state",
  "unit_of_measurement": "%",
  "device_class": "moisture",
  "availability_topic": "gardenia/<spaceId>/bridge/availability",
  "device": { "identifiers": ["gardenia_plant_<plantId>"], "name": "<plant name>",
              "manufacturer": "Gardenia", "via_device": "gardenia_<spaceId>" }
}
```

## Migration / Rollout

- `MQTT_ENABLED=false` by default → no connection, no topics, no behavior change.
- Phase 1 migration: create `api_tokens` (id, user_id, space_id, label,
  token_hash UNIQUE, prefix, last_used_at, revoked_at, created_at). `down` drops it.
- Phase 4 migration: create `sensor_readings` (id, space_id, plant_id, metric,
  value numeric, unit, measured_at, source, created_at; index on
  `(space_id, plant_id, metric, measured_at)`). `down` drops it.
- Entity removal: publishing an **empty retained payload** to a discovery topic
  removes the HA entity. A startup/operator cleanup clears stale topics on disable.

## Boundary & Layering Notes

- The bridge's `domain`/`application`/`transport` depend only on bridge code +
  `core/mqtt`. Any reach into `plants`/`care-log`/`harvests`/`inventory`/`weather`
  is via a port defined in `home-assistant/application/ports` and an adapter in
  `home-assistant/infrastructure/adapters` that dispatches through the bus.
- MQTT routers are **inbound transport adapters** (like resolvers/MCP tools): they
  log at entry, never inject services/repos, and dispatch through the bus only.
- Tenancy: routers wrap command dispatch in the space ALS frame (reuse the same
  mechanism `SpaceInterceptor`/MCP uses) so tenant repos scope automatically.

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | `HaTopicValueObject` builds/validates prefixes; rejects cross-space | VO spec |
| Unit | entity mappers: VM → discovery + state payload shape | mapper specs |
| Unit | command/ingest routers: parse topic+payload → correct command (mocked bus) | `jest.Mocked` |
| Unit | `ApiTokenAggregate` hashing/revocation; strategy resolves token→space | aggregate + strategy specs |
| Unit | `MqttService` publish/subscribe/reconnect with a mocked `mqtt` client | service spec |
| Integration | `api_tokens` + `sensor_readings` repos round-trip, tenant scoping | real Postgres |
| Integration | reconcile snapshot publishes expected topics (in-memory broker / mock) | per phase |
| E2E | MCP `/api/mcp` accepts a long-lived API token and runs a tool | supertest |

## Open Questions

- **Broker for tests/CI**: use an embedded/mocked MQTT client for unit/integration,
  or a Mosquitto service container like the Postgres pattern? (Lean: mock the client
  for unit; defer a real broker container to Phase 2 integration if needed.)
- **Token format/prefix**: confirm the human-facing prefix (`ght_`?) and whether to
  surface token management over GraphQL/REST in Phase 1 or admin-only.
- **Plant→sensor mapping (Phase 4)**: how a plant is bound to an HA sensor — config
  map, a `mqtt_topic` field on the plant, or a QR-style pairing. Decide in Phase 4.
