# Proposal: PlantingSpots bounded context (`planting-spots`)

## Intent

Plants in Gardenia have no physical placement. `PlantAggregate` knows its species, owner, space and QR — but not WHERE it grows (maceta, bancal, cantero, sector). Users cannot organize their garden by physical location.

This change introduces a **tenant-scoped `planting-spots` bounded context**: the physical container or area where one or more plants live. A `type` enum (`raised_bed | pot | container | field_section | other`) absorbs all sub-concepts without proliferating modules.

Why now: `plants`, `plant-species` and the dual-transport + tenant patterns are proven. A standalone spot module unblocks Phase 2 (linking plants to spots) while keeping each PR under the 400-line budget.

## Scope

### In Scope (Phase 1 — standalone module)
- New `planting-spots` bounded context (domain → application → infrastructure → transport).
- `PlantingSpotAggregate` fields: `id`, `name`, `type` (enum), `description` (nullable), `userId`, `spaceId`, `createdAt`, `updatedAt`.
- Commands: `CreatePlantingSpot` (any space member), `UpdatePlantingSpot` (owner), `DeletePlantingSpot` (owner; **reject if plants linked**).
- Queries: `PlantingSpotFindById`, `PlantingSpotFindByCriteria` (type filter, paginated, tenant-scoped).
- Events: `PlantingSpotCreated`, `PlantingSpotUpdated`, `PlantingSpotDeleted`.
- Dual transport: REST + GraphQL. Guards: `JwtAuthGuard` + `SpaceGuard` (`X-Space-ID` required).
- TypeORM entity + migration `1780000000010-CreatePlantingSpots` with `space_id` column; **MUST** use `createTenantRepository` on read and write repos.
- Register `PlantingSpotsModule` in `src/app.module.ts`.

### Out of Scope (deferred to Phase 2)
- `plantingSpotId` FK on `PlantAggregate` / entity / primitives.
- `IPlantingSpotPort` + `PlantingSpotAdapter` in `plants` context.
- Enrichment of `PlantViewModel` with nested spot object.
- Capacity limits, geo-coordinates, photos, nesting/hierarchy of spots.

## Capabilities

### New Capabilities
- `planting-spots`: Tenant-scoped CRUD for physical growing locations (typed), REST + GraphQL, delete guarded against linked plants.

### Modified Capabilities
- None (Phase 2 will modify `plants`).

## Approach

- **Persistence:** Mirror `plants` — `createTenantRepository` proxy on both repos; `space_id` column injected by tenant proxy on writes and filtered on reads.
- **Ownership vs tenancy:** Carry both `userId` (creator/owner) and `spaceId` (tenant scope), exactly like `PlantAggregate`.
- **Delete guard:** `AssertPlantingSpotNotInUseService` + `PlantingSpotInUseException` (409), mirroring `assert-plant-species-not-in-use`. In Phase 1 there is no `plants` FK yet, so the guard's reference-count port returns 0 — the wiring exists, becomes effective in Phase 2.
- **No cross-context import:** `planting-spots` MUST NOT import from `plants`. Direction is `plants → planting-spots` via port (Phase 2 only).
- **VOs:** `PlantingSpotTypeValueObject` extends `EnumValueObject`; enum in `domain/enums/`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/contexts/planting-spots/` | New | Full bounded context |
| `src/database/migrations/1780000000010-CreatePlantingSpots.ts` | New | `planting_spots` table with `space_id` |
| `src/app.module.ts` | Modified | Register `PlantingSpotsModule` |
| `src/core/filters/base-exception.filter.ts` | Modified | Map `PlantingSpotInUseException` → 409 (if filter enumerates exceptions) |
| `openspec/specs/planting-spots/` | New (on archive) | Canonical spec |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Missing `createTenantRepository` → cross-tenant data leak | Med | Integration test asserting tenant isolation on read + write |
| Circular dep if `planting-spots` imports `plants` | Low | Port/adapter direction enforced; no `@contexts/plants` import |
| Migration timestamp conflict | Low | Confirmed highest is `1780000000009`; use `...0010`. Regenerate if main advances |
| Delete-guard port returns wrong count in Phase 2 | Low | Integration test in Phase 2 with real linked plants |

## Rollback Plan

Revert branch; run migration `down()` (drop `planting_spots`). No data migration in other tables — Phase 1 is additive and isolated, so rollback is clean.

## Dependencies

- None external. Reuses `JwtAuthGuard`, `SpaceGuard`, `createTenantRepository`, `BaseAggregate`/`BaseBuilder` from `@sisques-labs/nestjs-kit`.

## Phase Breakdown

- **Phase 1 (this proposal):** Standalone `planting-spots` module, no `plants` coupling. Self-contained, deployable, under 400 lines target.
- **Phase 2 (separate change):** Add nullable `plantingSpotId` to `plants` + port/adapter/enrichment; activate the delete guard.

## Success Criteria

- [ ] CRUD via REST and GraphQL behind `JwtAuthGuard` + `SpaceGuard`.
- [ ] Reads/writes tenant-isolated via `createTenantRepository` (integration test proves it).
- [ ] `type` enum persisted and filterable in `PlantingSpotFindByCriteria`.
- [ ] Delete guard wiring present (`PlantingSpotInUseException`).
- [ ] No `@contexts/plants` import in `planting-spots`.
- [ ] Unit, integration, and e2e tests green.
