# Harvests — Tenant-scoped harvest log

**Source change:** harvest-module  
**Created:** 2026-06-12

---

## Requirements

### Requirement: HarvestAggregate Fields and Validation

The `HarvestAggregate` MUST carry: `id` (UUID, generated), `cropType` (non-empty string, trimmed, max 200 chars), `quantity` (positive decimal, > 0), `unit` (`HarvestUnitEnum`), `harvestedAt` (Date, required), `userId` (UUID, the recorder), `spaceId` (UUID, tenant scope), `createdAt`, `updatedAt`.

The aggregate MUST NOT carry `plantId` or `plantSpeciesId`.

The system MUST reject `cropType` that is empty or whitespace-only after trim.
The system MUST reject `quantity` that is ≤ 0.
`harvestedAt` MUST be provided; future dates are allowed (pre-recording a planned harvest).

#### Scenario: Valid harvest aggregate

- GIVEN a non-empty cropType, quantity=2.5, unit=KG, a valid harvestedAt
- WHEN a `HarvestAggregate` is built
- THEN all fields are set and the aggregate is valid

#### Scenario: Empty cropType rejected

- GIVEN a whitespace-only cropType
- WHEN a `HarvestAggregate` is built
- THEN a domain validation error is thrown

#### Scenario: Zero or negative quantity rejected

- GIVEN quantity=0 or quantity=-1
- WHEN a `HarvestAggregate` is built
- THEN a domain validation error is thrown

---

### Requirement: HarvestUnitEnum

The system MUST support exactly: `KG`, `G`, `PIECES`, `LITERS`, `ML`, `BUNCHES`.

Any value outside this set MUST be rejected at the VO level.

#### Scenario: Valid unit accepted

- GIVEN unit value `"KG"`
- WHEN `HarvestUnitValueObject` is constructed
- THEN no error is thrown

#### Scenario: Invalid unit rejected

- GIVEN unit value `"TONS"`
- WHEN `HarvestUnitValueObject` is constructed
- THEN a domain validation error is thrown

---

### Requirement: CreateHarvest Command

Any authenticated space member MAY create a harvest.

The command MUST accept `cropType`, `quantity`, `unit`, `harvestedAt`. `userId` MUST come from `@CurrentUser`. `spaceId` MUST come from `SpaceContext` ALS — never from the request payload.

On success the handler MUST emit `HarvestCreated`, persist the aggregate, and return `harvestId`.

#### Scenario: Happy path

- GIVEN an authenticated user who is a member of the active space
- WHEN `CreateHarvest` is dispatched with valid fields
- THEN a `HarvestAggregate` is persisted, `HarvestCreated` is emitted, and `harvestId` is returned

#### Scenario: Invalid cropType rejected

- GIVEN an authenticated user in an active space
- WHEN `CreateHarvest` is dispatched with an empty `cropType`
- THEN a 400 Bad Request is returned and no aggregate is persisted

#### Scenario: Invalid quantity rejected

- GIVEN quantity=0
- WHEN `CreateHarvest` is dispatched
- THEN a 400 Bad Request is returned

---

### Requirement: UpdateHarvest Command

Any authenticated space member MAY update any harvest in the space.

The command MUST accept optional `cropType`, `quantity`, `unit`, `harvestedAt`. At least one field MUST be provided; a no-op update MUST still succeed.

The handler MUST load the harvest from the tenant-scoped repository; if not found, throw `HarvestNotFoundException` (404).

On success the handler MUST emit `HarvestUpdated` and persist.

#### Scenario: Member updates any harvest

- GIVEN an authenticated user (not the original recorder) who is a member of the space
- WHEN `UpdateHarvest` is dispatched targeting a harvest in that space
- THEN the harvest is updated and `HarvestUpdated` is emitted

#### Scenario: Harvest not found

- GIVEN a harvestId that does not exist in the active space
- WHEN `UpdateHarvest` is dispatched
- THEN `HarvestNotFoundException` is thrown and 404 is returned

---

### Requirement: DeleteHarvest Command

Any authenticated space member MAY delete any harvest in the space.

The handler MUST emit `HarvestDeleted` before deleting from persistence.

#### Scenario: Member deletes any harvest

- GIVEN an authenticated user who is a member of the space
- WHEN `DeleteHarvest` is dispatched
- THEN the harvest is deleted and `HarvestDeleted` is emitted

#### Scenario: Harvest not found

