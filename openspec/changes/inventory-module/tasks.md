# Tasks: Inventory Module (`inventory-module`)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1 300 – 1 700 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → Domain + Application · PR 2 → Infrastructure + Migration · PR 3 → Transport + Module wiring · PR 4 → Tests |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes  
Chained PRs recommended: Yes  
Chain strategy: pending  
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Domain + Application layer (no I/O) | PR 1 | Aggregate, VOs, events, exceptions, commands (incl. adjust), queries, assert services |
| 2 | Infrastructure layer + migration | PR 2 | TypeORM entity, mapper, write repo (tenant), read repo (tenant, criteria), migration |
| 3 | Transport + module wiring | PR 3 | REST controller + DTOs, GraphQL resolvers + types, InventoryModule, app.module.ts, README |
| 4 | Tests (unit + integration + e2e + static) | PR 4 | All test files |

---

## Phase 1: Domain

- [x] 1.1 Create `src/contexts/inventory/domain/enums/inventory-item-type.enum.ts` — `InventoryItemTypeEnum` (`SEEDS`, `FERTILIZER`, `SUBSTRATE`, `PHYTOSANITARY`, `OTHER`)
- [x] 1.2 Create `src/contexts/inventory/domain/enums/inventory-unit.enum.ts` — `InventoryUnitEnum` (`UNITS`, `G`, `KG`, `ML`, `L`, `PACKETS`)
- [x] 1.3 Create `src/contexts/inventory/domain/value-objects/inventory-item-id/inventory-item-id.value-object.ts` — extends `UuidValueObject`
- [x] 1.4 Create `src/contexts/inventory/domain/value-objects/inventory-item-name/inventory-item-name.value-object.ts` — extends `StringValueObject`; trims; rejects empty/whitespace; max 200 chars
- [x] 1.5 Create `src/contexts/inventory/domain/value-objects/inventory-item-brand/inventory-item-brand.value-object.ts` — extends `StringValueObject`; max 200 chars (optional usage)
- [x] 1.6 Create `src/contexts/inventory/domain/value-objects/inventory-item-notes/inventory-item-notes.value-object.ts` — extends `StringValueObject`; max 2000 chars (optional usage)
- [x] 1.7 Create `src/contexts/inventory/domain/value-objects/inventory-item-type/inventory-item-type.value-object.ts` — extends `EnumValueObject<typeof InventoryItemTypeEnum>`; validates in constructor
- [x] 1.8 Create `src/contexts/inventory/domain/value-objects/inventory-quantity/inventory-quantity.value-object.ts` — extends `NumberValueObject`; rejects `< 0`
- [x] 1.9 Create `src/contexts/inventory/domain/value-objects/inventory-unit/inventory-unit.value-object.ts` — extends `EnumValueObject<typeof InventoryUnitEnum>`; validates in constructor
- [x] 1.10 Create `src/contexts/inventory/domain/value-objects/inventory-low-stock-threshold/inventory-low-stock-threshold.value-object.ts` — extends `NumberValueObject`; rejects `< 0`
- [x] 1.11 Create `src/contexts/inventory/domain/value-objects/inventory-acquired-at/inventory-acquired-at.value-object.ts` — wraps `Date`
- [x] 1.12 Create `src/contexts/inventory/domain/value-objects/inventory-expires-at/inventory-expires-at.value-object.ts` — wraps `Date`
- [x] 1.13 Create `src/contexts/inventory/domain/events/interfaces/inventory-item-event-data.interface.ts`
- [x] 1.14 Create `src/contexts/inventory/domain/events/inventory-item-created/inventory-item-created.event.ts`
- [x] 1.15 Create `src/contexts/inventory/domain/events/inventory-item-updated/inventory-item-updated.event.ts`
- [x] 1.16 Create `src/contexts/inventory/domain/events/inventory-item-deleted/inventory-item-deleted.event.ts`
- [x] 1.17 Create `src/contexts/inventory/domain/events/inventory-item-quantity-adjusted/inventory-item-quantity-adjusted.event.ts` — carries `delta`, `reason`, resulting `quantity`
- [x] 1.18 Create field-changed events under `src/contexts/inventory/domain/events/field-changed/`: `name-changed`, `brand-changed`, `notes-changed`, `item-type-changed`, `unit-changed`, `low-stock-threshold-changed`, `acquired-at-changed`, `expires-at-changed`
- [x] 1.19 Create `src/contexts/inventory/domain/exceptions/inventory-item-not-found.exception.ts` — HTTP 404
- [x] 1.20 Create `src/contexts/inventory/domain/interfaces/inventory-item.interface.ts` — `IInventoryItem` with VO-typed fields (optional fields typed `VO | undefined`)
- [x] 1.21 Create `src/contexts/inventory/domain/primitives/inventory-item.primitives.ts` — `IInventoryItemPrimitives extends BasePrimitives`; all primitive types (optionals nullable)
- [x] 1.22 Create `src/contexts/inventory/domain/view-models/inventory-item.view-model.ts` — `InventoryItemViewModel extends BaseViewModel`
- [x] 1.23 Create `src/contexts/inventory/domain/repositories/write/inventory-item-write.repository.ts` — `IInventoryItemWriteRepository` + `INVENTORY_ITEM_WRITE_REPOSITORY` token
- [x] 1.24 Create `src/contexts/inventory/domain/repositories/read/inventory-item-read.repository.ts` — `IInventoryItemReadRepository` + `INVENTORY_ITEM_READ_REPOSITORY` token; `InventoryItemCriteria` type with `itemType?`, `name?`, `lowStock?`, `expiringBefore?`, `page?`, `limit?`
- [x] 1.25 Create `src/contexts/inventory/domain/aggregates/inventory-item.aggregate.ts` — `create()`, `update({itemType?,name?,brand?,notes?,unit?,lowStockThreshold?,acquiredAt?,expiresAt?})`, `adjustQuantity(delta, reason)` (clamps result at 0, emits `InventoryItemQuantityAdjusted`), `delete()`; per-field change events only when value differs; carries `userId`, `spaceId`
- [x] 1.26 Create `src/contexts/inventory/domain/builders/inventory-item.builder.ts` — extends `BaseBuilder`; receives `IInventoryItemPrimitives`; wraps each field in VO, skipping `undefined` optionals

