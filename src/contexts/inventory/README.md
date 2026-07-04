# Inventory Context

## Purpose

The `inventory` context records and manages a space's stock of **consumable
garden supplies**: seeds, fertilizers, substrates, phytosanitary products and
anything else (`OTHER`). An **inventory item** tracks what it is (`itemType` +
`name`), how much is in stock (`quantity` + `unit`), an optional per-item
low-stock threshold, and optional acquisition / expiry dates.

This is a standalone bounded context with **no cross-context dependencies** —
in particular no link to the plant-species catalog. All data is tenant-scoped
via `SpaceContext`.

> Scope note: this context intentionally excludes the `POT` and `TOOL` item
> types and the `plantSpeciesId` catalog link from the original proposal
> (issue #228). Consumables only, fully standalone.

---

## Core aggregate

### `InventoryItemAggregate`

| Field | Type | Description |
|-------|------|-------------|
| `id` | `InventoryItemIdValueObject` | UUID generated on creation |
| `itemType` | `InventoryItemTypeValueObject` | `SEEDS`, `FERTILIZER`, `SUBSTRATE`, `PHYTOSANITARY`, or `OTHER` |
| `name` | `InventoryItemNameValueObject` | Free-text label, 1–200 chars |
| `brand` | `InventoryItemBrandValueObject \| null` | Optional brand, ≤ 200 chars |
| `notes` | `InventoryItemNotesValueObject \| null` | Optional notes, ≤ 2000 chars |
| `quantity` | `InventoryQuantityValueObject` | Decimal ≥ 0 (stored as `decimal(12,3)`) |
| `unit` | `InventoryUnitValueObject` | `UNITS`, `G`, `KG`, `ML`, `L`, or `PACKETS` |
| `lowStockThreshold` | `InventoryLowStockThresholdValueObject \| null` | Optional decimal ≥ 0 |
| `acquiredAt` | `InventoryAcquiredAtValueObject \| null` | Optional acquisition date |
| `expiresAt` | `InventoryExpiresAtValueObject \| null` | Optional expiry date |
| `userId` | `UuidValueObject` | User who created the item (`@CurrentUser`) |
| `spaceId` | `UuidValueObject` | Space owning this record (`SpaceContext` ALS) |
| `createdAt` / `updatedAt` | `Date` | Managed by TypeORM |

Domain methods:

- `create()` — applies `InventoryItemCreatedEvent`
- `update(fields)` — applies `InventoryItemUpdatedEvent` plus per-field change events for each modified field
- `adjustQuantity(delta, reason)` — recomputes `quantity = max(0, quantity + delta)` and applies `InventoryItemQuantityAdjustedEvent`
- `delete()` — applies `InventoryItemDeletedEvent`

Business rules enforced in the domain:
- `quantity` and `lowStockThreshold` must be ≥ 0 (`NumberValueObject` with `{ min: 0 }`)
- `name` must be non-empty / non-whitespace
- `adjustQuantity` never lets the stock go negative — it clamps at `0`
- Any space member can create, update, adjust and delete any item in the space

---

## Architecture layers

| Layer | Path | What lives here |
|-------|------|-----------------|
| **domain** | `domain/` | `InventoryItemAggregate`, `InventoryItemBuilder`, value objects, domain events, repository interfaces, `InventoryItemNotFoundException`, `InventoryItemTypeEnum`, `InventoryUnitEnum` |
| **application** | `application/` | Command handlers (`Create`, `Update`, `AdjustQuantity`, `Delete`), query handlers (`FindById`, `FindByCriteria`), assert services |
| **infrastructure** | `infrastructure/` | `InventoryItemTypeOrmReadRepository`, `InventoryItemTypeOrmWriteRepository`, `InventoryItemTypeOrmMapper`, `InventoryItemTypeOrmEntity` |
| **transport** | `transport/` | `InventoryItemsController` (REST), `InventoryItemQueriesResolver` + `InventoryItemMutationsResolver` (GraphQL), DTOs, mappers, exception resolver |

---

## Public API

All write endpoints require:
- `Authorization: Bearer <accessToken>` — enforced by `JwtAuthGuard`
- `X-Space-ID: <uuid>` — enforced by the global `SpaceGuard`

### REST Endpoints

Base path: `/inventory-items`

| Method | Path | Status | Description |
|--------|------|--------|-------------|
| `POST` | `/inventory-items` | 201 | Create an item |
| `GET` | `/inventory-items` | 200 | List items (with optional filters) |
| `GET` | `/inventory-items/:id` | 200 | Get a single item by ID |
| `PATCH` | `/inventory-items/:id` | 200 | Update an item (not the quantity) |
| `POST` | `/inventory-items/:id/adjust` | 200 | Consume / restock the quantity |
| `DELETE` | `/inventory-items/:id` | 200 | Delete an item |
| `POST` | `/inventory-items/bulk-delete` | 200 | Delete multiple items in one request (1-100 ids, best-effort) |

**GET `/inventory-items` query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `itemType` | `InventoryItemTypeEnum` | Exact match on `item_type` |
| `name` | `string` | Case-insensitive partial match on `name` |
| `lowStock` | `"true"` | Only items where `low_stock_threshold IS NOT NULL AND quantity <= low_stock_threshold` |
| `expiringBefore` | `ISO date string` | Only items where `expires_at <= value` |
| `page` | `number` | Page number (default: 1) |
| `limit` | `number` | Items per page (default: 20) |

**POST `/inventory-items/:id/adjust` body:**

```json
{ "delta": -3, "reason": "sowed lettuce" }
```

**POST `/inventory-items/bulk-delete` body:**

```json
{ "ids": ["550e8400-e29b-41d4-a716-446655440000", "..."] }
```

Returns `{ deletedIds, notFoundIds, deletedCount, requestedCount }`. Best-effort:
ids that don't exist or belong to another space land in `notFoundIds` without
failing the rest of the batch. Capped at 100 ids (400 if exceeded); duplicate
ids are de-duplicated before processing.

### GraphQL Operations

| Name | Type | Description |
|------|------|-------------|
| `inventoryItemsFindByCriteria(input?)` | Query | Paginated items matching filters/sorts/pagination |
| `inventoryItemFindById(input)` | Query | Single item by id, or `null` |
| `inventoryItemCreate(input)` | Mutation | Create an item. Returns `MutationResponseDto` |
| `inventoryItemUpdate(input)` | Mutation | Update an item. Returns `MutationResponseDto` |
| `inventoryItemAdjustQuantity(input)` | Mutation | Consume / restock. Returns `MutationResponseDto` |
| `inventoryItemDelete(id)` | Mutation | Delete an item. Returns `MutationResponseDto` |
| `inventoryItemsDeleteBulk(input)` | Mutation | Delete multiple items (1-100 ids). Returns `BulkDeleteResultDto` |

---

## Commands & Queries

| Class | Type | Purpose |
|-------|------|---------|
| `CreateInventoryItemCommand` | Command | Create a new item for a user+space |
| `UpdateInventoryItemCommand` | Command | Update fields (excluding quantity) |
| `AdjustInventoryItemQuantityCommand` | Command | Consume/restock with a reason (clamps at 0) |
| `DeleteInventoryItemCommand` | Command | Remove an item |
| `DeleteInventoryItemsBulkCommand` | Command | Remove multiple items (best-effort, 1-100 ids) |
| `InventoryItemFindByIdQuery` | Query | Returns an `InventoryItemViewModel` by id |
| `InventoryItemFindByCriteriaQuery` | Query | Returns `PaginatedResult<InventoryItemViewModel>` |

---

## Domain Events

| Class | When emitted |
|-------|-------------|
| `InventoryItemCreatedEvent` | On `create()` |
| `InventoryItemUpdatedEvent` | On `update()` |
| `InventoryItemQuantityAdjustedEvent` | On `adjustQuantity()` — carries `delta`, `reason`, resulting `quantity` |
| `InventoryItemDeletedEvent` | On `delete()` |
| `InventoryItem{Name,ItemType,Unit,Brand,Notes,LowStockThreshold,AcquiredAt,ExpiresAt}ChangedEvent` | When the corresponding field changes during `update()` |

---

## How to Test This Module

**Unit tests** (no database, no HTTP):

```bash
pnpm test src/contexts/inventory
```

**Integration tests** (requires Postgres):

```bash
pnpm test:integration --testPathPattern=inventory
```

Covers tenant isolation, the `lowStock` / `expiringBefore` / `name` / `itemType`
filters, decimal round-trip and nullable-optionals round-trip.

**E2E tests** (requires Docker):

```bash
pnpm test:e2e --testPathPattern=inventory
```

`test/e2e/inventory/` covers REST and GraphQL, including the adjust flow
(clamp-to-zero), POT rejection, and tenant isolation (cross-space → 404).

**Cross-context isolation test:**

```bash
pnpm test src/contexts/inventory/inventory-no-cross-context-import.spec.ts
```

Statically verifies no import from `@contexts/plants`, `@contexts/plant-species`
or `@contexts/care-log`.

---

## Domain exceptions → HTTP status

Mapped in `transport/exceptions/inventory-exception.filter.ts` (wired into the
global `BaseExceptionFilter`):

| Exception | HTTP |
|-----------|------|
| `InventoryItemNotFoundException` | 404 Not Found |

---

## Database

### `inventory_items`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | PK |
| `item_type` | `varchar(50)` | `SEEDS`, `FERTILIZER`, `SUBSTRATE`, `PHYTOSANITARY`, `OTHER` |
| `name` | `varchar(200)` | Free-text label |
| `brand` | `varchar(200)` | Nullable |
| `notes` | `text` | Nullable |
| `quantity` | `decimal(12,3)` | TypeORM returns as string — mapper parses to `number` |
| `unit` | `varchar(50)` | `UNITS`, `G`, `KG`, `ML`, `L`, `PACKETS` |
| `low_stock_threshold` | `decimal(12,3)` | Nullable |
| `acquired_at` | `timestamptz` | Nullable |
| `expires_at` | `timestamptz` | Nullable, indexed (`IDX_inventory_items_expires_at`) |
| `user_id` | `uuid` | Who created the item |
| `space_id` | `uuid` | Tenant column — used by `createTenantRepository` |
| `created_at` / `updated_at` | `timestamptz` | |

Migration: `src/database/migrations/1780000000018-CreateInventoryItems.ts`

**Tenant isolation:** both repositories use
`createTenantRepository(rawRepo, spaceContext)` to scope all queries to the
active `spaceId` from `SpaceContext` ALS.

---

## Things to know before making changes

1. **No cross-context imports** — enforced by `inventory-no-cross-context-import.spec.ts`.
2. **`quantity` / `low_stock_threshold` are decimals stored as strings** — the mapper parses them with `parseFloat`. Verify round-trip behaviour when touching the mapper.
3. **`lowStock` is a cross-column filter** — handled as a special `low_stock` filter field in `InventoryItemTypeOrmReadRepository.findByCriteria` (`quantity <= low_stock_threshold`), not a plain column filter.
4. **`adjustQuantity` clamps at 0** — consumption larger than stock leaves the quantity at `0`, never negative.
5. **`SpaceContext` / `SpaceGuard` are global** — never add them to `InventoryModule.providers`.

## MCP Tools

Exposed under `transport/mcp/` for AI clients (see `src/core/mcp/README.md`). Each tool dispatches through the Command/Query bus; the acting user and active space come from the authenticated MCP request context.

| Tool | Action |
|------|--------|
| `inventory_item_create` | Create an inventory item |
| `inventory_item_update` | Update an inventory item |
| `inventory_item_adjust_quantity` | Apply a signed quantity delta |
| `inventory_item_delete` | Delete an inventory item |
| `inventory_item_delete_bulk` | Delete multiple inventory items (1-100 ids) |
| `inventory_item_find_by_id` | Get an item by id |
| `inventory_item_find_by_criteria` | Paginated list of items |
