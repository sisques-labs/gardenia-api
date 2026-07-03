# Design: Inventory Bulk Delete

## Technical Approach

Add one new command (`DeleteInventoryItemsBulk`) + handler to the existing
`inventory` context. No new aggregate, value object, or event type — the
handler resolves each requested id against the tenant-scoped write repository,
calls the existing `aggregate.delete()` method (which already emits
`InventoryItemDeleted`) on every id that resolves, and collects which ids
resolved vs. which didn't.

The write repository interface (`IInventoryItemWriteRepository`) already
extends `IBaseWriteRepository<InventoryItemAggregate>`, which provides
`findById` and `delete`. No new repository method is required — the handler
loops calling the existing single-item repository methods. (A batched
`deleteMany` repository method was considered — see Rejected Alternatives.)

## Architecture Decisions

| Decision | Choice | Alternatives rejected | Rationale |
|----------|--------|------------------------|-----------|
| Failure mode | Best-effort, per-id result | Atomic transaction, all-or-nothing | See proposal.md — collaborative space, concurrent-delete race is benign |
| Repository access | Loop `findById`/`delete` via existing tenant-scoped repo, no new repo method | New `deleteMany(ids)` repo method with a single `WHERE id IN (...)` | Batch capped at 100 — looping is simple, reuses `AssertInventoryItemExistsService`-free resolution already proven correct for single delete, and avoids adding a bulk-shaped method to the shared `IBaseWriteRepository` contract used by every other context |
| Existence check | Non-throwing resolution (`findById` returns `null \| Aggregate`, handler branches) | Reuse `AssertInventoryItemExistsService` (throws) wrapped in try/catch per id | Throwing-and-catching per iteration for expected "not found" outcomes is an anti-pattern; a plain null-check reads clearer and is what the read side already does for optional lookups |
| Duplicate ids in request | De-duplicated before processing (`[...new Set(ids)]`) | Process as given, may double-emit for a repeated id | A repeated id would attempt `delete()` twice on an already-deleted aggregate on the second pass — de-dup keeps handler logic single-pass and events unambiguous |
| Batch size limit | 100, enforced by `@ArrayMaxSize(100)` at the transport DTO layer (both REST and GraphQL input) | Enforce only in the domain command | Transport-layer validation gives a clean 400 before any DB work; matches how `CreateInventoryItem`'s string length caps are enforced today |
| Command input shape | `{ ids: string[] }`, VOs constructed per-id inside the handler (`InventoryItemIdValueObject`) | Command holds pre-validated VO array | Keeps the `{Name}CommandInput` = primitives-only convention; VO construction happens in the handler exactly like every other command in this context |

## Data Flow

```
REST POST /inventory-items/bulk-delete           GraphQL inventoryItemsDeleteBulk(input)
     │  (JwtAuthGuard + SpaceGuard)                    │  (JwtAuthGuard, SpaceContext.require())
     └──────────────────┬───────────────────────────────┘
                         ▼
              CommandBus.execute(DeleteInventoryItemsBulk { ids })
                         │
                         ▼
     DeleteInventoryItemsBulkHandler
       1. de-dup ids
       2. for each id:
            aggregate = writeRepo.findById(id)   // tenant-scoped — null if missing or wrong space
            if aggregate: aggregate.delete() → emits InventoryItemDeleted
                          writeRepo.delete(id)
                          deletedIds.push(id)
            else:         notFoundIds.push(id)
       3. return { deletedIds, notFoundIds }
                         │
                         ▼
        BulkDeleteResultDto { deletedIds, notFoundIds, deletedCount, requestedCount }
```

Sequence for a batch of 3 where one id belongs to another space:

```
Client            Resolver/Controller      CommandBus         Handler                 WriteRepo(tenant)
  │  ids=[A,B,C]         │                     │                  │                          │
  │─────────────────────>│                     │                  │                          │
  │                      │──dispatch───────────>│                  │                          │
  │                      │                     │──execute────────>│                          │
  │                      │                     │                  │──findById(A)────────────>│ → found
  │                      │                     │                  │<─────────────────────────│
  │                      │                     │                  │──A.delete()+writeRepo.delete(A)
  │                      │                     │                  │──findById(B)────────────>│ → found
  │                      │                     │                  │──B.delete()+writeRepo.delete(B)
  │                      │                     │                  │──findById(C)────────────>│ → null (other space)
  │                      │                     │                  │  (C → notFoundIds)
  │                      │                     │<─────────────────│ {deletedIds:[A,B], notFoundIds:[C]}
  │<─────────────────────│<────────────────────│                  │                          │
```