---

## Phase 2: Application

- [x] 2.1 Create `src/contexts/inventory/application/services/write/assert-inventory-item-exists/assert-inventory-item-exists.service.ts` — loads from write repo; throws `InventoryItemNotFoundException` when null
- [x] 2.2 Create `src/contexts/inventory/application/services/read/assert-inventory-item-view-model-exists/assert-inventory-item-view-model-exists.service.ts` — loads from read repo; throws `InventoryItemNotFoundException` when null
- [x] 2.3 Create `src/contexts/inventory/application/commands/create-inventory-item/create-inventory-item.command.ts` — `CreateInventoryItemCommandInput` (primitive fields); command constructs VOs
- [x] 2.4 Create `src/contexts/inventory/application/commands/create-inventory-item/create-inventory-item.handler.ts` — builds aggregate via builder; calls `create()`; saves via write repo; logs entry + completion; returns `inventoryItemId`
- [x] 2.5 Create `src/contexts/inventory/application/commands/update-inventory-item/update-inventory-item.command.ts`
- [x] 2.6 Create `src/contexts/inventory/application/commands/update-inventory-item/update-inventory-item.handler.ts` — loads aggregate via `AssertInventoryItemExistsService`; calls `update()`; saves; emits `InventoryItemUpdated`; logs
- [x] 2.7 Create `src/contexts/inventory/application/commands/adjust-inventory-item-quantity/adjust-inventory-item-quantity.command.ts` — `inventoryItemId`, `delta` (non-zero), `reason` (non-empty)
- [x] 2.8 Create `src/contexts/inventory/application/commands/adjust-inventory-item-quantity/adjust-inventory-item-quantity.handler.ts` — loads aggregate via `AssertInventoryItemExistsService`; calls `adjustQuantity(delta, reason)`; saves; logs
- [x] 2.9 Create `src/contexts/inventory/application/commands/delete-inventory-item/delete-inventory-item.command.ts`
- [x] 2.10 Create `src/contexts/inventory/application/commands/delete-inventory-item/delete-inventory-item.handler.ts` — loads aggregate via `AssertInventoryItemExistsService`; calls `delete()`; removes from repo; logs
- [x] 2.11 Create `src/contexts/inventory/application/queries/inventory-item-find-by-id/inventory-item-find-by-id.query.ts`
- [x] 2.12 Create `src/contexts/inventory/application/queries/inventory-item-find-by-id/inventory-item-find-by-id.handler.ts` — uses `AssertInventoryItemViewModelExistsService`; returns `InventoryItemViewModel`; logs at entry
- [x] 2.13 Create `src/contexts/inventory/application/queries/inventory-item-find-by-criteria/inventory-item-find-by-criteria.query.ts` — includes `itemType?`, `name?`, `lowStock?`, `expiringBefore?`, `page`, `limit`
- [x] 2.14 Create `src/contexts/inventory/application/queries/inventory-item-find-by-criteria/inventory-item-find-by-criteria.handler.ts` — always scoped to `spaceId`; passes criteria to read repo; empty list returns `[]`; logs at entry

