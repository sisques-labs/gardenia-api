# Home-Assistant Bridge Specification

## Purpose

Defines the `home-assistant` bounded context: an MQTT bridge that publishes
Gardenia state to Home Assistant via MQTT Discovery, accepts commands from HA
back into Gardenia, and ingests physical sensor readings — all scoped per space
and isolated by topic prefix, reaching other contexts only through ports/adapters.

---

## Requirements

### Requirement: Feature Flag and Bridged-Space Configuration

The bridge MUST be disabled by default and MUST do nothing (no connection, no
published topics, no subscriptions) when `MQTT_ENABLED` is false. When enabled,
configuration MUST declare which space id(s) each broker connection bridges.

#### Scenario: Disabled bridge is inert
- GIVEN `MQTT_ENABLED=false`
- WHEN the application starts
- THEN the bridge MUST NOT connect to a broker
- AND it MUST NOT publish or subscribe to any topic

#### Scenario: Enabled bridge binds to configured spaces
- GIVEN `MQTT_ENABLED=true` and one configured bridged space
- WHEN the application starts and the broker is reachable
- THEN the bridge MUST operate only under that space's topic prefix

---

### Requirement: Topic Namespacing and Tenant Isolation

All bridge topics MUST be built from a single topic builder using the pattern
`{MQTT_BASE_TOPIC}/{spaceId}/...` for state and command topics, and the
`{HA_DISCOVERY_PREFIX}/<component>/<node>/<object>/config` pattern for discovery.
The bridge MUST NOT publish to, nor act on a command from, a topic outside the
prefix of a space it bridges.

#### Scenario: State topic carries the space prefix
- GIVEN a bridged space `S` with base topic `gardenia`
- WHEN the bridge publishes a plant state
- THEN the topic MUST start with `gardenia/S/`

#### Scenario: Foreign-space command is rejected
- GIVEN a message arrives on a topic whose space segment is not a bridged space
- WHEN the command router receives it
- THEN it MUST NOT dispatch any command

---

### Requirement: MQTT Discovery Publishing

For each bridged space the bridge MUST publish Home Assistant MQTT Discovery
config payloads (retained) so HA auto-creates entities for plants (`last_watered`,
`next_care_due`, `health`), per-space task counts, harvests, inventory levels, and
weather. Each entity MUST have a stable `unique_id` and reference a `device`
grouping, and config payloads MUST be published with the retain flag.

#### Scenario: Plant entity is discoverable
- GIVEN a bridged space with one plant
- WHEN the bridge runs discovery
- THEN a retained config topic MUST be published under the discovery prefix
- AND its payload MUST contain a stable `unique_id` and a `state_topic` under the space prefix

#### Scenario: Removing an entity clears discovery
- GIVEN a previously discovered entity whose source no longer exists
- WHEN reconciliation runs
- THEN the bridge MUST publish an empty retained payload to that entity's config topic

---

### Requirement: State Publishing via Reconciliation

The bridge MUST publish current state for every discovered entity (retained) on
application bootstrap and on a configurable interval (`HA_RECONCILE_INTERVAL`).
State MUST be derived from read view models obtained through ports — never by
importing another context's domain or application.

#### Scenario: State published on bootstrap
- GIVEN an enabled bridge and a reachable broker
- WHEN the application finishes starting
- THEN the bridge MUST have published a retained state value for each discovered entity

#### Scenario: State refreshed on interval
- GIVEN the bridge has been running
- WHEN `HA_RECONCILE_INTERVAL` elapses
- THEN the bridge MUST re-publish current state derived from fresh view models

---

### Requirement: Bridge Availability

The bridge MUST publish an availability topic per bridged space, set `online` when
connected and `offline` via the broker Last-Will-and-Testament when the connection
drops, and reference that topic as the `availability_topic` in discovery payloads.

#### Scenario: Availability reflects connection
- GIVEN an enabled, connected bridge
- WHEN it completes connection
- THEN it MUST publish `online` to the space availability topic
- AND the broker MUST be configured to publish `offline` (LWT) if the bridge disconnects

---

### Requirement: Boundary-Safe Cross-Context Access

The bridge's domain, application, and transport layers MUST NOT import any other
bounded context's domain or application. All reads and writes to other contexts
MUST go through a port defined in `home-assistant/application/ports` and an adapter
in `home-assistant/infrastructure/adapters` that dispatches through the
`QueryBus`/`CommandBus`.

#### Scenario: Reads go through an adapter
- GIVEN the bridge needs plant state
- WHEN it obtains that state
- THEN it MUST call a port whose adapter dispatches a query via `QueryBus`
- AND no bridge file outside `infrastructure/adapters` MUST import another context

---

### Requirement: Command Topic Handling (HA writes Gardenia)

The bridge MUST subscribe to per-space command topics and, on a valid message,
dispatch the corresponding Gardenia command inside that space's tenant context.
At minimum it MUST support recording a watering (care-log), recording a harvest,
and adjusting inventory quantity. Writable actions MUST be exposed as HA `button`
or `number` entities via discovery with a `command_topic`.

#### Scenario: Button press records a watering
- GIVEN a discovered "mark watered" button for a plant in space `S`
- WHEN HA publishes to that button's command topic
- THEN the bridge MUST dispatch `CreateCareLogEntryCommand` for that plant within space `S`

#### Scenario: Number entity adjusts inventory
- GIVEN a discovered inventory `number` entity in space `S`
- WHEN HA publishes a new value to its command topic
- THEN the bridge MUST dispatch `AdjustInventoryQuantityCommand` within space `S`

#### Scenario: Malformed payload is ignored
- GIVEN a command topic message with an unparseable payload
- WHEN the router receives it
- THEN it MUST NOT dispatch a command
- AND it MUST log the rejection

---

### Requirement: Sensor Ingest Routing

When sensor ingest is enabled, the bridge MUST subscribe to configured HA sensor
state topics, map each topic to a Gardenia plant, and dispatch a
`RecordSensorReadingCommand` within the owning space. Topics that cannot be mapped
to a plant MUST be ignored without error.

#### Scenario: Soil-moisture reading is recorded
- GIVEN a configured mapping from an HA sensor topic to plant `P` in space `S`
- WHEN HA publishes a numeric value on that topic
- THEN the bridge MUST dispatch `RecordSensorReadingCommand` for plant `P` in space `S`

#### Scenario: Unmapped sensor topic is ignored
- GIVEN a sensor message on a topic with no plant mapping
- WHEN the ingest router receives it
- THEN it MUST NOT dispatch a command
- AND it MUST NOT raise an error
