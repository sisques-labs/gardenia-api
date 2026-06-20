# Proposal: Inventory Module (`inventory`)

## Intent

Huerto users manage a physical stock the app ignores: seed packets (with expiry
and germination decay), fertilizers, substrates and phytosanitary products.
Today they cannot answer *"do I still have lettuce seeds, and are they still
viable?"* when planning a season, nor *"am I out of tomato fertilizer?"* before
it matters.

This change introduces a **tenant-scoped `inventory` bounded context**: a stock
list of consumable garden supplies keyed by a free-text `name` and a fixed
`itemType` enum, with `quantity` + `unit`, an optional per-item low-stock
threshold, and optional acquisition / expiry dates. Any space member can create,
edit, delete, and adjust (consume / restock) items. Queries answer the three
planning questions: list by type, low-stock, and expiring-soon.

The design is intentionally minimal and **fully standalone** — no link to the
plant-species catalog and no `POT` / `TOOL` item types — to ship a useful
feature fast. Cross-context consumption hooks (sowing, care-log fertilizing) and
the species link are explicitly deferred to future changes.

## Scope

### In Scope
- New `inventory` bounded context (domain → application → infrastructure → transport).
- `InventoryItemAggregate` fields: `id` (UUID), `itemType` (enum), `name`
  (free text, non-empty, max 200 chars), `brand?` (optional, max 200 chars),
  `notes?` (optional, max 2000 chars), `quantity` (decimal, ≥ 0),
  `unit` (enum), `lowStockThreshold?` (optional decimal, ≥ 0),
  `acquiredAt?` (optional Date), `expiresAt?` (optional Date),
  `userId`, `spaceId`, `createdAt`, `updatedAt`.
- `InventoryItemTypeEnum`: `SEEDS | FERTILIZER | SUBSTRATE | PHYTOSANITARY | OTHER`.
- `InventoryUnitEnum`: `UNITS | G | KG | ML | L | PACKETS`.
- Commands: `CreateInventoryItem`, `UpdateInventoryItem`, `DeleteInventoryItem`,
  `AdjustInventoryItemQuantity` (signed delta + reason; clamps at 0) — any
  authenticated space member.
- Queries: `InventoryItemFindById`, `InventoryItemFindByCriteria`
  (filters: `itemType`, `name` partial match, `lowStock` flag, `expiringBefore`
  date; paginated).
- Events: `InventoryItemCreated`, `InventoryItemUpdated`, `InventoryItemDeleted`,
  `InventoryItemQuantityAdjusted`.
- Dual transport: REST (`/inventory-items`, full CRUD + adjust) + GraphQL.
  Guards: `JwtAuthGuard` + `SpaceGuard`.
- TypeORM entity + migration `1780000000018-CreateInventoryItems` with `space_id`
  column; tenant isolation via `createTenantRepository`.
- Register `InventoryModule` in `src/app.module.ts`.

### Out of Scope
- `plantSpeciesId` link to the plant-species catalog (the "you have seeds for
  this" sowing-calendar hint, #220) — deferred; `inventory` MUST NOT import
  `plant-species`.
- `POT` and `TOOL` item types — out by product decision (consumables only).
- Cross-context consumption hooks: decrement seed stock on sowing (#218),
  decrement fertilizer stock on care-log fertilizing (#216) — deferred.
- Low-stock / expiry feed notifications (#224) and dashboard attention list (#227).
- Separate adjustment-ledger table / per-adjustment history (the
  `AdjustInventoryItemQuantity` reason is carried on the event only, not persisted
  as rows in v1).
- Per-item ownership-based access control beyond "any space member".

## Capabilities

### New Capabilities
- `inventory`: Tenant-scoped CRUD + quantity adjustment for consumable garden
  supplies (seeds, fertilizers, substrates, phytosanitary, other), with
  low-stock and expiring-soon queries, REST + GraphQL.

### Modified Capabilities
- None. `inventory` is fully standalone.

## Approach

- **No cross-context coupling**: `inventory` MUST NOT import from `plants`,
  `plant-species`, `care-log`, or any other bounded context. `name` is a
  free-text VO; there is no species FK.
- **Tenant isolation**: `createTenantRepository` proxy on both read and write
  repos (same pattern as `harvests` / `planting-spots`).
- **Ownership**: `userId` is stored (the creator) but NOT used as an access
  gate — any space member may update, delete, or adjust any item in the space.
- **`quantity` / `lowStockThreshold`**: stored as `decimal(12,3)` in Postgres;
  domain VOs enforce `>= 0`.
- **`AdjustInventoryItemQuantity`**: applies a signed `delta` to `quantity` with
  a required `reason` (free text). Resulting quantity is clamped at `0` (a
  consumption larger than stock leaves `0`, never negative). Emits
  `InventoryItemQuantityAdjusted` carrying `delta`, `reason`, and the resulting
  quantity.
- **Low-stock semantics**: an item is "low stock" when `lowStockThreshold` is set
  AND `quantity <= lowStockThreshold`. Items with no threshold are never low-stock.
- **Expiring-soon semantics**: the `expiringBefore` filter returns items whose
  `expiresAt` is set AND `expiresAt <= expiringBefore`.
- **`itemType` / `unit`**: `EnumValueObject`s; registered with GraphQL via
  `registerEnumType`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/contexts/inventory/` | New | Full bounded context |
| `src/database/migrations/1780000000018-CreateInventoryItems.ts` | New | `inventory_items` table with `space_id`, `decimal(12,3)` quantity/threshold |
| `src/app.module.ts` | Modified | Register `InventoryModule` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Missing `createTenantRepository` → cross-tenant data leak | Med | Integration test asserting tenant isolation on read + write |
| Concurrent `AdjustInventoryItemQuantity` races (lost update) | Low | v1 accepts last-write; documented; atomic decrement deferred with the consumption hooks |
| `decimal` precision loss via JS float | Low | Store as `decimal(12,3)` string in TypeORM; VO wraps `parseFloat`; integration test verifies round-trip |
| Negative quantity from over-consumption | Low | VO + adjust logic clamp at 0; unit test covers delta beyond stock |
| Migration timestamp conflict | Low | Confirmed highest is `1780000000017`; use `...0018` |

## Rollback Plan

Revert branch; run migration `down()` (drops `inventory_items` table). No data
migration in other tables — additive and isolated.

## Dependencies

- None external. Reuses `JwtAuthGuard`, `SpaceGuard`, `createTenantRepository`,
  `BaseAggregate` / `BaseBuilder` from `@sisques-labs/nestjs-kit`.

## Success Criteria

- [ ] CRUD + adjust via REST and GraphQL behind `JwtAuthGuard` + `SpaceGuard`.
- [ ] Reads/writes tenant-isolated via `createTenantRepository` (integration test proves it).
- [ ] `quantity >= 0` and `lowStockThreshold >= 0` enforced at VO level; `name` non-empty enforced at VO level.
- [ ] `AdjustInventoryItemQuantity` clamps at 0 and emits `InventoryItemQuantityAdjusted` with `delta` + `reason`.
- [ ] `InventoryItemFindByCriteria` supports `itemType`, `name` partial match, `lowStock` flag, `expiringBefore` range.
- [ ] No `@contexts/plants`, `@contexts/plant-species`, or `@contexts/care-log` import in `inventory`.
- [ ] Unit, integration, and e2e tests green.
