# Nodes Specification

## Purpose

This spec governs the `nodes` bounded context — the IoT integration layer of
gardenia-api. It defines the bridge claim/pairing flow, node lifecycle
tracking, telemetry/command-ack ingestion via a new Kafka consumer, and
outbound node commands. `gardenia-bridge` envelope changes (`bridgeId`,
`commandId`) and the `gardenia-web` UI are explicitly OUT OF SCOPE.

## Requirements

### Requirement: BridgeAggregate Bootstrap

The system MUST allow an unauthenticated bridge to announce itself with a
self-generated `bridgeId` and receive a pairing code.

A bootstrap request for an unknown `bridgeId` MUST create a `BridgeAggregate`
in `unclaimed` status with a freshly-generated pairing code.

A bootstrap request for an already-`unclaimed` `bridgeId` MUST rotate the
pairing code (idempotent re-announce, e.g. after a reboot before claiming).

A bootstrap request for an already-`active` `bridgeId` MUST be a no-op that
does NOT return a usable pairing code and does NOT change bridge state.

The pairing code MUST be logged server-side and MUST NOT be delivered by any
other channel in this change.

#### Scenario: Fresh bridge bootstraps

- GIVEN a `bridgeId` that has never been seen before
- WHEN `POST /nodes/bridges/bootstrap` is called with that `bridgeId`
- THEN a BridgeAggregate is created in `unclaimed` status with a pairing code, and the code is logged

#### Scenario: Unclaimed bridge re-bootstraps

- GIVEN a bridge already in `unclaimed` status with pairing code A
- WHEN it bootstraps again
- THEN a new pairing code B is generated and code A no longer works for claiming

#### Scenario: Claimed bridge re-bootstraps

- GIVEN a bridge already in `active` status
- WHEN it bootstraps again
- THEN the bridge remains `active` and no new pairing code is issued

---

### Requirement: BridgeAggregate Claim

The system MUST allow only an authenticated, space-scoped user to claim an
`unclaimed` bridge into their active Space using its pairing code.

The system MUST reject a claim when the supplied code does not match the
bridge's current pairing code.

The system MUST reject a claim when the bridge is not in `unclaimed` status.

On success the bridge MUST transition to `active`, its `spaceId` MUST be set
to the caller's active Space, and its pairing code MUST be cleared.

#### Scenario: Successful claim

- GIVEN an unclaimed bridge with a valid pairing code
- WHEN an authenticated space member calls the claim mutation with the correct code
- THEN the bridge becomes `active`, is linked to the caller's Space, and BridgeClaimed is emitted

#### Scenario: Wrong pairing code

- GIVEN an unclaimed bridge
- WHEN claim is called with an incorrect code
- THEN InvalidPairingCodeException is thrown and a 400 is returned

#### Scenario: Already-claimed bridge

- GIVEN a bridge already `active` in some Space
- WHEN claim is called again (any code)
- THEN BridgeAlreadyClaimedException is thrown and a 409 is returned

---

### Requirement: NodeAggregate Lifecycle

The system MUST create a `NodeAggregate` the first time a `nodeId` is seen
in either a telemetry or heartbeat message, inheriting `spaceId` from the
owning bridge (resolved via `bridgeId`).

The system MUST NOT create a node whose owning `bridgeId` is unknown or
still `unclaimed` — such a message MUST be logged and dropped without
raising an error that would stop the consumer.

A heartbeat message MUST flip a node's status to `online` (if not already)
and update `lastSeenAt`. Flipping status MUST emit `NodeWentOnline` exactly
once per transition (not once per heartbeat).

#### Scenario: First-seen node via telemetry

- GIVEN a `nodeId` never seen before, relayed by a claimed, active bridge
- WHEN a telemetry message for that node arrives
- THEN a NodeAggregate is created with spaceId inherited from the bridge, and NodeCreated is emitted

#### Scenario: Message from an unclaimed bridge's node

- GIVEN a `bridgeId` still in `unclaimed` status
- WHEN a telemetry/heartbeat message referencing that bridge arrives
- THEN no NodeAggregate is created, the message is logged and dropped, and the consumer keeps running

#### Scenario: Heartbeat flips status once

- GIVEN a node currently `offline`
- WHEN two consecutive heartbeats arrive
- THEN the node becomes `online` after the first heartbeat, NodeWentOnline is emitted exactly once, and the second heartbeat only updates lastSeenAt

---

### Requirement: Telemetry Ingestion

The system MUST persist every valid telemetry message as a
`NodeTelemetryReading` row, scoped to the space of the reporting node's
bridge.

`sensorType` MUST be one of the closed `SensorTypeEnum` catalog values;
unknown types MUST fail parsing and MUST NOT be persisted.

Battery level MUST NOT be persisted as a `NodeTelemetryReading` in this
change.

#### Scenario: Valid telemetry persisted

- GIVEN a telemetry message with a recognized sensorType and numeric value
- WHEN it is consumed
- THEN a NodeTelemetryReading row is inserted with the correct spaceId/nodeId/recordedAt

#### Scenario: Unknown sensorType rejected

- GIVEN a telemetry message with a sensorType outside the closed catalog
- WHEN it is consumed
- THEN parsing fails, the message is logged and dropped, and no row is inserted

---

### Requirement: Command Ack Ingestion

The system MUST persist every command-ack message as a `NodeCommandAck`
row, including when `commandId` is absent (nullable field, pending the
`gardenia-bridge` envelope change).

#### Scenario: Ack with commandId