---

## Phase 3: Infrastructure

- [x] 3.1 Create `src/contexts/inventory/infrastructure/persistence/typeorm/entities/inventory-item.entity.ts` — `inventory_items` table; columns: `id` (uuid pk), `item_type` (varchar), `name` (varchar 200), `brand` (varchar 200 NULL), `notes` (text NULL), `quantity` (decimal 12,3), `unit` (varchar), `low_stock_threshold` (decimal 12,3 NULL), `acquired_at` (timestamptz NULL), `expires_at` (timestamptz NULL), `user_id` (uuid), `space_id` (uuid NOT NULL), `created_at`, `updated_at`; `@Index('IDX_inventory_items_space_id', ['spaceId'])`
- [x] 3.2 Create `src/contexts/inventory/infrastructure/persistence/typeorm/mappers/inventory-item-typeorm.mapper.ts` — `toDomain(entity): IInventoryItemPrimitives` + `toPersistence(aggregate): InventoryItemEntity`; `quantity`/`low_stock_threshold` stored/read as string, parsed with `parseFloat`; nullable optionals mapped to `null`/`undefined`
- [x] 3.3 Create `src/contexts/inventory/infrastructure/persistence/typeorm/repositories/inventory-item-typeorm-write.repository.ts` — extends `BaseDatabaseRepository`; `this.repository = createTenantRepository(rawRepo, spaceContext)` in constructor; implements `IInventoryItemWriteRepository`
- [x] 3.4 Create `src/contexts/inventory/infrastructure/persistence/typeorm/repositories/inventory-item-typeorm-read.repository.ts` — extends `BaseDatabaseRepository`; `createTenantRepository` pattern; implements `IInventoryItemReadRepository`; `findByCriteria` builds query with `item_type` exact, `name` ILIKE, `lowStock` (`low_stock_threshold IS NOT NULL AND quantity <= low_stock_threshold`), `expiringBefore` (`expires_at IS NOT NULL AND expires_at <= value`); pagination default page=1, limit=20, max=100
- [x] 3.5 Create `src/database/migrations/1780000000018-CreateInventoryItems.ts` — `up()` creates `inventory_items` table + `IDX_inventory_items_space_id`; `down()` drops table

---

## Phase 4: Transport

