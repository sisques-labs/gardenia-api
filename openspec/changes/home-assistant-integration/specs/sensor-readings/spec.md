# Sensor-Readings Specification

## Purpose

Introduces persisted physical telemetry as a first-class, append-only domain
concept. A sensor reading is a measured value (with metric, unit and timestamp)
recorded against a plant within a space, ingested from Home Assistant via the
bridge. It is intentionally separate from `care-log` (human actions) and `plants`
(identity).

---

## Requirements

### Requirement: SensorReading Aggregate

The system MUST define a `SensorReadingAggregate` with the fields: `plantId`,
`metric` (e.g. `moisture`, `temperature`), `value` (numeric), `unit`, `measuredAt`
(timestamp of the physical measurement), and `source` (origin, e.g. the HA entity).
All fields MUST be modeled as value objects; readings are immutable once recorded.

#### Scenario: Reading carries its measurement metadata
- GIVEN a recorded sensor reading
- WHEN it is read back
- THEN it MUST expose `plantId`, `metric`, `value`, `unit`, `measuredAt`, and `source`
- AND it MUST NOT be mutable after creation

---

### Requirement: SensorReading Persistence and Tenancy

Sensor readings MUST persist to a `sensor_readings` table created via a named
migration, scoped by `space_id`, and indexed on `(space_id, plant_id, metric,
measured_at)` for latest-value lookups. Readings MUST be tenant-scoped exactly like
other space-owned data.

#### Scenario: Reading is space-scoped
- GIVEN a reading recorded in space `S`
- WHEN data is queried from a different space
- THEN that reading MUST NOT be visible

---

### Requirement: Record Sensor Reading Command

The system MUST expose a `RecordSensorReadingCommand` that persists one reading for
a plant within the current space. The command input MUST use primitives and the
handler MUST run within the tenant context.

#### Scenario: Reading is recorded
- GIVEN a valid plant in space `S`
- WHEN `RecordSensorReadingCommand` is processed for a metric and value
- THEN a `sensor_readings` row MUST be persisted for that plant in space `S`

---

### Requirement: Latest Reading Query and Surface-Back

The system MUST expose a query returning the latest reading per `(plant, metric)`.
The Home Assistant bridge MUST surface that latest value back to HA as a plant
entity, so a physical measurement ingested from HA becomes visible Gardenia data.

#### Scenario: Latest moisture surfaces in HA
- GIVEN a recorded moisture reading for plant `P`
- WHEN the bridge reconciliation runs
- THEN HA MUST receive a state value for plant `P`'s moisture entity equal to the latest reading
