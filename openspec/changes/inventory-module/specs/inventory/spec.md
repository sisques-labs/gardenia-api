# Inventory — Tenant-scoped consumable supplies stock

**Source change:** inventory-module  
**Created:** 2026-06-20

---

## Requirements

### Requirement: InventoryItemAggregate Fields and Validation

The `InventoryItemAggregate` MUST carry: `id` (UUID, generated), `itemType`
(`InventoryItemTypeEnum`), `name` (non-empty string, trimmed, max 200 chars),
`brand` (optional string, max 200 chars), `notes` (optional string, max 2000
chars), `quantity` (decimal, ≥ 0), `unit` (`InventoryUnitEnum`),
`lowStockThreshold` (optional decimal, ≥ 0), `acquiredAt` (optional Date),
`expiresAt` (optional Date), `userId` (UUID, the creator), `spaceId` (UUID,
tenant scope), `createdAt`, `updatedAt`.

The aggregate MUST NOT carry `plantSpeciesId` or any link to the plant-species
catalog.

The system MUST reject `name` that is empty or whitespace-only after trim.
The system MUST reject `quantity` that is `< 0`.
The system MUST reject `lowStockThreshold` that is `< 0` when provided.

#### Scenario: Valid inventory item aggregate

- GIVEN itemType=SEEDS, a non-empty name, quantity=5, unit=PACKETS, an optional expiresAt
- WHEN an `InventoryItemAggregate` is built
- THEN all fields are set and the aggregate is valid

#### Scenario: Empty name rejected

- GIVEN a whitespace-only name
- WHEN an `InventoryItemAggregate` is built
- THEN a domain validation error is thrown

#### Scenario: Negative quantity rejected

- GIVEN quantity=-1
- WHEN an `InventoryItemAggregate` is built
- THEN a domain validation error is thrown

#### Scenario: Negative low-stock threshold rejected

- GIVEN lowStockThreshold=-2
- WHEN an `InventoryItemAggregate` is built
- THEN a domain validation error is thrown

#### Scenario: Optional fields omitted

- GIVEN no brand, notes, lowStockThreshold, acquiredAt, or expiresAt
- WHEN an `InventoryItemAggregate` is built
- THEN those fields are undefined and the aggregate is valid

---

### Requirement: InventoryItemTypeEnum

The system MUST support exactly: `SEEDS`, `FERTILIZER`, `SUBSTRATE`,
`PHYTOSANITARY`, `OTHER`.

`POT` and `TOOL` MUST NOT be accepted. Any value outside the set MUST be rejected
at the VO level.

#### Scenario: Valid item type accepted

- GIVEN item type value `"FERTILIZER"`
- WHEN `InventoryItemTypeValueObject` is constructed
- THEN no error is thrown

#### Scenario: Removed type rejected

- GIVEN item type value `"POT"`
- WHEN `InventoryItemTypeValueObject` is constructed
- THEN a domain validation error is thrown

#### Scenario: Unknown type rejected

- GIVEN item type value `"VEHICLE"`
- WHEN `InventoryItemTypeValueObject` is constructed
- THEN a domain validation error is thrown

---

### Requirement: InventoryUnitEnum

The system MUST support exactly: `UNITS`, `G`, `KG`, `ML`, `L`, `PACKETS`.

Any value outside this set MUST be rejected at the VO level.

#### Scenario: Valid unit accepted

- GIVEN unit value `"G"`
- WHEN `InventoryUnitValueObject` is constructed
- THEN no error is thrown

#### Scenario: Invalid unit rejected

- GIVEN unit value `"TONS"`
- WHEN `InventoryUnitValueObject` is constructed
- THEN a domain validation error is thrown

---

### Requirement: CreateInventoryItem Command

Any authenticated space member MAY create an inventory item.

The command MUST accept `itemType`, `name`, `quantity`, `unit`, and optional
`brand`, `notes`, `lowStockThreshold`, `acquiredAt`, `expiresAt`. `userId` MUST
come from `@CurrentUser`. `spaceId` MUST come from `SpaceContext` ALS — never
from the request payload.

On success the handler MUST emit `InventoryItemCreated`, persist the aggregate,
and return `inventoryItemId`.

#### Scenario: Happy path

- GIVEN an authenticated user who is a member of the active space
- WHEN `CreateInventoryItem` is dispatched with valid fields
- THEN an `InventoryItemAggregate` is persisted, `InventoryItemCreated` is emitted, and `inventoryItemId` is returned

#### Scenario: Invalid name rejected

- GIVEN an authenticated user in an active space
- WHEN `CreateInventoryItem` is dispatched with an empty `name`
- THEN a 400 Bad Request is returned and no aggregate is persisted

#### Scenario: Invalid item type rejected

- GIVEN itemType=`"POT"`
- WHEN `CreateInventoryItem` is dispatched
- THEN a 400 Bad Request is returned

#### Scenario: Negative quantity rejected