- [x] 4.1 Create `src/contexts/inventory/transport/rest/dtos/create-inventory-item.dto.ts` — `itemType` (enum, required), `name` (string, required), `quantity` (number, required), `unit` (enum, required), optional `brand`, `notes`, `lowStockThreshold`, `acquiredAt` (ISO→Date), `expiresAt` (ISO→Date)
- [x] 4.2 Create `src/contexts/inventory/transport/rest/dtos/update-inventory-item.dto.ts` — all editable fields optional (excludes `quantity`)
- [x] 4.3 Create `src/contexts/inventory/transport/rest/dtos/adjust-inventory-item-quantity.dto.ts` — `delta` (number, non-zero, required), `reason` (string, required)
- [x] 4.4 Create `src/contexts/inventory/transport/rest/dtos/inventory-item-rest-response.dto.ts` — all `InventoryItemViewModel` fields
- [x] 4.5 Create `src/contexts/inventory/transport/rest/mappers/inventory-item/inventory-item.mapper.ts` — `InventoryItemViewModel → InventoryItemRestResponseDto`
- [x] 4.6 Create `src/contexts/inventory/transport/rest/controllers/inventory-items.controller.ts` — routes: `POST /inventory-items` (201), `GET /inventory-items` (200), `GET /inventory-items/:id` (200), `PATCH /inventory-items/:id` (200), `POST /inventory-items/:id/adjust` (200), `DELETE /inventory-items/:id` (200); guards: `JwtAuthGuard` + `SpaceGuard`; `@CurrentUser` → `userId`; log at each entry point
- [x] 4.7 Create `src/contexts/inventory/transport/graphql/enums/inventory-registered-enums.graphql.ts` — `registerEnumType(InventoryItemTypeEnum, { name: 'InventoryItemType' })` + `registerEnumType(InventoryUnitEnum, { name: 'InventoryUnit' })`
- [x] 4.8 Create `src/contexts/inventory/transport/graphql/dtos/requests/create-inventory-item-graphql.dto.ts` — `@InputType()` with all create fields
- [x] 4.9 Create `src/contexts/inventory/transport/graphql/dtos/requests/update-inventory-item-graphql.dto.ts` — `@InputType()` with `id` + optional editable fields
- [x] 4.10 Create `src/contexts/inventory/transport/graphql/dtos/requests/adjust-inventory-item-quantity-graphql.dto.ts` — `@InputType()` with `id`, `delta`, `reason`
- [x] 4.11 Create `src/contexts/inventory/transport/graphql/dtos/requests/inventory-item-criteria-graphql.dto.ts` — `@InputType()` with `itemType?`, `name?`, `lowStock?`, `expiringBefore?`, `page?`, `limit?`
- [x] 4.12 Create `src/contexts/inventory/transport/graphql/dtos/responses/inventory-item.response.dto.ts` — `@ObjectType()` with all `InventoryItemViewModel` fields; `itemType`/`unit` typed as registered enums
- [x] 4.13 Create `src/contexts/inventory/transport/graphql/mappers/inventory-item.mapper.ts` — `InventoryItemViewModel → InventoryItemResponseDto`
- [x] 4.14 Create `src/contexts/inventory/transport/graphql/resolvers/inventory-item-queries.resolver.ts` — `inventoryItem(id: ID!)`, `inventoryItems(criteria)`; guards: `JwtAuthGuard` + `SpaceGuard`; dispatches via `QueryBus` only; log at entry
- [x] 4.15 Create `src/contexts/inventory/transport/graphql/resolvers/inventory-item-mutations.resolver.ts` — `createInventoryItem`, `updateInventoryItem`, `adjustInventoryItemQuantity`, `deleteInventoryItem`; same guards; dispatches via `CommandBus` only; log at entry

---

## Phase 5: Module Wiring & Docs