## File Changes

```
application/
  commands/delete-inventory-items-bulk/
    delete-inventory-items-bulk.command.ts
    delete-inventory-items-bulk.handler.ts
    delete-inventory-items-bulk.handler.spec.ts
transport/
  rest/
    dtos/delete-inventory-items-bulk.dto.ts        # { ids: string[] } request
    dtos/bulk-delete-result-rest-response.dto.ts   # { deletedIds, notFoundIds, deletedCount, requestedCount }
  graphql/
    dtos/requests/delete-inventory-items-bulk-graphql.dto.ts
    dtos/responses/bulk-delete-result.response.dto.ts
  mcp/
    tools/inventory-item-delete-bulk.tool.ts
    schemas/inventory-item-delete-bulk.schema.ts
```

| File | Action | Description |
|------|--------|--------------|
| `transport/rest/controllers/inventory-items.controller.ts` | Modify | Add `POST /inventory-items/bulk-delete` |
| `transport/graphql/resolvers/inventory-item-mutations.resolver.ts` | Modify | Add `inventoryItemsDeleteBulk` mutation |
| `inventory.module.ts` | Modify | Register new handler + MCP tool in their provider arrays |
| `src/contexts/inventory/README.md` | Modify | Document new command + endpoints |

## Interfaces / Contracts

```ts
// application/commands/delete-inventory-items-bulk/delete-inventory-items-bulk.command.ts
export interface DeleteInventoryItemsBulkCommandInput {
  ids: string[]; // 1..100, de-duplicated by the handler
}

export class DeleteInventoryItemsBulkCommand {
  public readonly ids: InventoryItemIdValueObject[];
  constructor(input: DeleteInventoryItemsBulkCommandInput) {
    this.ids = [...new Set(input.ids)].map((id) => new InventoryItemIdValueObject(id));
  }
}

// handler result (not a domain type — a plain application-layer DTO)
export interface DeleteInventoryItemsBulkResult {
  deletedIds: string[];
  notFoundIds: string[];
}
```

```graphql
input DeleteInventoryItemsBulkInput {
  ids: [ID!]!
}

type BulkDeleteResultDto {
  deletedIds: [ID!]!
  notFoundIds: [ID!]!
  deletedCount: Int!
  requestedCount: Int!
}

extend type Mutation {
  inventoryItemsDeleteBulk(input: DeleteInventoryItemsBulkInput!): BulkDeleteResultDto!
}
```

REST: `POST /inventory-items/bulk-delete` body `{ "ids": ["...", "..."] }` →
200 with the same `BulkDeleteResultDto` shape (a `POST` rather than `DELETE`
because this endpoint accepts a request body — several HTTP clients and
proxies mishandle `DELETE` bodies inconsistently, and no other endpoint on this
context uses one).

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | `delete-inventory-items-bulk.handler.spec.ts`: all ids exist → all deleted, empty `notFoundIds`; mixed valid/invalid → correct split; duplicate ids in input → de-duplicated, no double-emit; empty `ids` array → returns empty result, no repo calls | Jest, `jest.Mocked<T>` |
| Integration | `inventory-item-typeorm-write.repository.integration-spec.ts` (extend): bulk delete resolves only same-space ids; wrong-space id lands in `notFoundIds`, never silently deleted | Test DB + SpaceContext |
| E2E | REST `POST /inventory-items/bulk-delete`: happy path, over-100 ids → 400, cross-tenant id → reported not-found not error; GraphQL `inventoryItemsDeleteBulk` same coverage; both behind `JwtAuthGuard` | supertest |

## Migration / Rollout

No migration — no schema change. Purely additive command/transport surface.

## Open Questions

- None. Semantics (best-effort, cap 100, dedup) are fully decided in this
  proposal; revisit only if the frontend's real usage pattern shows a need for
  atomic semantics.
