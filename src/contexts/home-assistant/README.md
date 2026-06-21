# Home Assistant Bridge (`home-assistant`)

Publishes Gardenia state to **Home Assistant** over MQTT Discovery so plants,
tasks and stock appear as native HA entities, and (later phases) accepts
commands and sensor readings back. This context owns **only the translation**
between Gardenia and HA — no business rules.

## What this context owns

- The Gardenia → HA entity mapping (discovery config + retained state payloads).
- The MQTT topic layout and per-space tenant isolation.
- The reconciliation loop that snapshots state to the broker.

It reaches the `plants` / `care-log` (and future) contexts **only** through
`application/ports` implemented by `infrastructure/adapters` that dispatch via
the Query/Command bus — never importing another context's domain/application
(enforced by the boundaries ESLint rule).

## How it works

```
bootstrap / every HA_RECONCILE_INTERVAL
  → HaReconcileService.reconcile()
      for each HA_BRIDGED_SPACES space:
        SpaceContext.run(spaceId, …)          // tenant ALS frame
          → publish <base>/<space>/bridge/availability = "online" (retained)
          → IPlantStatePort.listPlantStates    // adapter → QueryBus
              → PlantFindByCriteria + CareLogFindLastByType(WATERING)
          → PlantEntityMapper → discovery config + state per plant
          → MqttService.publish(config, retain) + publish(state, retain)
                                                            │
                                                       MQTT broker ←→ Home Assistant
```

Two HA device kinds are published per space:

- A **space hub** device (`gardenia_<spaceId>`) carrying aggregate + weather
  sensors: `plants_total`, `harvests_total`, `last_harvest`,
  `inventory_items_total`, `inventory_low_stock`, and (when the space has
  geolocation) `weather_temperature_max/min` and `weather_precipitation`.
- One **plant** device per plant (grouped under the hub via `via_device`) with a
  `last_watered` timestamp sensor. Adding per-plant sensors (health, next-care)
  follows the same shape.

## Topic layout

| Topic | Purpose |
|-------|---------|
| `<base>/<spaceId>/bridge/availability` | Per-space availability (`online`/LWT `offline`) |
| `<base>/<spaceId>/summary/<metric>/state` | Hub aggregate sensors (counts, last harvest) |
| `<base>/<spaceId>/weather/<metric>/state` | Hub weather sensors (today's forecast) |
| `<base>/<spaceId>/plant/<id>/last_watered/state` | Per-plant sensor state |
| `<discoveryPrefix>/sensor/gardenia_<spaceId>/<object>/config` | Retained HA discovery config |

`<base>` = `MQTT_BASE_TOPIC` (default `gardenia`), `<discoveryPrefix>` =
`HA_DISCOVERY_PREFIX` (default `homeassistant`). Every state/command topic is
namespaced by space, so the bridge can never cross spaces.

## Building blocks

| File | Responsibility |
|------|----------------|
| `domain/services/ha-topic.factory.ts` | Builds all topics (tenant isolation) |
| `domain/services/ha-sensor.builder.ts` | Shared single-sensor discovery+state builder |
| `domain/services/plant-entity.mapper.ts` | Plant state → HA discovery + state |
| `domain/services/space-summary.mapper.ts` | Aggregate counts → hub sensors |
| `domain/services/weather-entity.mapper.ts` | Today's forecast → hub weather sensors |
| `application/ports/*.port.ts` | `IPlantStatePort` / `ISpaceSummaryPort` / `IWeatherStatePort` |
| `infrastructure/adapters/*.adapter.ts` | Implement the ports via QueryBus |
| `infrastructure/services/ha-reconcile.service.ts` | Bootstrap + interval snapshot |

## Activation

Inert unless **both**:

- `MQTT_ENABLED=true` (the shared `core/mqtt` transport connects), and
- `HA_BRIDGED_SPACES=<spaceId>[,<spaceId>…]` (which spaces to publish).

With either unset the reconcile loop never starts and nothing is published.

## Status

- **Phase 2 (this):** HA reads plant state (discovery + retained `last_watered`).
- **Phase 3 (planned):** command topics → CommandBus (mark watered, harvest, …).
- **Phase 4 (planned):** ingest physical sensor readings from HA.

See `openspec/changes/home-assistant-integration/` for the full plan.