- [x] 5.1 Create `src/contexts/inventory/inventory.module.ts` — providers grouped as `COMMAND_HANDLERS`, `QUERY_HANDLERS`, `APPLICATION_SERVICES`, `DOMAIN_BUILDERS`, `INFRASTRUCTURE_REPOSITORIES`, `INFRASTRUCTURE_MAPPERS`, `INFRASTRUCTURE_ENTITIES`, `TRANSPORT_PROVIDERS`; write repo bound to `INVENTORY_ITEM_WRITE_REPOSITORY` (useClass); read repo bound to `INVENTORY_ITEM_READ_REPOSITORY` (useClass); `TypeOrmModule.forFeature([InventoryItemEntity])`; `CqrsModule` imported
- [x] 5.2 Modify `src/app.module.ts` — add `InventoryModule` to `imports[]`
- [x] 5.3 Create `src/contexts/inventory/README.md` — context walkthrough (commands, queries, events, endpoints, enums), following the auth context README template

---

## Phase 6: Tests

- [x] 6.1 Unit — `inventory-item-type.value-object.spec.ts`: valid enum values accepted; `"POT"` / `"TOOL"` / unknown throw
- [x] 6.2 Unit — `inventory-unit.value-object.spec.ts`: valid units accepted; invalid throws
- [x] 6.3 Unit — `inventory-quantity.value-object.spec.ts`: `0` and positive accepted; negative throws
- [x] 6.4 Unit — `inventory-low-stock-threshold.value-object.spec.ts`: `0` and positive accepted; negative throws
- [x] 6.5 Unit — `inventory-item-name.value-object.spec.ts`: non-empty trimmed accepted; empty/whitespace throws
- [x] 6.6 Unit — `inventory-item.aggregate.spec.ts`: `create()` emits `InventoryItemCreated`; `update()` emits `InventoryItemUpdated` + field change events only when value differs; `adjustQuantity()` emits `InventoryItemQuantityAdjusted` and clamps at 0; `delete()` emits `InventoryItemDeleted`
- [x] 6.7 Unit — `create-inventory-item.handler.spec.ts`: happy path saves aggregate + returns id; invalid name → throws; negative quantity → throws
- [x] 6.8 Unit — `update-inventory-item.handler.spec.ts`: updates fields and saves; id not found → 404
- [x] 6.9 Unit — `adjust-inventory-item-quantity.handler.spec.ts`: consume/restock adjusts and saves; over-consumption clamps to 0; id not found → 404
- [x] 6.10 Unit — `delete-inventory-item.handler.spec.ts`: deletes aggregate; id not found → 404
- [x] 6.11 Unit — `inventory-item-find-by-id.handler.spec.ts`: found → returns ViewModel; not found → 404
- [x] 6.12 Unit — `inventory-item-find-by-criteria.handler.spec.ts`: delegates criteria to read repo; empty result → `[]`
- [x] 6.13 Integration — `inventory-item-typeorm-write.repository.integration-spec.ts` + `inventory-item-typeorm-read.repository.integration-spec.ts`: tenant isolation (item under S1 invisible under S2); `name` ILIKE filter; `itemType` exact filter; `lowStock` threshold semantics; `expiringBefore` range; `decimal(12,3)` round-trip; nullable optionals round-trip
- [x] 6.14 E2E — `inventory-items-rest.e2e-spec.ts`: REST CRUD + adjust behind `JwtAuthGuard` + `SpaceGuard`; invalid item type → 400; negative quantity → 400; adjust beyond stock clamps to 0; cross-tenant → 404
- [x] 6.15 E2E — `inventory-items-graphql.e2e-spec.ts`: GraphQL `createInventoryItem`, `inventoryItem(id)`, `inventoryItems(criteria)`, `updateInventoryItem`, `adjustInventoryItemQuantity`, `deleteInventoryItem`; guards enforced
- [x] 6.16 Static — `inventory-no-cross-context-import.spec.ts`: scan `src/contexts/inventory/**` — assert no import from `@contexts/plants/`, `@contexts/plant-species/`, or `@contexts/care-log/`
