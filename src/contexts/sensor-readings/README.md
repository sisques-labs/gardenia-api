# Sensor Readings (`sensor-readings`)

Persisted **physical telemetry**: a measured value (metric + unit + timestamp)
recorded against a plant within a space. Append-only and deliberately separate
from `care-log` (human actions) and `plants` (identity). Readings are ingested
from Home Assistant via the `home-assistant` bridge.

## Core aggregate

### `SensorReadingAggregate`

Immutable once recorded. Fields (all value objects): `id`, `plantId`,
`spaceId`, `metric` (lower-cased token, e.g. `moisture`, `temperature`),
`value` (number), `unit`, `measuredAt`, `source` (e.g. `home_assistant`,
`mcp`). No mutation methods — telemetry is never edited.

## Layers

- **domain** — aggregate, builder, value objects (`SensorReadingId`,
  `SensorMetric`), primitives, view model, read/write repository interfaces.
- **application** — `RecordSensorReadingCommand` (persist one reading) and
  `FindLatestReadingsByPlantQuery` (latest reading per metric for a plant).
- **infrastructure** — TypeORM entity/mapper, tenant-scoped write repository
  (`createTenantRepository`), read repository (Postgres `DISTINCT ON (metric)`),
  `sensor_readings` table.
- **transport/mcp** — `sensor_reading_record`, `sensor_reading_find_latest`.

## Persistence

`sensor_readings` (`space_id`-scoped, FK → `spaces`, indexed on
`(space_id, plant_id, metric, measured_at)`). Tenancy is enforced by the shared
tenant-repository proxy: every read/write is scoped to the active `SpaceContext`
space, so a reading is only ever visible within its own space.

## Public API

| Class | Description |
|-------|-------------|
| `RecordSensorReadingCommand` | Persists one reading for a plant in the current space |
| `FindLatestReadingsByPlantQuery` | Latest reading per metric for a plant |

### MCP tools

| Tool | Description |
|------|-------------|
| `sensor_reading_record` | Record a reading (metric + value) for a plant |
| `sensor_reading_find_latest` | Latest reading per metric for a plant |

## How readings flow in

Home Assistant publishes a numeric value to
`gardenia/<spaceId>/plant/<plantId>/<metric>/reading`; the bridge's
`HaSensorIngestRouter` dispatches `RecordSensorReadingCommand`, and the latest
value is surfaced back to HA as a per-plant `<metric>` sensor on the next
reconcile. See `src/contexts/home-assistant/README.md`.
