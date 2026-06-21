# Proposal: Home Assistant Integration (MQTT bridge + MCP voice)

**Change**: home-assistant-integration
**Phase**: proposal (umbrella)
**Date**: 2026-06-21
**Artifact store**: openspec

---

## Intent

Gardenia today is a manual record-keeping API: users log waterings, harvests and
inventory by hand. The physical world (soil-moisture probes, smart valves, plug
power, presence) lives in **Home Assistant (HA)**, and there is no bridge between
the two. We want HA and Gardenia to share state in both directions so that:

- HA **shows** Gardenia data as native entities (last watered, next care due,
  plant health, harvests, inventory levels, weather) and can drive automations
  and notifications from them.
- HA **writes** to Gardenia from automations and dashboards (a smart valve firing
  records a watering; a dashboard button harvests a plant; a number entity adjusts
  inventory).
- HA's **voice assistant (Assist)** can query and operate Gardenia in natural
  language, reusing the MCP surface that already exists.
- Physical **sensor readings** from HA flow into Gardenia and become first-class
  plant data instead of being lost in HA history.

Success means: a user pastes broker credentials (and one long-lived token for
voice) into HA, and within one space their plants, tasks and stock appear as HA
entities that update in near real time, accept commands back, and answer voice.

## Scope

This is an **umbrella proposal** covering four phases. Each phase is implemented
and reviewed as its own work unit (and likely its own PR); this document is the
shared north star, the others are the contracts.

### In Scope

**Phase 1 — Foundation (transport + voice auth)**
- New shared `core/mqtt` module: a single managed connection to an MQTT broker,
  publish/subscribe primitives, JSON (de)serialization, reconnect/backoff, an LWT
  (last-will) availability topic, and a health indicator wired into `core/health`.
- Broker connection configured via env (`MQTT_URL`, `MQTT_USERNAME`,
  `MQTT_PASSWORD`, `MQTT_BASE_TOPIC`, `HA_DISCOVERY_PREFIX`, enable flag).
- Long-lived, space-scoped **API tokens** in the `auth` context so HA's MCP client
  authenticates statelessly (no JWT refresh). This unblocks the voice path with a
  minimal new surface.

**Phase 2 — HA reads Gardenia (state out + discovery)**
- New `home-assistant` bounded context (the bridge). On startup and on a periodic
  reconciliation it publishes **MQTT Discovery** config topics so HA auto-creates
  entities, plus retained **state** topics. Read-only entities first:
  per-plant (`last_watered`, `next_care_due`, `health`), per-space task counts,
  harvests, inventory levels, and weather.
- Tenancy by topic namespace: `{base}/{spaceId}/...`. One space = one HA *device*
  group.

**Phase 3 — HA writes Gardenia (commands in)**
- The bridge subscribes to HA `command_topic`s and dispatches `CommandBus`
  commands: e.g. "mark watered" → `CreateCareLogEntryCommand`, "harvest" →
  `CreateHarvestCommand`, "adjust stock" → `AdjustInventoryQuantityCommand`.
  Exposed as HA `button` / `number` entities via discovery.

**Phase 4 — Physical sensors → Gardenia (ingest)**
- New `sensor-readings` domain concept (telemetry persisted against a plant /
  planting-spot). The bridge subscribes to HA sensor state topics, maps them to a
  plant, and stores readings. Latest reading is surfaced back as a plant sensor in
  Phase 2's discovery output.

### Out of Scope

- A separate Home Assistant custom component / HACS Python integration (explicitly
  decided: everything lives in `gardenia-api`).
