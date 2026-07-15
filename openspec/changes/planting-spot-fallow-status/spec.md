# Spec: Planting Spot Fallow Status

**Source change:** planting-spot-fallow-status
**Modifies capability:** planting-spots

---

## Requirements

### Requirement: PlantingSpotStatusEnum

The system MUST support exactly two status values: `ACTIVE` and `FALLOW`. Any
value outside this set MUST be rejected at the value object level.

#### Scenario: Valid status accepted

- GIVEN status value `"fallow"`
- WHEN `PlantingSpotStatusValueObject` is constructed
- THEN no error is thrown

#### Scenario: Unknown status rejected

- GIVEN status value `"dormant"`
- WHEN `PlantingSpotStatusValueObject` is constructed
- THEN a domain validation error is thrown

---

### Requirement: New Planting Spots Default to Active

Every `PlantingSpot` created via `CreatePlantingSpot` MUST start with
`status = ACTIVE` and `fallowSince = null`, regardless of caller input. Status
and fallowSince MUST NOT be settable through the create command.

#### Scenario: Created spot is active

- GIVEN a valid `CreatePlantingSpot` command
- WHEN the command is dispatched
- THEN the resulting `PlantingSpotAggregate` has `status = ACTIVE` and `fallowSince = null`

---

### Requirement: MarkPlantingSpotFallow Command

Only the owner of a planting spot (its `userId`) MAY mark it fallow. The
command MUST accept only `id`; it MUST NOT accept `fallowSince` or any other
field — `fallowSince` is always derived as the current timestamp at execution
time.

On success the aggregate's `status` becomes `FALLOW`, `fallowSince` is set to
the current time, and `PlantingSpotStatusChanged` is emitted. Marking an
already-`FALLOW` spot fallow again MUST be a no-op: no event, `fallowSince`
unchanged.

#### Scenario: Owner marks an active spot fallow

- GIVEN an authenticated user who owns an `ACTIVE` planting spot
- WHEN `MarkPlantingSpotFallow` is dispatched for that spot
- THEN `status` becomes `FALLOW`, `fallowSince` is set to the current time, and `PlantingSpotStatusChanged` is emitted

#### Scenario: Marking an already-fallow spot is a no-op

- GIVEN a planting spot with `status = FALLOW` and `fallowSince = T`
- WHEN `MarkPlantingSpotFallow` is dispatched for that spot
- THEN `status` remains `FALLOW`, `fallowSince` remains `T`, and no event is emitted

#### Scenario: Non-owner forbidden

- GIVEN an authenticated user who is a space member but not the owner of the spot
- WHEN `MarkPlantingSpotFallow` is dispatched for that spot
- THEN `PlantingSpotForbiddenException` is thrown and 403 is returned

#### Scenario: Spot not found

- GIVEN a planting spot id that does not exist in the active space
- WHEN `MarkPlantingSpotFallow` is dispatched
- THEN `PlantingSpotNotFoundException` is thrown and 404 is returned

---

### Requirement: MarkPlantingSpotActive Command

Only the owner of a planting spot MAY reactivate it. The command MUST accept
only `id`. On success `status` becomes `ACTIVE`, `fallowSince` is reset to
`null`, and `PlantingSpotStatusChanged` is emitted. Reactivating an
already-`ACTIVE` spot MUST be a no-op.

#### Scenario: Owner reactivates a fallow spot

- GIVEN an authenticated user who owns a `FALLOW` planting spot
- WHEN `MarkPlantingSpotActive` is dispatched for that spot
- THEN `status` becomes `ACTIVE`, `fallowSince` becomes `null`, and `PlantingSpotStatusChanged` is emitted

#### Scenario: Reactivating an already-active spot is a no-op

- GIVEN a planting spot with `status = ACTIVE`
- WHEN `MarkPlantingSpotActive` is dispatched for that spot
- THEN `status` remains `ACTIVE` and no event is emitted

#### Scenario: Non-owner forbidden

- GIVEN an authenticated user who is a space member but not the owner of the spot
- WHEN `MarkPlantingSpotActive` is dispatched for that spot
- THEN `PlantingSpotForbiddenException` is thrown and 403 is returned

#### Scenario: Spot not found

- GIVEN a planting spot id that does not exist in the active space
- WHEN `MarkPlantingSpotActive` is dispatched
- THEN `PlantingSpotNotFoundException` is thrown and 404 is returned

---

### Requirement: fallowSince Is Never Client-Settable

`fallowSince` MUST NOT appear as an input field on any command, REST DTO,
GraphQL input type, or MCP tool schema. It is exclusively derived inside
`PlantingSpotAggregate.markFallow()` / `markActive()`.

#### Scenario: fallowSince absent from all write surfaces

- GIVEN the REST `mark-fallow`/`mark-active` bodies, the GraphQL mark mutation inputs, and the MCP mark tool schemas
- WHEN their accepted fields are inspected
- THEN none of them declare a `fallowSince` field

---

### Requirement: UpdatePlantingSpot Command Is Unaffected

`UpdatePlantingSpotCommand` MUST NOT gain a `status` field. Status transitions
are exclusively performed via `MarkPlantingSpotFallow`/`MarkPlantingSpotActive`.

#### Scenario: Update does not change status

- GIVEN a planting spot with `status = ACTIVE`
- WHEN `UpdatePlantingSpot` is dispatched changing `name`
- THEN `status` and `fallowSince` remain unchanged

---

### Requirement: Persistence

The `planting_spots` table MUST gain a `status` column (`varchar(10) NOT NULL
DEFAULT 'active'`) and a `fallow_since` column (`timestamptz NULL`). All
existing rows MUST backfill to `status = 'active'`, `fallow_since = NULL` via
the column default — no explicit data migration step is required.

#### Scenario: Existing spot defaults to active after migration

- GIVEN a `PlantingSpot` row created before this migration
- WHEN the migration is applied
- THEN the row's `status` reads `'active'` and `fallow_since` reads `NULL`

---

### Requirement: Transport Exposure

REST, GraphQL, and MCP MUST each expose `mark-fallow` and `mark-active`
operations as described in the design (dedicated endpoint/mutation/tool per
action, not a generic status field). All three `PlantingSpot` read/response
representations (`PlantingSpotViewModel`, `PlantingSpotResponseDto`,
`PlantingSpotRestResponseDto`) MUST expose both `status` (non-nullable) and
`fallowSince` (nullable) as read-only fields.

#### Scenario: Marking fallow via REST

- GIVEN an authenticated owner and an existing active planting spot
- WHEN `POST /planting-spots/:id/mark-fallow` is called
- THEN the response reflects `status: "fallow"` and a non-null `fallowSince`

#### Scenario: Marking fallow via GraphQL

- GIVEN an authenticated owner and an existing active planting spot
- WHEN `plantingSpotMarkFallow` mutation is called with `{ id }`
- THEN the mutation succeeds and a subsequent `plantingSpotFindById` query returns `status: FALLOW`

#### Scenario: Marking fallow via MCP

- GIVEN an MCP tool context with a valid space/user who owns the spot
- WHEN `planting_spot_mark_fallow` is invoked with `{ id }`
- THEN the tool returns success and the spot's status is persisted as `fallow`