- GIVEN a command-ack message carrying a commandId
- WHEN it is consumed
- THEN a NodeCommandAck row is inserted with that commandId

#### Scenario: Ack without commandId (current gardenia-bridge behavior)

- GIVEN a command-ack message with no commandId field
- WHEN it is consumed
- THEN a NodeCommandAck row is inserted with commandId = null

---

### Requirement: SendNodeCommand

The system MUST allow only an authenticated space member to send a command
to a node that belongs to their active Space.

The system MUST reject sending a command to a node that does not exist in
the caller's active Space (cross-space nodes MUST be invisible, not merely
forbidden).

On success the system MUST generate a `commandId`, produce the command to
the `gardenia-bridge.commands` Kafka topic keyed by `nodeId`, and return the
`commandId` to the caller.

#### Scenario: Command sent to own-space node

- GIVEN an authenticated user whose active Space owns nodeId N
- WHEN SendNodeCommand is dispatched for N
- THEN a commandId is generated, a message is produced to gardenia-bridge.commands, and the commandId is returned

#### Scenario: Command rejected for cross-space node

- GIVEN nodeId N belongs to Space A
- WHEN a user with active Space B dispatches SendNodeCommand for N
- THEN NodeNotFoundException is thrown and a 404 is returned

---

### Requirement: Kafka Consumer Resilience

The system MUST NOT crash or stop consuming a topic when a single message
fails to parse or its handler throws.

The system MUST be a no-op (no Kafka client created, no topics subscribed)
when `KAFKA_ENABLED=false`, so the app boots without a broker.

#### Scenario: Malformed message does not stop the consumer

- GIVEN the telemetry consumer is running
- WHEN a malformed (unparsable) message arrives, followed by a valid one
- THEN the malformed message is logged and dropped, and the valid message that follows is still processed

#### Scenario: Kafka disabled

- GIVEN `KAFKA_ENABLED=false`
- WHEN the app boots
- THEN no Kafka consumer or producer connections are attempted and the app starts successfully

---

### Requirement: Queries — Tenant Isolation

`NodeFindById`/`NodeFindByCriteria`/`NodeTelemetryReadingFindByCriteria`
MUST only return data belonging to the caller's active Space.

`BridgeFindById`/`BridgeFindByCriteria` MUST only return bridges whose
`spaceId` matches the caller's active Space; an `unclaimed` bridge (`spaceId
= null`) MUST be invisible to every tenant-scoped query.

#### Scenario: Cross-space node invisible

- GIVEN a node exists in Space A
- WHEN a user with active Space B queries NodeFindById for it
- THEN NodeNotFoundException is thrown

#### Scenario: Unclaimed bridge invisible to tenant queries

- GIVEN a bridge in `unclaimed` status (spaceId null)
- WHEN any authenticated user queries BridgeFindByCriteria in any Space
- THEN the unclaimed bridge does not appear in results

---

### Requirement: REST Transport — Bootstrap

`POST /nodes/bridges/bootstrap` MUST NOT require a JWT or an `X-Space-ID`
header (`@SkipSpace()`).

#### Scenario: Bootstrap without credentials

- GIVEN no Authorization header and no X-Space-ID header
- WHEN POST /nodes/bridges/bootstrap is called with a valid bridgeId
- THEN the request succeeds (200) and a pairing code is generated

---

### Requirement: GraphQL Transport

`bridgeClaim`, `nodeSendCommand`, and all find queries MUST require a valid
JWT and active Space membership (`JwtAuthGuard` + `SpaceGuard`). All
resolvers MUST dispatch exclusively via `CommandBus`/`QueryBus`.

---

## Non-Functional Requirements

- All authenticated endpoints (everything except bootstrap) MUST require a
  valid JWT and active Space membership.
- Test coverage MUST be ≥ 80% for the `nodes` context across unit,
  integration, and E2E layers.
- Kafka consumer/producer MUST both be no-ops when `KAFKA_ENABLED=false`.

---

## Domain Events

| Event | Payload |
|-------|---------|
| `BridgeBootstrapped` | `{ bridgeId, pairingCode, status }` |
| `BridgeClaimed` | `{ bridgeId, spaceId, status }` |
| `NodeCreated` | `{ nodeId, spaceId, bridgeId, status }` |
| `NodeWentOnline` | `{ nodeId, spaceId, lastSeenAt }` |
| `NodeWentOffline` | `{ nodeId, spaceId, lastSeenAt }` |

All events extend `BaseEvent<TData>`. `NodeTelemetryReading`/
`NodeCommandAck` do NOT emit domain events (insert-only records, no
subscribers in this change).

---

## Error Scenarios

| Exception | HTTP Code | Trigger |
|-----------|-----------|---------|
| `BridgeNotFoundException` | 404 | Bridge does not exist (claim path) |
| `BridgeAlreadyClaimedException` | 409 | Claim attempted on a non-`unclaimed` bridge |
| `InvalidPairingCodeException` | 400 | Wrong/malformed pairing code |
| `NodeNotFoundException` | 404 | Node does not exist in the active Space |

---

## Out of Scope

- `gardenia-bridge` envelope changes (`bridgeId`, `commandId` fields) —
  separate change in that repo.
- `gardenia-web` claim/dashboard UI — separate OpenSpec proposal.
- Pairing code display beyond server logs.
- `commandId` correlation enforcement — nullable until the bridge ships it.
- Node/bridge offline sweep job (`markOffline()` exists but nothing calls
  it on a timer in this change).
- Actuator command catalog/validation beyond an opaque `commandType`.
- Battery level as `NodeTelemetryReading`.
