# Tasks: Inventory Bulk Delete (`inventory-bulk-delete`)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 250 – 350 |
| 400-line budget risk | Low |
| Chained PRs recommended | No — fits in a single PR |
| Delivery strategy | single PR |

---

## Phase 1: Application

- [x] 1.1 Create `application/commands/delete-inventory-items-bulk/delete-inventory-items-bulk.command.ts` — `DeleteInventoryItemsBulkCommandInput { ids: string[] }`; `DeleteInventoryItemsBulkCommand` de-duplicates input ids and wraps each in `InventoryItemIdValueObject`
- [x] 1.2 Create `application/commands/delete-inventory-items-bulk/delete-inventory-items-bulk.handler.ts` — for each id: `writeRepo.findById(id)`; if found, `aggregate.delete()` + `writeRepo.delete(id)` + push to `deletedIds`; else push to `notFoundIds`; returns `{ deletedIds, notFoundIds }`; logs at entry (ids count) and on completion (deleted/not-found counts)
- [x] 1.3 RED+GREEN: `delete-inventory-items-bulk.handler.spec.ts` — all-found case, mixed case, all-not-found case, duplicate-id de-dup case, empty-array case (`jest.Mocked<IInventoryItemWriteRepository>`)

## Phase 2: Transport — REST

- [x] 2.1 Create `transport/rest/dtos/delete-inventory-items-bulk.dto.ts` — `{ ids: string[] }` with `@IsArray()`, `@ArrayMinSize(1)`, `@ArrayMaxSize(100)`, `@IsUUID('4', { each: true })`
- [x] 2.2 Create `transport/rest/dtos/bulk-delete-result-rest-response.dto.ts` — `{ deletedIds: string[], notFoundIds: string[], deletedCount: number, requestedCount: number }`
- [x] 2.3 Modify `transport/rest/controllers/inventory-items.controller.ts` — add `POST /inventory-items/bulk-delete`, `@UseGuards(JwtAuthGuard, SpaceGuard)`, logs entry with ids count, dispatches `DeleteInventoryItemsBulkCommand` via `CommandBus`, maps result to response DTO

## Phase 3: Transport — GraphQL

- [x] 3.1 Create `transport/graphql/dtos/requests/delete-inventory-items-bulk-graphql.dto.ts` — `DeleteInventoryItemsBulkInput { ids: string[] }` with same validation as REST DTO
- [x] 3.2 Create `transport/graphql/dtos/responses/bulk-delete-result.response.dto.ts` — `BulkDeleteResultDto { deletedIds, notFoundIds, deletedCount, requestedCount }`, `@ObjectType()`
- [x] 3.3 Modify `transport/graphql/resolvers/inventory-item-mutations.resolver.ts` — add `inventoryItemsDeleteBulk(input): BulkDeleteResultDto`, `@UseGuards(JwtAuthGuard)`, dispatches via `CommandBus` only, logs at entry

## Phase 4: Transport — MCP

- [x] 4.1 Create `transport/mcp/schemas/inventory-item-delete-bulk.schema.ts` — Zod schema for `{ ids: string[] }` (1–100 UUIDs)
- [x] 4.2 Create `transport/mcp/tools/inventory-item-delete-bulk.tool.ts` — `InventoryItemDeleteBulkMcpTool implements IMcpTool`, `@McpTool('inventory_item_delete_bulk')`, dispatches via `CommandBus`, reads `spaceId`/`userId` from `IMcpToolContext`

## Phase 5: Module Wiring & Docs

- [x] 5.1 Modify `inventory.module.ts` — register `DeleteInventoryItemsBulkHandler` in `COMMAND_HANDLERS`, `InventoryItemDeleteBulkMcpTool` in the MCP tools array
- [x] 5.2 Modify `src/contexts/inventory/README.md` — document the new command, REST endpoint, GraphQL mutation, and MCP tool alongside the existing single-delete entry

## Phase 6: Tests

- [ ] 6.1 Integration — extend `inventory-item-typeorm-write.repository.integration-spec.ts` (or new `delete-inventory-items-bulk.integration-spec.ts`): bulk delete only resolves same-space ids; cross-tenant id ends up in `notFoundIds`, item remains persisted
- [x] 6.2 E2E — REST: `inventory-items-bulk-delete-rest.e2e-spec.ts` — happy path (5 ids), mixed valid/invalid, >100 ids → 400, cross-tenant id → reported not-found, unauthenticated → 401
- [x] 6.3 E2E — GraphQL: extend `inventory-items-graphql.e2e-spec.ts` — `inventoryItemsDeleteBulk` happy path, mixed valid/invalid, >100 ids → 400

## Phase 7: Verify

- [x] 7.1 `pnpm test` (inventory module) green
- [ ] 7.2 `pnpm test:integration --testPathPattern=inventory` green
- [ ] 7.3 `pnpm test:e2e --testPathPattern=inventory` green
- [x] 7.4 `pnpm lint` / `tsc --noEmit` clean
- [x] 7.5 `pnpm build` green
