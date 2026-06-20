# Design: Inventory Module (`inventory`)

## Technical Approach

Mirror the `harvests` bounded context structure (domain → application →
infrastructure → transport, CQRS, dual transport) with tenant isolation via
`createTenantRepository(rawRepo, spaceContext)`. No ports, no cross-context
adapters — `inventory` is fully standalone. `name`/`brand`/`notes` are free-text
`StringValueObject`s. `itemType` and `unit` are `EnumValueObject`s. `quantity`
and `lowStockThreshold` are `NumberValueObject`s with a `>= 0` guard.
`acquiredAt` / `expiresAt` are stored as nullable `timestamptz` and exposed as
optional `Date`.

The only behavioural twist over `harvests` is the `AdjustInventoryItemQuantity`
command: a domain method `adjustQuantity(delta, reason)` recomputes
`quantity = max(0, quantity + delta)` and emits a dedicated
`InventoryItemQuantityAdjusted` event carrying `delta`, `reason`, and the
resulting quantity. This keeps consumption/restock as a first-class operation
distinct from a generic field `update()`.

## Architecture Decisions

| Decision | Choice | Alternatives rejected | Rationale |
|----------|--------|-----------------------|-----------|
| `name` modeling | Free-text `InventoryItemNameValueObject extends StringValueObject` | FK to `plant-species` | Explicit scope: no catalog link in v1; species hint deferred to #220 |
| `itemType` enum | `SEEDS \| FERTILIZER \| SUBSTRATE \| PHYTOSANITARY \| OTHER` | Include `POT` / `TOOL` | Product decision: consumables only; pots & tools out |
| Tenant isolation | `createTenantRepository` in BOTH repo constructors | Non-tenant repos | `inventory` is space-scoped; follows `harvests` pattern |
| `quantity` / `lowStockThreshold` storage | `decimal(12,3)`; VO wraps `parseFloat` | `float8` | Avoids IEEE-754 drift on fractional g/ml |
| Quantity adjustment | Dedicated `adjustQuantity(delta, reason)` + `InventoryItemQuantityAdjusted` event; clamp at 0 | Reuse generic `update({quantity})` | Consumption/restock is a distinct intent; reason belongs to the event |
| Adjustment history | Event only; no ledger table in v1 | Append-only `inventory_adjustments` table | Keep minimal; ledger can be added when notifications (#224) need it |
| Low-stock semantics | `lowStockThreshold != null AND quantity <= lowStockThreshold` | Global default threshold | Issue calls for a per-item threshold |
| No ownership gate | Any space member can update/delete/adjust | Owner-only | Collaborative inventory, consistent with `harvests` |
| No `plantSpeciesId` FK | Not present in v1 | Link to `PlantSpeciesAggregate` | Explicit scope decision; future change can add |

## Data Flow

```
REST/GraphQL ──(JwtAuthGuard + SpaceGuard)──> Command/Query
     │                                              │
CommandBus ──> Handler ──> Builder ──> Aggregate ──> WriteRepo(tenant) ──> PG
     │              │         (create / update / delete / adjustQuantity)
     │         AssertExists (write repo, 404 on miss)
QueryBus  ──> Handler ──> ReadRepo(tenant, WHERE space_id) ──> ViewModel ──> Mapper ──> DTO
```

`AdjustInventoryItemQuantity` flow: handler loads the aggregate via
`AssertInventoryItemExistsService`, calls `aggregate.adjustQuantity(delta,
reason)`, persists, and the aggregate emits `InventoryItemQuantityAdjusted`.

## File Changes

All new under `src/contexts/inventory/`. Tree (≈48 files):

```
domain/
  aggregates/inventory-item.aggregate.ts
  builders/inventory-item.builder.ts
  enums/inventory-item-type.enum.ts
  enums/inventory-unit.enum.ts
  events/inventory-item-created/inventory-item-created.event.ts
  events/inventory-item-updated/inventory-item-updated.event.ts
  events/inventory-item-deleted/inventory-item-deleted.event.ts
  events/inventory-item-quantity-adjusted/inventory-item-quantity-adjusted.event.ts
  events/field-changed/name-changed/name-changed.event.ts
  events/field-changed/brand-changed/brand-changed.event.ts
  events/field-changed/notes-changed/notes-changed.event.ts
  events/field-changed/item-type-changed/item-type-changed.event.ts
  events/field-changed/unit-changed/unit-changed.event.ts
  events/field-changed/low-stock-threshold-changed/low-stock-threshold-changed.event.ts
  events/field-changed/acquired-at-changed/acquired-at-changed.event.ts
  events/field-changed/expires-at-changed/expires-at-changed.event.ts
  events/interfaces/inventory-item-event-data.interface.ts
  exceptions/inventory-item-not-found.exception.ts                # 404
  interfaces/inventory-item.interface.ts
  primitives/inventory-item.primitives.ts
  repositories/read/inventory-item-read.repository.ts             # IInventoryItemReadRepository + INVENTORY_ITEM_READ_REPOSITORY
  repositories/write/inventory-item-write.repository.ts           # IInventoryItemWriteRepository + INVENTORY_ITEM_WRITE_REPOSITORY
  value-objects/inventory-item-id/inventory-item-id.value-object.ts
  value-objects/inventory-item-name/inventory-item-name.value-object.ts
  value-objects/inventory-item-brand/inventory-item-brand.value-object.ts
  value-objects/inventory-item-notes/inventory-item-notes.value-object.ts
  value-objects/inventory-item-type/inventory-item-type.value-object.ts
  value-objects/inventory-quantity/inventory-quantity.value-object.ts
  value-objects/inventory-unit/inventory-unit.value-object.ts
  value-objects/inventory-low-stock-threshold/inventory-low-stock-threshold.value-object.ts
  value-objects/inventory-acquired-at/inventory-acquired-at.value-object.ts
  value-objects/inventory-expires-at/inventory-expires-at.value-object.ts
  view-models/inventory-item.view-model.ts
application/
  commands/create-inventory-item/create-inventory-item.command.ts
  commands/create-inventory-item/create-inventory-item.handler.ts
  commands/update-inventory-item/update-inventory-item.command.ts
  commands/update-inventory-item/update-inventory-item.handler.ts
  commands/delete-inventory-item/delete-inventory-item.command.ts
  commands/delete-inventory-item/delete-inventory-item.handler.ts
  commands/adjust-inventory-item-quantity/adjust-inventory-item-quantity.command.ts
  commands/adjust-inventory-item-quantity/adjust-inventory-item-quantity.handler.ts
  queries/inventory-item-find-by-id/inventory-item-find-by-id.query.ts
  queries/inventory-item-find-by-id/inventory-item-find-by-id.handler.ts
  queries/inventory-item-find-by-criteria/inventory-item-find-by-criteria.query.ts
  queries/inventory-item-find-by-criteria/inventory-item-find-by-criteria.handler.ts
  services/write/assert-inventory-item-exists/assert-inventory-item-exists.service.ts
  services/read/assert-inventory-item-view-model-exists/assert-inventory-item-view-model-exists.service.ts
infrastructure/
  persistence/typeorm/entities/inventory-item.entity.ts
  persistence/typeorm/mappers/inventory-item-typeorm.mapper.ts
  persistence/typeorm/repositories/inventory-item-typeorm-write.repository.ts
  persistence/typeorm/repositories/inventory-item-typeorm-read.repository.ts
transport/
  rest/controllers/inventory-items.controller.ts
  rest/dtos/create-inventory-item.dto.ts
  rest/dtos/update-inventory-item.dto.ts
  rest/dtos/adjust-inventory-item-quantity.dto.ts
  rest/dtos/inventory-item-rest-response.dto.ts
  rest/mappers/inventory-item/inventory-item.mapper.ts
  graphql/resolvers/inventory-item-queries.resolver.ts
  graphql/resolvers/inventory-item-mutations.resolver.ts
  graphql/dtos/requests/create-inventory-item-graphql.dto.ts
  graphql/dtos/requests/update-inventory-item-graphql.dto.ts
  graphql/dtos/requests/adjust-inventory-item-quantity-graphql.dto.ts
  graphql/dtos/requests/inventory-item-criteria-graphql.dto.ts
  graphql/dtos/responses/inventory-item.response.dto.ts
  graphql/mappers/inventory-item.mapper.ts
  graphql/enums/inventory-registered-enums.graphql.ts
inventory.module.ts
README.md
```

| File | Action | Description |
|------|--------|-------------|
| `src/database/migrations/1780000000018-CreateInventoryItems.ts` | Create | `inventory_items` table + `IDX_inventory_items_space_id` |
| `src/app.module.ts` | Modify | Register `InventoryModule` |
| `src/contexts/inventory/README.md` | Create | Context walkthrough (per repo apply rule), using auth README as template |

## Interfaces / Contracts

```ts
// domain/enums/inventory-item-type.enum.ts
export enum InventoryItemTypeEnum {
  SEEDS = 'SEEDS',
  FERTILIZER = 'FERTILIZER',
  SUBSTRATE = 'SUBSTRATE',
  PHYTOSANITARY = 'PHYTOSANITARY',
  OTHER = 'OTHER',
}

// domain/enums/inventory-unit.enum.ts
export enum InventoryUnitEnum {
  UNITS = 'UNITS',
  G = 'G',
  KG = 'KG',
  ML = 'ML',
  L = 'L',
  PACKETS = 'PACKETS',
}

// domain/repositories/read/inventory-item-read.repository.ts
export const INVENTORY_ITEM_READ_REPOSITORY = Symbol('INVENTORY_ITEM_READ_REPOSITORY');
export type InventoryItemCriteria = {
  itemType?: InventoryItemTypeEnum;
  name?: string;            // ILIKE %value%
  lowStock?: boolean;       // true → quantity <= lowStockThreshold (threshold not null)
  expiringBefore?: Date;    // expiresAt not null AND expiresAt <= value
  page?: number;
  limit?: number;
};
export interface IInventoryItemReadRepository extends IBaseReadRepository<InventoryItemViewModel> {
  findByCriteria(criteria: InventoryItemCriteria): Promise<InventoryItemViewModel[]>;
}

// domain/repositories/write/inventory-item-write.repository.ts
export const INVENTORY_ITEM_WRITE_REPOSITORY = Symbol('INVENTORY_ITEM_WRITE_REPOSITORY');
export interface IInventoryItemWriteRepository extends IBaseWriteRepository<InventoryItemAggregate> {}
```

**Entity columns**: `id` (uuid pk), `item_type` (varchar NOT NULL), `name`
(varchar 200 NOT NULL), `brand` (varchar 200 NULL), `notes` (text NULL),
`quantity` (decimal(12,3) NOT NULL), `unit` (varchar NOT NULL),
`low_stock_threshold` (decimal(12,3) NULL), `acquired_at` (timestamptz NULL),
`expires_at` (timestamptz NULL), `user_id` (uuid NOT NULL), `space_id` (uuid NOT
NULL), `created_at` (timestamptz), `updated_at` (timestamptz). Index on
`space_id`.

**Aggregate**: VOs for all fields (optional fields hold `VO | undefined`).
`create()`, `update({itemType?, name?, brand?, notes?, unit?, lowStockThreshold?,
acquiredAt?, expiresAt?})`, `adjustQuantity(delta, reason)`, `delete()` emit
events. `update()` emits per-field change events only when value differs.
`adjustQuantity()` clamps the result at 0 and emits
`InventoryItemQuantityAdjusted`.

**Builder**: receives primitives, constructs VOs (skipping `undefined` optionals),
passes `IInventoryItem` to aggregate constructor.

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | Aggregate `create`/`update`/`delete`/`adjustQuantity` events; `adjustQuantity` clamps at 0; `InventoryQuantityValueObject` (< 0 throws); `InventoryLowStockThresholdValueObject` (< 0 throws); `InventoryItemNameValueObject` (empty throws); `InventoryItemTypeValueObject` / `InventoryUnitValueObject` (invalid throws); handler happy paths + 404 | Jest, `jest.Mocked<T>` |
| Integration | Tenant isolation (item in S1 invisible under S2); `name` ILIKE filter; `itemType` filter; `lowStock` flag (threshold semantics); `expiringBefore` range; `decimal(12,3)` round-trip; nullable optionals round-trip | Test DB + SpaceContext |
| E2E | REST + GraphQL CRUD + adjust behind `JwtAuthGuard` + `SpaceGuard`; invalid enum → 400; negative quantity → 400; adjust beyond stock clamps to 0; tenant isolation → 404 | supertest |
| Static | `inventory-no-cross-context-import.spec.ts`: no import from `@contexts/plants/`, `@contexts/plant-species/`, `@contexts/care-log/` | Jest source scan |

## Migration / Rollout

Single additive migration `1780000000018`; `down()` drops `inventory_items`. No
data backfill. No impact on other bounded contexts.

## Open Questions

- None. Scope is fully defined (consumables only, standalone, no species link).