- GIVEN a harvestId that does not exist in the active space
- WHEN `DeleteHarvest` is dispatched
- THEN `HarvestNotFoundException` is thrown and 404 is returned

---

### Requirement: HarvestFindById Query

Returns a single `HarvestViewModel` for the given id, scoped to the active space.

#### Scenario: Found in space

- GIVEN a harvestId that exists in the active space
- WHEN `HarvestFindById` is dispatched
- THEN a `HarvestViewModel` is returned with all fields

#### Scenario: Not found or wrong space

- GIVEN a harvestId that does not exist in the active space
- WHEN `HarvestFindById` is dispatched
- THEN `HarvestNotFoundException` is thrown and 404 is returned

---

### Requirement: HarvestFindByCriteria Query

Returns a paginated list of `HarvestViewModel` for the active space.

Supported filters (all optional):
- `cropType`: partial case-insensitive match (ILIKE `%value%`)
- `unit`: exact match on `HarvestUnitEnum` value
- `dateFrom`: inclusive lower bound on `harvestedAt`
- `dateTo`: inclusive upper bound on `harvestedAt`

Default pagination: `page=1`, `limit=20`, max `limit=100`.

An empty result MUST return 200 with an empty list, not 404.

#### Scenario: Returns harvests for active space only

- GIVEN harvests in Space A and Space B
- WHEN `HarvestFindByCriteria` is dispatched under Space A context
- THEN only Space A harvests are returned

#### Scenario: cropType partial filter

- GIVEN harvests with cropType "Tomate Cherry" and "Pepino"
- WHEN criteria `cropType="tomate"` is applied
- THEN only "Tomate Cherry" is returned

#### Scenario: unit filter

- GIVEN harvests with unit KG and PIECES
- WHEN criteria `unit=KG` is applied
- THEN only KG harvests are returned

#### Scenario: dateFrom / dateTo range filter

- GIVEN harvests on 2026-06-01, 2026-06-10, 2026-06-20
- WHEN criteria `dateFrom=2026-06-05`, `dateTo=2026-06-15` is applied
- THEN only the 2026-06-10 harvest is returned

#### Scenario: Empty result returns 200

- GIVEN no harvests in the active space
- WHEN `HarvestFindByCriteria` is dispatched
- THEN 200 is returned with an empty list

---

### Requirement: REST Transport

The system MUST expose the following endpoints, all guarded by `JwtAuthGuard` and `SpaceGuard`:

| Method | Path | Handler | Success Code |
|--------|------|---------|--------------|
| POST | /harvests | CreateHarvest | 201 |
| GET | /harvests | HarvestFindByCriteria | 200 |
| GET | /harvests/:id | HarvestFindById | 200 |
| PATCH | /harvests/:id | UpdateHarvest | 200 |
| DELETE | /harvests/:id | DeleteHarvest | 200 |

All endpoints MUST require `X-Space-ID` header. `@CurrentUser` supplies `userId`. Response bodies MUST use `HarvestRestResponseDto` mapped from `HarvestViewModel`.

---

### Requirement: GraphQL Transport

The system MUST expose GraphQL operations guarded by `JwtAuthGuard` and `SpaceGuard`:

**Queries**: `harvest(id: ID!): HarvestType`, `harvests(criteria: HarvestCriteriaInput): PaginatedHarvestsResult`

**Mutations**: `createHarvest(input: CreateHarvestInput!): MutationResponseDto`, `updateHarvest(input: UpdateHarvestInput!): MutationResponseDto`, `deleteHarvest(id: ID!): MutationResponseDto`

`HarvestType` MUST include all `HarvestViewModel` fields. `HarvestUnitEnum` MUST be registered with `registerEnumType`.

Schema MUST be generated via `autoSchemaFile` (code-first). Both resolvers MUST dispatch exclusively via `CommandBus`/`QueryBus`.

---

### Requirement: Tenant Isolation

All harvest reads and writes MUST be scoped to the active `spaceId` via `createTenantRepository`. A harvest created under Space A MUST NOT be visible under Space B.

#### Scenario: Cross-tenant invisibility

- GIVEN a harvest created under Space A
- WHEN `HarvestFindById` is dispatched under Space B context with the same harvestId
- THEN `HarvestNotFoundException` is thrown

---

## Out of Scope

- Link to `PlantAggregate` or `PlantSpeciesAggregate`
- Aggregation / reporting queries (totals, trends)
- Harvest image upload
- Per-harvest ownership-based access control
