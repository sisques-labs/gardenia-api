# Inventory Specification — Delta: Bulk Delete

> Delta applied on top of `openspec/changes/inventory-module/specs/inventory/spec.md`
> (baseline not yet archived to `openspec/specs/inventory/spec.md`). Adds a
> `DeleteInventoryItemsBulk` command and its REST/GraphQL exposure.

---

## ADDED Requirements

### Requirement: DeleteInventoryItemsBulk Command

Any authenticated space member MAY delete multiple inventory items in one
request.

The command MUST accept `ids: string[]`, between 1 and 100 entries. Requests
with more than 100 ids MUST be rejected with 400 before any deletion is
attempted. Duplicate ids in the input MUST be de-duplicated before processing.

For each unique id, the handler MUST resolve it against the tenant-scoped
write repository. An id that resolves to an aggregate in the caller's active
space MUST be deleted (emitting `InventoryItemDeleted`, identically to single
delete) and added to `deletedIds`. An id that does not resolve — because it
does not exist, or because it belongs to a different space — MUST be added to
`notFoundIds` and MUST NOT cause the rest of the batch to fail.

The response MUST report `deletedIds`, `notFoundIds`, `deletedCount`, and
`requestedCount` (the de-duplicated count actually processed).

#### Scenario: All ids deleted

- GIVEN three inventory items in the active space
- WHEN `DeleteInventoryItemsBulk` is dispatched with all three ids
- THEN all three are deleted, `InventoryItemDeleted` is emitted three times, `deletedIds` contains all three, and `notFoundIds` is empty

#### Scenario: Mixed valid and invalid ids

- GIVEN two inventory items in the active space and one id that does not exist
- WHEN `DeleteInventoryItemsBulk` is dispatched with all three ids
- THEN the two existing items are deleted, the unknown id appears in `notFoundIds`, and the request as a whole succeeds

#### Scenario: Cross-tenant id treated as not found

- GIVEN an item that exists under Space B
- WHEN `DeleteInventoryItemsBulk` is dispatched under Space A context including that item's id
- THEN the item is NOT deleted, its id appears in `notFoundIds`, and no distinction is made from a non-existent id

#### Scenario: Duplicate ids de-duplicated

- GIVEN one existing inventory item
- WHEN `DeleteInventoryItemsBulk` is dispatched with that item's id repeated three times
- THEN the item is deleted exactly once, `InventoryItemDeleted` is emitted exactly once, and `deletedIds` contains the id once

#### Scenario: Batch exceeds maximum size

- GIVEN 101 ids
- WHEN `DeleteInventoryItemsBulk` is dispatched
- THEN a 400 Bad Request is returned and no items are deleted

#### Scenario: Empty batch

- GIVEN an empty `ids` array
- WHEN `DeleteInventoryItemsBulk` is dispatched
- THEN the request succeeds with `deletedIds: []`, `notFoundIds: []`, `deletedCount: 0`

---

### Requirement: REST Bulk Delete Endpoint

The system MUST expose `POST /inventory-items/bulk-delete`, guarded by
`JwtAuthGuard` and `SpaceGuard`, requiring the `X-Space-ID` header, accepting
body `{ ids: string[] }`, and returning 200 with the bulk delete result.

#### Scenario: REST bulk delete happy path

- GIVEN an authenticated request with a valid `X-Space-ID` and a body of 5 existing item ids
- WHEN `POST /inventory-items/bulk-delete` is called
- THEN 200 is returned with `deletedCount: 5`

---

### Requirement: GraphQL Bulk Delete Mutation

The system MUST expose `inventoryItemsDeleteBulk(input:
DeleteInventoryItemsBulkInput!): BulkDeleteResultDto!`, guarded by
`JwtAuthGuard`, dispatching exclusively via `CommandBus`, with `spaceId`
resolved from `SpaceContext` (never from the input payload).

#### Scenario: GraphQL bulk delete happy path

- GIVEN an authenticated GraphQL request with an active space context and 5 existing item ids
- WHEN `inventoryItemsDeleteBulk` is called with those ids
- THEN the mutation returns `deletedCount: 5` and `notFoundIds: []`

---

## Out of Scope

- Bulk create, bulk update, bulk adjust-quantity.
- Atomic all-or-nothing transaction semantics.
- Persisted audit ledger of bulk-deleted items.
