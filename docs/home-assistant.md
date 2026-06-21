# Home Assistant Integration

Gardenia integrates with [Home Assistant](https://www.home-assistant.io/) (HA)
over **MQTT** so your garden data and your smart home talk to each other in both
directions, plus a **voice/Assist** path that reuses the existing MCP surface.

- **HA reads Gardenia** — plants, tasks, harvests, inventory and weather appear
  as native HA entities (via MQTT Discovery), updated automatically.
- **HA writes Gardenia** — dashboard buttons / numbers record waterings and
  adjust inventory.
- **Physical sensors → Gardenia** — HA sensor readings (soil moisture, etc.) are
  stored against a plant and surfaced back as HA entities.
- **Voice / Assist** — HA's MCP client drives Gardenia in natural language using
  a long-lived API token.

> The whole integration is **off by default**. With `MQTT_ENABLED=false` (the
> default) Gardenia connects to no broker, publishes nothing and behaves exactly
> as it did before.

---

## 1. Architecture at a glance

```
                         ┌───────────────────────── Gardenia API ─────────────────────────┐
                         │                                                                 │
 Home Assistant          │   core/mqtt (MqttService)        contexts/home-assistant         │
 ┌───────────┐  MQTT     │   ┌──────────────────┐           ┌──────────────────────────┐    │
 │  Mosquitto│◀─────────▶│   │ one broker conn. │◀────────▶ │ HaReconcileService        │    │
 │  broker   │           │   │ pub/sub + LWT    │           │ HaCommandRouter           │    │
 └───────────┘           │   └──────────────────┘           │ HaSensorIngestRouter      │    │
        ▲                │                                   │   (ports → adapters)      │    │
        │ entities       │                                   └────────────┬─────────────┘    │
        │ commands       │                                   Query/Command bus               │
        │ readings       │   plants · care-log · harvests · inventory · weather · spaces ·    │
        │                │   sensor-readings                                                 │
 ┌───────────┐  MCP/HTTP │   ┌──────────────────┐                                            │
 │ HA Assist │◀─────────▶│   │ POST /api/mcp    │  (Bearer ght_… API token)                  │
 │ (MCP)     │           │   └──────────────────┘                                            │
 └───────────┘           └─────────────────────────────────────────────────────────────────┘
```

Two independent planes:

| Plane | Transport | Auth | Used for |
|-------|-----------|------|----------|
| **Data** | MQTT | Broker-level service account | Entities, commands, sensor ingest |
| **Voice** | MCP over HTTPS (`/api/mcp`) | Long-lived space-scoped API token | Natural-language tools |

### Where the code lives

| Area | Path | Responsibility |
|------|------|----------------|
| Shared MQTT transport | `src/core/mqtt/` | One managed broker connection; `/health` MQTT status |
| Bridge context | `src/contexts/home-assistant/` | Gardenia ↔ HA mapping, discovery, command/ingest routers |
| Telemetry domain | `src/contexts/sensor-readings/` | Persisted physical readings |
| API tokens (voice auth) | `src/contexts/auth/` | Long-lived `ght_…` tokens |

Each has its own README with the internal details:
[`core/mqtt`](../src/core/mqtt/README.md) ·
[`home-assistant`](../src/contexts/home-assistant/README.md) ·
[`sensor-readings`](../src/contexts/sensor-readings/README.md) ·
[`auth`](../src/contexts/auth/README.md). The full design rationale and phased
plan is in [`openspec/changes/home-assistant-integration/`](../openspec/changes/home-assistant-integration/).

---

## 2. Configuration

All settings are environment variables (see [`.env.example`](../.env.example)).

| Variable | Default | Purpose |
|----------|---------|---------|
| `MQTT_ENABLED` | `false` | Master switch. Anything but `true` disables the whole MQTT bridge. |
| `MQTT_URL` | — | Broker URL, e.g. `mqtt://homeassistant.local:1883`. Required when enabled. |
| `MQTT_USERNAME` / `MQTT_PASSWORD` | — | Broker service-account credentials (blank = anonymous). |
| `MQTT_BASE_TOPIC` | `gardenia` | Root segment of all state/command/reading topics. |
| `HA_DISCOVERY_PREFIX` | `homeassistant` | Must match HA's MQTT Discovery prefix. |
| `HA_RECONCILE_INTERVAL` | `300000` | Full state-snapshot interval, in ms. |
| `HA_BRIDGED_SPACES` | — | Comma-separated space ids to bridge. **Nothing is published or accepted until this is set.** |

The bridge is active only when `MQTT_ENABLED=true` **and** `HA_BRIDGED_SPACES`
lists at least one space.

The voice plane (`/api/mcp`) needs no MQTT config — only an API token (§5).

---

## 3. Authentication & tenancy

- **MQTT (data plane).** Auth is the broker's job: Gardenia connects with a
  single service account (`MQTT_USERNAME`/`MQTT_PASSWORD`). Multi-tenant
  isolation is by **topic prefix** — every topic is `{base}/{spaceId}/…`, and
  the bridge only ever publishes to, or accepts commands from, a space listed in
  `HA_BRIDGED_SPACES`. Writes run inside that space's tenant context, so a
  command can never affect another space. On a broker shared by several homes,
  add per-space broker ACLs as defense in depth.
- **Voice (MCP).** A long-lived, **space-scoped** API token (§5). The guard
  resolves it to the owning user and the token's space, so HA needs no
  `X-Space-ID` header and no JWT refresh.

---

## 4. Setting up the MQTT bridge

1. **Have a broker.** Use the Home Assistant *Mosquitto broker* add-on, or any
   MQTT broker reachable from Gardenia.
2. **Create a service account** on the broker for Gardenia (or allow anonymous
   for a private LAN broker).
3. **Find your space id.** It's the `X-Space-ID` you already use with the API
   (e.g. from `GET /api/spaces`).
4. **Configure Gardenia:**
   ```bash
   MQTT_ENABLED=true
   MQTT_URL=mqtt://homeassistant.local:1883
   MQTT_USERNAME=gardenia
   MQTT_PASSWORD=••••••
   HA_BRIDGED_SPACES=<your-space-id>
   ```
5. **Enable MQTT in Home Assistant** (Settings → Devices & Services → MQTT) and
   point it at the same broker. Discovery is on by default with prefix
   `homeassistant`.
6. **Restart Gardenia.** On boot (and every `HA_RECONCILE_INTERVAL`) it publishes
   discovery + retained state. A **Gardenia** device and one device per plant /
   inventory item appear under the MQTT integration.

---

## 5. Setting up voice / Assist (MCP)

1. **Issue a token** (authenticated as a member of the space, with `X-Space-ID`
   set to that space):
   ```bash
   curl -X POST https://<gardenia-host>/api/auth/api-tokens \
     -H "Authorization: Bearer <your-jwt>" \
     -H "X-Space-ID: <your-space-id>" \
     -H "Content-Type: application/json" \
     -d '{"label":"Home Assistant"}'
   # → { "id": "...", "token": "ght_…" }   ← shown once, store it now
   ```
2. **Point HA's MCP client** at `https://<gardenia-host>/api/mcp` with header
   `Authorization: Bearer ght_…`. Tools run within the token's space — no
   `X-Space-ID` needed.
3. **Manage tokens:** `GET /api/auth/api-tokens` (list, no secrets) and
   `DELETE /api/auth/api-tokens/:id` (revoke). A revoked token stops working
   immediately.

Tokens are stored only as a SHA-256 hash, are never logged, and are scoped to a
single space.

---

## 6. What you get in Home Assistant

For each bridged space the bridge publishes:

### Space hub device (`gardenia_<spaceId>`)
| Entity | Type | Notes |
|--------|------|-------|
| Plants | sensor | Total plant count |
| Harvests | sensor | Total harvest count |
| Last harvest | sensor (timestamp) | Most recent harvest time |
| Inventory items | sensor | Total inventory item count |
| Low stock items | sensor | Items at/under their low-stock threshold |
| Temperature (max/min) | sensor (°C) | Today's forecast — only if the space has geolocation |
| Precipitation | sensor (mm) | Today's forecast |

### Per-plant device
| Entity | Type | Notes |
|--------|------|-------|
| Last watered | sensor (timestamp) | From the care log |
| Water | **button** | Press → records a watering (HA → Gardenia) |
| `<metric>` | sensor | Latest ingested reading per metric (e.g. moisture) |

### Per-inventory-item device
| Entity | Type | Notes |
|--------|------|-------|
| Quantity | sensor | Current quantity |
| Adjust quantity | **number** | Published value is a **delta** applied to the item |

Availability for every entity follows the per-space topic
`{base}/{spaceId}/bridge/availability` (`online`, or `offline` via the broker
Last-Will if Gardenia disconnects).

---

## 7. MQTT topic reference

`<base>` = `MQTT_BASE_TOPIC` (default `gardenia`), `<prefix>` =
`HA_DISCOVERY_PREFIX` (default `homeassistant`).

| Direction | Topic | Payload |
|-----------|-------|---------|
| availability | `<base>/<space>/bridge/availability` | `online` / `offline` (retained) |
| discovery | `<prefix>/<component>/gardenia_<space>/<object>/config` | HA discovery JSON (retained) |
| state (read) | `<base>/<space>/summary/<metric>/state` | hub counts / last harvest |
| state (read) | `<base>/<space>/weather/<metric>/state` | today's forecast |
| state (read) | `<base>/<space>/plant/<id>/last_watered/state` | ISO timestamp or `None` |
| state (read) | `<base>/<space>/plant/<id>/<metric>/state` | latest ingested reading |
| state (read) | `<base>/<space>/inventory/<id>/quantity/state` | current quantity |
| **command** (write) | `<base>/<space>/plant/<id>/water/set` | `PRESS` |
| **command** (write) | `<base>/<space>/inventory/<id>/adjust/set` | numeric delta |
| **ingest** (write) | `<base>/<space>/plant/<id>/<metric>/reading` | numeric value |

Malformed payloads, unknown actions, and any topic for a non-bridged space are
ignored (and logged).

---

## 8. Ingesting physical sensors (HA → Gardenia)

Have an HA automation publish your sensor's value to the plant's reading topic.
Example (Home Assistant automation YAML) forwarding a soil-moisture sensor:

```yaml
automation:
  - alias: "Gardenia — push fern moisture"
    trigger:
      - platform: state
        entity_id: sensor.fern_soil_moisture
    action:
      - service: mqtt.publish
        data:
          topic: "gardenia/<space-id>/plant/<plant-id>/moisture/reading"
          payload: "{{ states('sensor.fern_soil_moisture') }}"
```

Gardenia persists each value as a `sensor-reading` (metric normalized to
lower-case, source `home_assistant`) and, on the next reconcile, surfaces the
latest value per metric back as the plant's `<metric>` sensor — closing the
read↔write↔read loop.

The plant↔sensor mapping is **Gardenia's topic namespace**: you choose which HA
entity publishes to which `plant/<id>/<metric>/reading` topic.

---

## 9. Health & observability

`GET /health` includes an `mqtt` field: `disabled` (transport off), `up`
(connected) or `down` (enabled but not connected). Every router and the
reconcile service log at entry with the space and the action; the raw API token
and broker password are never logged.

---

## 10. Troubleshooting

| Symptom | Likely cause |
|---------|--------------|
| No entities appear in HA | `MQTT_ENABLED` not `true`, `HA_BRIDGED_SPACES` empty, or HA pointed at a different broker / discovery prefix |
| `/health` shows `mqtt: down` | Wrong `MQTT_URL`/credentials, or broker unreachable (the app still serves HTTP; it auto-reconnects) |
| Button/number does nothing | Space not in `HA_BRIDGED_SPACES`, or payload not numeric (for Adjust) |
| Weather sensors missing | The space has no geolocation set |
| MCP returns 401 | Token malformed, revoked, or not prefixed `ght_` |
| Entities are stale | They refresh every `HA_RECONCILE_INTERVAL`; lower it if needed |

---

## 11. Limitations / roadmap

- **Harvest writes** from HA are not yet supported (they need structured input
  — crop/quantity/unit — that doesn't map to a button or number).
- Per-plant **health / next-care** sensors are not published yet (they follow
  the same mapper/port shape and are a small addition).
- State updates are **snapshot-based** (interval + bootstrap), not event-driven;
  retained topics keep HA's last-known state across restarts.

---

## 12. Testing

| Layer | What it covers | Command |
|-------|----------------|---------|
| Unit | topic builder, entity mappers, routers, token aggregate/handlers | `pnpm test` |
| Integration | sensor-readings repo (tenant-scoped, latest-per-metric), reconcile read path, API-token repo | `pnpm test:integration` |
| E2E | full app over a real (embedded) MQTT broker: button→care-log, reading→stored, reconcile→published; `/api/mcp` with an API token | `pnpm test:e2e` |

The MQTT e2e starts an in-process broker, so no external broker is needed.