- Running or bundling an MQTT broker — operators point Gardenia at an existing one
  (HA's Mosquitto add-on or a shared broker).
- Per-space broker users / ACL provisioning automation (documented as an operator
  concern; topic-prefix isolation is the in-app mechanism).
- Exposing the `auth` context's credential/session flows over MCP or MQTT.
- HA-side dashboards, blueprints, Lovelace cards.

## Capabilities

### New Capabilities
- `home-assistant`: the MQTT bridge bounded context — discovery publishing, retained
  state publishing, command-topic subscription, and the Gardenia↔HA entity mapping.
- `sensor-readings`: persisted physical telemetry (a reading: plant, metric, value,
  unit, measured-at) ingested from HA.

### Modified Capabilities
- `auth`: gains long-lived, space-scoped API tokens (issue, authenticate, revoke).
- `core` (cross-cutting): new `core/mqtt` transport module + health indicator.

## Approach

1. **MQTT, not custom HA component.** Reuse HA's first-class MQTT Discovery so
   entities appear with zero HA-side YAML. The bridge is a normal inbound/outbound
   transport adapter — it owns no business rules, only translation.
2. **One bridge context, boundary-safe.** The `home-assistant` context reaches every
   other context **only** through `application/ports` + `infrastructure/adapters`
   that dispatch via `QueryBus`/`CommandBus` — never importing another context's
   domain/application. This matches the existing `weather`/`plants` adapter pattern
   and the boundaries ESLint rule.
3. **State out via reconciliation snapshot (MVP), events later.** Because no
   `@EventsHandler` consumers exist yet and domain-event classes live in other
   contexts (boundary-protected), Phase 2 publishes state by reading view models
   through adapters on a scheduled reconciliation + on bootstrap. Incremental,
   event-driven republish is a later enhancement, and when added the event
   subscription lives in `infrastructure/adapters/` (the only layer allowed to see
   another context's events). See design.
4. **Tenancy by topic prefix.** `{base}/{spaceId}/...` isolates spaces on a shared
   broker; the in-app config maps each managed connection to the space(s) it
   bridges. Cross-space leakage is impossible because the bridge only ever publishes
   under a space prefix and only dispatches commands inside that space's context.
5. **Two auth planes.** MQTT auth is broker-level (service account, env config);
   voice/MCP auth is a long-lived space-scoped token. They are independent.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/core/mqtt/**` | New | Shared broker connection, pub/sub, health, config |
| `src/core/health/**` | Modified | Register MQTT health indicator |
| `src/contexts/home-assistant/**` | New | Bridge context (domain mapping, ports, adapters, MQTT transport) |
| `src/contexts/sensor-readings/**` | New | Telemetry aggregate, repo, persistence, migration |
| `src/contexts/auth/**` | Modified | Long-lived API token: domain VO/aggregate, issue/revoke commands, guard/strategy, migration |
| `src/app.module.ts` | Modified | Import `MqttModule`, `HomeAssistantModule`, `SensorReadingsModule` |
| `.env` / config schema | Modified | MQTT + discovery + token settings |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Broker unavailable at boot / flapping | Med | Connection is lazy + auto-reconnect; feature flag off by default; health indicator degrades, app still serves HTTP |
| Cross-space topic leakage | Low | Single enforced `{base}/{spaceId}` prefix builder VO; commands always run in that space's ALS frame |
| Stale state without event-driven push | Med | Periodic reconciliation interval (configurable) + retained topics; event-driven push is a follow-up |
| Discovery topic churn / orphan entities | Med | Stable `unique_id`/`object_id` derivation; publish empty payload to remove on delete |
| Long-lived token theft | Med | Hashed at rest, space-scoped, revocable, prefixed for secret-scanning; never logged |
| HA command spoofing via MQTT | Med | Bridge only accepts commands under a space prefix it owns; broker ACLs are the operator boundary (documented) |
| Boundary violations from the bridge | Low | Ports/adapters only; enforced by `boundaries/element-types` ESLint rule |

## Rollback Plan

The whole integration is behind a single env feature flag (`MQTT_ENABLED=false` by
default). With it off, `MqttModule` connects nothing and the bridge publishes
nothing — the app is byte-for-byte unchanged. Per phase: revert the phase's commits;
for Phase 1/4 run the down migration (`api_tokens`, `sensor_readings`). Retained
discovery topics are cleared by publishing empty payloads (a documented operator
script / startup cleanup) so HA drops the entities.

## Dependencies

- An MQTT broker reachable from Gardenia (operator-provided).
- `mqtt` npm client (new dependency) for `core/mqtt`.
- `@nestjs/schedule` (or existing scheduler) for reconciliation, if not already present.
- Existing `@modelcontextprotocol/sdk` MCP transport (Phase 1 voice reuses it).
- `@sisques-labs/nestjs-kit` value-object base classes (existing).

## Delivery Strategy

Four chained work units, one per phase, in order (1 → 2 → 3 → 4). Phase 1 is
independently shippable (voice works, transport ready). Phases 2/3 are the core
value. Phase 4 is the heaviest (new persisted domain) and last. Each phase ships
with unit + integration + E2E coverage at its applicable layers.

## Success Criteria

- [ ] With `MQTT_ENABLED=false`, behavior is identical to today (no broker, no topics).
- [ ] Phase 1: HA's MCP client authenticates with a long-lived space-scoped token and
      runs Gardenia tools by voice; `core/health` reports MQTT status.
- [ ] Phase 2: starting the app makes a space's plants/tasks/harvests/inventory/weather
      appear as HA entities via discovery, updating on reconciliation.
- [ ] Phase 3: an HA button records a care-log entry / harvest; a number entity adjusts
      inventory — all scoped to the right space.
- [ ] Phase 4: an HA soil-moisture sensor reading is persisted as a `sensor-reading`
      and the latest value surfaces back as a plant entity in HA.
- [ ] No bridge code imports another context's domain/application (ESLint boundaries pass).
