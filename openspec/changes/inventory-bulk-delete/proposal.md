# Proposal: Inventory Bulk Delete (`inventory-bulk-delete`)

## Intent

`gardenia-web` is redesigning the inventory screen as a data table with row
selection, so users can select several items (e.g. a batch of expired seed
packets) and delete them in one action. Today the `inventory` context only
exposes single-item delete (`DeleteInventoryItem`), so a bulk action in the UI
would require N sequential mutation calls — slow, non-atomic from the
network's point of view, and awkward to report partial failures for.

This change adds a dedicated bulk-delete command to the existing `inventory`
bounded context (`src/contexts/inventory/`), reusing every invariant already
established for single delete (tenant isolation, "any space member may
delete") and exposing it via the same two transports (REST + GraphQL) already
used by this context.

## Scope

### In Scope

- New command `DeleteInventoryItemsBulk`: accepts `ids: string[]` (1–100 UUIDs)
  for the caller's active space.
- Best-effort (non-atomic) semantics: valid ids belonging to the active space
  are deleted; ids that don't exist or belong to another space are reported
  back, not silently ignored and not treated as a hard failure of the whole
  batch (see Approach for rationale).
- New query-side-free response reporting `deletedIds` and `notFoundIds` so the
  frontend can reconcile its optimistic table selection.
- GraphQL mutation `inventoryItemsDeleteBulk` and REST endpoint
  `POST /inventory-items/bulk-delete`, both behind `JwtAuthGuard` (+ `SpaceGuard`
  on REST, `SpaceContext.require()` on GraphQL — matching the existing single
  delete pattern exactly).
- `InventoryItemDeleted` event emitted once per deleted item (reuses the
  existing event — no new event type needed since the effect on any single
  item is identical to single delete).
- MCP tool `inventory_item_delete_bulk` (per repo rule: every public
  command/query MUST be exposed as an MCP tool).
- README update for `src/contexts/inventory/README.md`.

### Out of Scope

- Bulk create, bulk update, bulk adjust-quantity — only bulk delete.
- Atomic all-or-nothing transaction semantics (rejected — see Approach).
- A persisted audit ledger of what was bulk-deleted (existing `inventory`
  context has no adjustment ledger either; consistent with that precedent).
- Rate limiting / abuse protection beyond the existing per-request auth guards
  (no new concern introduced beyond what N sequential single deletes already
  permit).

## Approach

### Partial-failure semantics: best-effort, not atomic (selected)

`inventory` is a collaborative, space-scoped resource — any member can delete
any item, so a concurrent delete-by-another-member of one selected row while
the batch is in flight is an expected, benign race, not a client bug. Failing
the *entire* batch because one of N ids was deleted a second ago (or was
already stale in the client's cached table) would surface a scary "operation
failed" to the user for what is actually mostly-successful outcome. Best-effort
also matches how the frontend wants to reconcile UI state: clear whichever
rows actually got deleted, leave the rest selected with a "N of M deleted"
toast.

Rejected alternative — **atomic all-or-nothing**: would require wrapping the
batch in a DB transaction and rejecting the whole request on any single
missing/foreign id. Rejected because it turns a benign concurrent-edit race
into a hard user-facing failure, and because none of the existing `inventory`
mutations use transactional multi-row semantics today.

### Batch size cap: 100

Matches the existing `findByCriteria` max `limit=100` convention already
established for this context (`InventoryItemFindByCriteria`) — reuses the same
mental model of "one page, one batch." Enforced via `class-validator`
`@ArrayMaxSize(100)` / a domain-level check in the command, rejected with 400
if exceeded.

### Tenant isolation

The write repository already filters every operation through
`createTenantRepository(rawRepo, spaceContext)`. The handler resolves ids to
aggregates via the tenant-scoped repository only — an id belonging to another
space simply never resolves, and is reported as `notFoundIds`, identically to
how single `DeleteInventoryItem` already treats a wrong-space id as 404. No new
cross-tenant leak surface is introduced (existence of another tenant's id is
never distinguished from "id does not exist at all").

### Rejected alternative — reuse `DeleteInventoryItem` command with an array field

Considered widening the existing command's `id: string` to `id: string |
string[]`. Rejected: violates the "Command classes have one clear input
shape" convention, complicates the existing (simple, well-tested) single-delete
handler with branching, and makes the REST/GraphQL contracts ambiguous (is a
single string batch-of-one or not?). A distinct command/handler/mutation/route
keeps both flows simple and independently testable.

## Affected Areas

| Area | Impact | Description |
|------|--------|--------------|
| `src/contexts/inventory/application/commands/delete-inventory-items-bulk/` | New | Command + handler |
| `src/contexts/inventory/domain/view-models/` (no change) | — | Reuses existing `InventoryItemDeleted` event, no new domain type |
| `src/contexts/inventory/transport/rest/controllers/inventory-items.controller.ts` | Modified | New `POST /inventory-items/bulk-delete` |
| `src/contexts/inventory/transport/graphql/resolvers/inventory-item-mutations.resolver.ts` | Modified | New `inventoryItemsDeleteBulk` mutation |
| `src/contexts/inventory/transport/graphql/dtos/{requests,responses}/` | New | `DeleteInventoryItemsBulkInput`, `BulkDeleteResultDto` |
| `src/contexts/inventory/transport/mcp/tools/` | New | `inventory-item-delete-bulk.tool.ts` |
| `src/contexts/inventory/README.md` | Modified | Document new command/endpoints |
| `openspec/specs/inventory/spec.md` | N/A | No baseline exists yet — original `inventory-module` change hasn't been archived; this delta is written against `openspec/changes/inventory-module/specs/inventory/spec.md` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Client sends a huge id array (accidental "select all" across pages) | Med | Hard cap at 100, 400 on excess — matches existing pagination cap so the frontend table page size never exceeds it |
| Ambiguity over "deleted 0 of N" being reported as success | Low | Response always includes `deletedIds`/`notFoundIds`; `success` reflects `deletedIds.length > 0 \|\| ids.length === 0` is NOT used — `success` is simply `true` whenever the request was well-formed and processed (frontend inspects the arrays, not a single boolean, for outcome) |
| Duplicate ids in the request | Low | Handler de-duplicates ids before processing; each unique id appears in at most one of the two result arrays |
| N individual `InventoryItemDeleted` events emitted synchronously in a loop — perf on very large batches | Low | Capped at 100; existing single-delete path already does one DB round trip per id, no new pattern |

## Rollback Plan

Revert the branch. No schema/migration change — this is a new command over the
existing `inventory_items` table, no new columns or tables.

## Dependencies

- None external. Reuses `JwtAuthGuard`, `SpaceGuard`, `createTenantRepository`,
  `AssertInventoryItemExistsService` is NOT reused as-is (it throws on first
  miss; bulk needs a non-throwing per-id resolution — see design.md).

## Success Criteria

- [ ] `DeleteInventoryItemsBulk` deletes all valid, in-space ids and reports
      out-of-space/non-existent ids in `notFoundIds` without failing the batch.
- [ ] Batch capped at 100 ids; 400 on excess.
- [ ] Exposed via REST (`POST /inventory-items/bulk-delete`) and GraphQL
      (`inventoryItemsDeleteBulk`), both behind the same guards as single delete.
- [ ] `InventoryItemDeleted` emitted once per actually-deleted item.
- [ ] Cross-tenant ids never distinguished from non-existent ids in the response.
- [ ] MCP tool `inventory_item_delete_bulk` registered.
- [ ] Unit, integration, and e2e tests green.
