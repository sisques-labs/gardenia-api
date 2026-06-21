# Tasks: Home Assistant Integration — home-assistant-integration

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1500–2000 across 4 phases |
| 400-line budget risk | High (umbrella) |
| Chained PRs recommended | Yes |
| Suggested split | One PR per phase (1 → 2 → 3 → 4) |
| Delivery strategy | chained-pr |
| Chain strategy | phase-gated |

Decision needed before apply: No (Phase 1 is shippable on its own)
Chained PRs recommended: Yes
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | `core/mqtt` transport + health + long-lived API tokens (voice) | PR 1 | Shippable alone; unblocks Assist |
| 2 | `home-assistant` bridge: discovery + retained state (HA reads) | PR 2 | Depends on Unit 1 |
| 3 | Command topics → CommandBus (HA writes) | PR 3 | Depends on Unit 2 |
| 4 | `sensor-readings` ingest + surface-back | PR 4 | Heaviest; new persisted domain |

---

## Phase 1: Foundation — core/mqtt + voice auth

### 1A. core/mqtt transport
- [ ] 1.1 **[M]** Add `mqtt` client dependency; create `src/core/mqtt/config/mqtt.config.ts` env schema (`MQTT_ENABLED`, `MQTT_URL`, `MQTT_USERNAME`, `MQTT_PASSWORD`, `MQTT_BASE_TOPIC`, `HA_DISCOVERY_PREFIX`, `HA_RECONCILE_INTERVAL`). Req: R-MQTT-1.
- [ ] 1.2 **[L]** Create `src/core/mqtt/services/mqtt.service.ts` — managed connection (lazy connect when enabled), `publish(topic, payload, {retain})`, `subscribe(filter, handler)`, JSON (de)serialize, auto-reconnect with backoff, LWT availability topic. No-op when disabled. Req: R-MQTT-1, R-MQTT-2, R-MQTT-3.
- [ ] 1.3 **[S]** Create `src/core/mqtt/mqtt.module.ts` (global) wiring config + service; import once in `AppModule`. Req: R-MQTT-1.
- [ ] 1.4 **[S]** Create `src/core/mqtt/health/mqtt.health-indicator.ts` and register it in `core/health`. Reports `up`/`down`/`disabled`. Req: R-MQTT-4.
- [ ] 1.5 **[S]** Create `src/core/mqtt/README.md` mirroring `core/mcp/README.md`.
- [ ] 1.6 **[M]** Unit test `MqttService` with a mocked `mqtt` client (publish/subscribe/reconnect/disabled no-op). Spec: S-MQTT-1..3.

### 1B. Long-lived space-scoped API tokens (voice plane)
- [ ] 1.7 **[M]** Domain: `auth/domain/value-objects/api-token/api-token.vo.ts` + `auth/domain/aggregates/api-token.aggregate.ts` (hashed secret, `spaceId`, `label`, `lastUsedAt`, `revokedAt`); builder; primitives. Req: R-TOK-1, R-TOK-2.
- [ ] 1.8 **[M]** Persistence: `api-token.entity.ts`, mapper, repository (read+write), and migration creating `api_tokens` (unique `token_hash`). Req: R-TOK-2.
- [ ] 1.9 **[M]** Application: `issue-api-token` command (returns plaintext once), `revoke-api-token` command, `find-api-token-by-secret` query (hash lookup, ignores revoked). Req: R-TOK-1, R-TOK-3, R-TOK-4.
- [ ] 1.10 **[M]** Infrastructure: extend `jwt.strategy.ts` (or add an auth strategy) so `Authorization: Bearer <api_token>` resolves to `{ userId, spaceId }` and populates the same request user/space the JWT path does. Never log the token. Req: R-TOK-4, R-TOK-5.
- [ ] 1.11 **[S]** Transport: expose `issue`/`revoke`/`list` for the current user (GraphQL + REST), guarded by JWT (not by API token). Update `auth/README.md`. Req: R-TOK-3.
- [ ] 1.12 **[M]** Tests: VO/aggregate unit (hashing, revoke), strategy unit (valid/revoked/garbage → 401), integration repo round-trip, E2E `POST /api/mcp` with an API token runs a tool. Spec: S-TOK-x.

## Phase 2: HA reads Gardenia — discovery + retained state

