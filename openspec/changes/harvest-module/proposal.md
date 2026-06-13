# Proposal: Harvest Module (`harvests`)

## Intent

Gardenia tracks plants but has no way to record production. A user with 10 tomato plants cannot answer "how much did we harvest this month?" because there is no harvest concept in the domain.

This change introduces a **tenant-scoped `harvests` bounded context**: a log of harvest events keyed by free-text crop type, quantity (decimal), and a fixed unit enum. Any space member can record, edit, or delete harvests. The design is intentionally minimal — no link to `PlantAggregate` or `PlantSpecies`, no analytics engine — to ship a useful feature fast and leave structured linking to a future change.

## Scope

### In Scope
- New `harvests` bounded context (domain → application → infrastructure → transport).
- `HarvestAggregate` fields: `id` (UUID), `cropType` (free text, non-empty, max 200 chars), `quantity` (positive decimal), `unit` (enum), `harvestedAt` (Date), `userId`, `spaceId`, `createdAt`, `updatedAt`.
- `HarvestUnitEnum`: `KG | G | PIECES | LITERS | ML | BUNCHES`.
- Commands: `CreateHarvest`, `UpdateHarvest`, `DeleteHarvest` — any authenticated space member.
- Queries: `HarvestFindById`, `HarvestFindByCriteria` (filters: `cropType` partial match, `unit`, `dateFrom`/`dateTo` on `harvestedAt`; paginated).
- Events: `HarvestCreated`, `HarvestUpdated`, `HarvestDeleted`.
- Dual transport: REST (`/harvests`, full CRUD) + GraphQL. Guards: `JwtAuthGuard` + `SpaceGuard`.
- TypeORM entity + migration `1780000000015-CreateHarvests` with `space_id` column; tenant isolation via `createTenantRepository`.
- Register `HarvestsModule` in `src/app.module.ts`.

### Out of Scope
- Link to `PlantAggregate` or `PlantSpeciesAggregate` (free-text `cropType` is intentional for v1).
- Aggregation queries / analytics (total per species, trend charts).
- Image upload for harvest photos.
- Per-harvest access control beyond "any space member" (no ownership check).

## Capabilities

### New Capabilities
- `harvests`: Tenant-scoped CRUD for harvest events (crop type, quantity, unit, date), REST + GraphQL.

### Modified Capabilities
- None. `harvests` is fully standalone.

## Approach

- **No cross-context coupling**: `harvests` MUST NOT import from `plants`, `plant-species`, or any other bounded context. `cropType` is a free-text VO.
- **Tenant isolation**: `createTenantRepository` proxy on both read and write repos (same pattern as `planting-spots`).
- **Ownership**: `userId` is stored (the recorder) but NOT used as an access gate — any space member may update or delete any harvest in the space.
- **`harvestedAt`**: Required Date field distinct from `createdAt`; allows backdated entries.
- **`quantity`**: Stored as `decimal(10,3)` in Postgres; domain VO enforces `> 0`.
- **`unit`**: `EnumValueObject` over `HarvestUnitEnum`; registered with GraphQL via `registerEnumType`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/contexts/harvests/` | New | Full bounded context |
| `src/database/migrations/1780000000015-CreateHarvests.ts` | New | `harvests` table with `space_id`, `decimal(10,3)` quantity |
| `src/app.module.ts` | Modified | Register `HarvestsModule` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Missing `createTenantRepository` → cross-tenant data leak | Med | Integration test asserting tenant isolation on read + write |
| Free-text `cropType` produces unstructured data | Low | Accepted tradeoff for v1; future change can add `plantSpeciesId` link |
| `decimal` precision loss via JS float | Low | Store as `decimal(10,3)` string in TypeORM; VO wraps `parseFloat`; integration test verifies round-trip |
| Migration timestamp conflict | Low | Confirmed highest is `1780000000014`; use `...0015` |

## Rollback Plan

Revert branch; run migration `down()` (drops `harvests` table). No data migration in other tables — additive and isolated.

## Dependencies

- None external. Reuses `JwtAuthGuard`, `SpaceGuard`, `createTenantRepository`, `BaseAggregate`/`BaseBuilder` from `@sisques-labs/nestjs-kit`.

## Success Criteria

- [ ] CRUD via REST and GraphQL behind `JwtAuthGuard` + `SpaceGuard`.
- [ ] Reads/writes tenant-isolated via `createTenantRepository` (integration test proves it).
- [ ] `quantity > 0` enforced at VO level; `cropType` non-empty enforced at VO level.
- [ ] `HarvestFindByCriteria` supports `cropType` partial match, `unit` filter, `dateFrom`/`dateTo` range.
- [ ] No `@contexts/plants` or `@contexts/plant-species` import in `harvests`.
- [ ] Unit, integration, and e2e tests green.