- GIVEN quantity=-1
- WHEN `CreateInventoryItem` is dispatched
- THEN a 400 Bad Request is returned

---

### Requirement: UpdateInventoryItem Command

Any authenticated space member MAY update any inventory item in the space.

The command MUST accept optional `itemType`, `name`, `brand`, `notes`, `unit`,
`lowStockThreshold`, `acquiredAt`, `expiresAt`. At least one field MUST be
provided; a no-op update MUST still succeed. `quantity` MUST NOT be mutated by
this command (use `AdjustInventoryItemQuantity`).

The handler MUST load the item from the tenant-scoped repository; if not found,
throw `InventoryItemNotFoundException` (404).

On success the handler MUST emit `InventoryItemUpdated` and persist, plus a
per-field change event only for each field whose value actually changed.

#### Scenario: Member updates any item

- GIVEN an authenticated user (not the original creator) who is a member of the space
- WHEN `UpdateInventoryItem` is dispatched targeting an item in that space
- THEN the item is updated and `InventoryItemUpdated` is emitted

#### Scenario: Clearing an optional field

- GIVEN an item with a `notes` value
- WHEN `UpdateInventoryItem` is dispatched setting `notes` to empty/null
- THEN `notes` becomes undefined and the update succeeds

#### Scenario: Item not found

- GIVEN an inventoryItemId that does not exist in the active space
- WHEN `UpdateInventoryItem` is dispatched
- THEN `InventoryItemNotFoundException` is thrown and 404 is returned

---

### Requirement: AdjustInventoryItemQuantity Command

Any authenticated space member MAY adjust the quantity of any inventory item in
the space to consume or restock it.

The command MUST accept `inventoryItemId`, a signed `delta` (decimal, non-zero),
and a required `reason` (non-empty string, max 500 chars). A positive `delta`
restocks; a negative `delta` consumes.

The resulting quantity MUST be `max(0, currentQuantity + delta)` — it MUST NOT go
negative; a consumption larger than the current stock leaves the quantity at `0`.

The handler MUST load the item via the tenant-scoped repository; if not found,
throw `InventoryItemNotFoundException` (404). On success it MUST emit
`InventoryItemQuantityAdjusted` carrying `delta`, `reason`, and the resulting
`quantity`, then persist.

#### Scenario: Consume reduces stock

- GIVEN an item with quantity=10
- WHEN `AdjustInventoryItemQuantity` is dispatched with delta=-3, reason="sowed lettuce"
- THEN the item quantity becomes 7 and `InventoryItemQuantityAdjusted` is emitted with delta=-3

#### Scenario: Restock increases stock

- GIVEN an item with quantity=2
- WHEN `AdjustInventoryItemQuantity` is dispatched with delta=5, reason="bought more"
- THEN the item quantity becomes 7

#### Scenario: Over-consumption clamps to zero

- GIVEN an item with quantity=2
- WHEN `AdjustInventoryItemQuantity` is dispatched with delta=-5
- THEN the item quantity becomes 0 (never negative)

#### Scenario: Missing reason rejected

- GIVEN delta=-1 and an empty reason
- WHEN `AdjustInventoryItemQuantity` is dispatched
- THEN a 400 Bad Request is returned

#### Scenario: Item not found

- GIVEN an inventoryItemId that does not exist in the active space
- WHEN `AdjustInventoryItemQuantity` is dispatched
- THEN `InventoryItemNotFoundException` is thrown and 404 is returned

---

### Requirement: DeleteInventoryItem Command

Any authenticated space member MAY delete any inventory item in the space.

The handler MUST emit `InventoryItemDeleted` before deleting from persistence.

#### Scenario: Member deletes any item

- GIVEN an authenticated user who is a member of the space
- WHEN `DeleteInventoryItem` is dispatched
- THEN the item is deleted and `InventoryItemDeleted` is emitted

#### Scenario: Item not found

- GIVEN an inventoryItemId that does not exist in the active space
- WHEN `DeleteInventoryItem` is dispatched
- THEN `InventoryItemNotFoundException` is thrown and 404 is returned

---

### Requirement: InventoryItemFindById Query

Returns a single `InventoryItemViewModel` for the given id, scoped to the active
space.

#### Scenario: Found in space

- GIVEN an inventoryItemId that exists in the active space
- WHEN `InventoryItemFindById` is dispatched
- THEN an `InventoryItemViewModel` is returned with all fields

#### Scenario: Not found or wrong space

- GIVEN an inventoryItemId that does not exist in the active space
- WHEN `InventoryItemFindById` is dispatched
- THEN `InventoryItemNotFoundException` is thrown and 404 is returned

---

### Requirement: InventoryItemFindByCriteria Query

Returns a paginated list of `InventoryItemViewModel` for the active space.

Supported filters (all optional):
- `itemType`: exact match on `InventoryItemTypeEnum` value
- `name`: partial case-insensitive match (ILIKE `%value%`)
- `lowStock`: when `true`, returns only items where `lowStockThreshold` is set
  AND `quantity <= lowStockThreshold`