- [ ] 2.1 **[S]** Create `home-assistant` context skeleton + `home-assistant.module.ts` (empty provider arrays), import in `AppModule`. Req: R-HA-1.
- [ ] 2.2 **[M]** `domain/value-objects/ha-topic/ha-topic.value-object.ts` — builds `{base}/{spaceId}/...` state/command topics and `homeassistant/.../config` discovery topics; validates non-empty space. Req: R-HA-2, R-HA-6.
- [ ] 2.3 **[M]** `application/ports/*` + `infrastructure/adapters/*` — read ports for plants, care-log summary, harvests, inventory, weather; adapters dispatch via `QueryBus` only (no cross-context domain import). Req: R-HA-3, R-HA-7.
- [ ] 2.4 **[L]** `domain/services/*-entity-mapper.ts` — map each view model to its HA discovery config + state payload (plant `last_watered`/`next_care_due`/`health`, space task counts, harvest totals, inventory levels, weather). Stable `unique_id`/`object_id`. Req: R-HA-3, R-HA-4.
- [ ] 2.5 **[M]** `infrastructure/services/ha-reconcile.service.ts` — on bootstrap and every `HA_RECONCILE_INTERVAL`, for each bridged space publish discovery (retain) + state (retain). Publish bridge availability `online`. Req: R-HA-4, R-HA-5.
- [ ] 2.6 **[S]** Config: map which space(s) a connection bridges. Document operator setup in `home-assistant/README.md`. Req: R-HA-1.
- [ ] 2.7 **[M]** Tests: topic VO unit, mapper units (payload shape), reconcile unit (mock MqttService asserts topics), integration over a mock/embedded broker, E2E that discovery+state publish for a seeded space. Spec: S-HA-x.

## Phase 3: HA writes Gardenia — command topics

- [ ] 3.1 **[M]** `application/ports/*` + `infrastructure/adapters/*` — write ports: record watering (→ `CreateCareLogEntryCommand`), harvest (→ `CreateHarvestCommand`), adjust inventory (→ `AdjustInventoryQuantityCommand`). Adapters dispatch via `CommandBus` only. Req: R-HA-8.
- [ ] 3.2 **[M]** `transport/mqtt/ha-command.router.ts` — subscribe to `{base}/{spaceId}/+/+/set`, parse topic→entity+action, validate payload, run inside the space ALS frame, dispatch the command. Log at entry. Reject unknown/foreign-space topics. Req: R-HA-8, R-HA-6.
- [ ] 3.3 **[M]** Extend discovery output (Phase 2 mappers) to emit `button`/`number` entities with `command_topic` for the writable actions. Req: R-HA-8.
- [ ] 3.4 **[M]** Tests: router unit (topic+payload → correct command, mocked bus; foreign space rejected), E2E publish-to-set records the action in the right space. Spec: S-HA-8.x.

## Phase 4: Physical sensors → Gardenia — sensor-readings

- [ ] 4.1 **[L]** Create `sensor-readings` context: `SensorReadingAggregate` (plantId, metric, value, unit, measuredAt, source), builder, primitives, value objects, repository interface. Req: R-SR-1.
- [ ] 4.2 **[M]** Persistence: entity, mapper, TypeORM write repo, migration creating `sensor_readings` with index `(space_id, plant_id, metric, measured_at)`. Req: R-SR-2.
- [ ] 4.3 **[M]** Application: `record-sensor-reading` command + handler (tenant-scoped); `find-latest-reading` query per `(plant, metric)`. Req: R-SR-1, R-SR-3.
- [ ] 4.4 **[M]** Bridge ingest: `home-assistant/transport/mqtt/ha-sensor-ingest.router.ts` subscribes to configured HA sensor topics, maps topic→plant, dispatches `RecordSensorReadingCommand` via an adapter. Define the plant↔sensor mapping mechanism. Req: R-SR-3, R-HA-9.
- [ ] 4.5 **[M]** Surface-back: Phase 2 plant mapper includes latest reading per metric as a plant sensor entity/state. Req: R-SR-4, R-HA-3.
- [ ] 4.6 **[M]** Tests: aggregate/handler unit, repo integration round-trip + tenant scoping, ingest router unit (topic→reading), E2E publish-reading → persisted → surfaced. Spec: S-SR-x, S-HA-9.

## Cross-cutting (all phases)
- [ ] X.1 Keep `MQTT_ENABLED=false` default; verify app behavior unchanged when disabled.
- [ ] X.2 ESLint boundaries pass: no bridge import of another context's domain/application.
- [ ] X.3 Update READMEs for every context touched (`auth`, `home-assistant`, `sensor-readings`, `core/mqtt`).
- [ ] X.4 `pnpm test`, `pnpm test:integration`, `pnpm test:e2e`, `pnpm build`, `pnpm lint`, `tsc --noEmit` green per phase.