- `expiringBefore`: returns only items where `expiresAt` is set AND
  `expiresAt <= value`

Default pagination: `page=1`, `limit=20`, max `limit=100`.

An empty result MUST return 200 with an empty list, not 404.

#### Scenario: Returns items for active space only

- GIVEN items in Space A and Space B
- WHEN `InventoryItemFindByCriteria` is dispatched under Space A context
- THEN only Space A items are returned

#### Scenario: itemType filter

- GIVEN items of type SEEDS and FERTILIZER
- WHEN criteria `itemType=SEEDS` is applied
- THEN only SEEDS items are returned

#### Scenario: name partial filter

- GIVEN items named "Lettuce seeds" and "Tomato fertilizer"
- WHEN criteria `name="lettuce"` is applied
- THEN only "Lettuce seeds" is returned

#### Scenario: low-stock filter

- GIVEN item A (quantity=1, lowStockThreshold=3), item B (quantity=10, lowStockThreshold=3), and item C (quantity=0, lowStockThreshold=null)
- WHEN criteria `lowStock=true` is applied
- THEN only item A is returned (B above threshold, C has no threshold)

#### Scenario: expiring-soon filter

- GIVEN item X (expiresAt=2026-07-01), item Y (expiresAt=2026-12-01), item Z (expiresAt=null)
- WHEN criteria `expiringBefore=2026-08-01` is applied
- THEN only item X is returned

#### Scenario: Empty result returns 200

- GIVEN no items in the active space
- WHEN `InventoryItemFindByCriteria` is dispatched
- THEN 200 is returned with an empty list

---

### Requirement: REST Transport

The system MUST expose the following endpoints, all guarded by `JwtAuthGuard` and
`SpaceGuard`:

| Method | Path | Handler | Success Code |
|--------|------|---------|--------------|
| POST | /inventory-items | CreateInventoryItem | 201 |
| GET | /inventory-items | InventoryItemFindByCriteria | 200 |
| GET | /inventory-items/:id | InventoryItemFindById | 200 |
| PATCH | /inventory-items/:id | UpdateInventoryItem | 200 |
| POST | /inventory-items/:id/adjust | AdjustInventoryItemQuantity | 200 |
| DELETE | /inventory-items/:id | DeleteInventoryItem | 200 |

All endpoints MUST require the `X-Space-ID` header. `@CurrentUser` supplies
`userId`. Response bodies MUST use `InventoryItemRestResponseDto` mapped from
`InventoryItemViewModel`.

---

### Requirement: GraphQL Transport

The system MUST expose GraphQL operations guarded by `JwtAuthGuard` and
`SpaceGuard`:

**Queries**: `inventoryItem(id: ID!): InventoryItemType`,
`inventoryItems(criteria: InventoryItemCriteriaInput): PaginatedInventoryItemsResult`

**Mutations**: `createInventoryItem(input: CreateInventoryItemInput!):
MutationResponseDto`, `updateInventoryItem(input: UpdateInventoryItemInput!):
MutationResponseDto`, `adjustInventoryItemQuantity(input:
AdjustInventoryItemQuantityInput!): MutationResponseDto`,
`deleteInventoryItem(id: ID!): MutationResponseDto`

`InventoryItemType` MUST include all `InventoryItemViewModel` fields.
`InventoryItemTypeEnum` and `InventoryUnitEnum` MUST be registered with
`registerEnumType`.

Schema MUST be generated via `autoSchemaFile` (code-first). Both resolvers MUST
dispatch exclusively via `CommandBus`/`QueryBus`.

---

### Requirement: Tenant Isolation

All inventory reads and writes MUST be scoped to the active `spaceId` via
`createTenantRepository`. An item created under Space A MUST NOT be visible under
Space B.

#### Scenario: Cross-tenant invisibility

- GIVEN an item created under Space A
- WHEN `InventoryItemFindById` is dispatched under Space B context with the same id
- THEN `InventoryItemNotFoundException` is thrown

---

### Requirement: No Cross-Context Coupling

The `inventory` bounded context MUST NOT import from `@contexts/plants/`,
`@contexts/plant-species/`, `@contexts/care-log/`, or any other bounded context.
There MUST be no `plantSpeciesId` field and no consumption hook wiring in this
change.

#### Scenario: No forbidden imports

- GIVEN the source tree under `src/contexts/inventory/`
- WHEN scanned for imports
- THEN no import path matches `@contexts/plants/`, `@contexts/plant-species/`, or `@contexts/care-log/`

---

## Out of Scope

- `plantSpeciesId` link to the plant-species catalog (sowing-calendar hint, #220)
- `POT` and `TOOL` item types
- Cross-context consumption hooks (sowing #218, care-log fertilizing #216)
- Low-stock / expiry notifications (#224) and dashboard attention list (#227)
- Separate adjustment-ledger table / per-adjustment history rows
- Per-item ownership-based access control
