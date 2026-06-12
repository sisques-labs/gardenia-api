# Design: Harvest Module (`harvests`)

## Technical Approach

Mirror the `planting-spots` bounded context structure (domain → application → infrastructure → transport, CQRS, dual transport) with tenant isolation via `createTenantRepository(rawRepo, spaceContext)`. No ports, no cross-context adapters — `harvests` is fully standalone. `cropType` is a free-text `StringValueObject`. `unit` is an `EnumValueObject` over `HarvestUnitEnum`. `quantity` is a `NumberValueObject` with a `> 0` guard. `harvestedAt` is stored as `timestamptz` and exposed as `Date`.

## Architecture Decisions

| Decision | Choice | Alternatives rejected | Rationale |
|----------|--------|-----------------------|-----------|
| `cropType` modeling | Free-text `HarvestCropTypeValueObject extends StringValueObject` | FK to `plant-species` | Agreed in design session: v1 should have no friction; catalog link deferred |
| Tenant isolation | `createTenantRepository` in BOTH repo constructors | Non-tenant repos | `harvests` is space-scoped; follows `planting-spots` pattern |
| `quantity` storage | `decimal(10,3)` column in Postgres; VO wraps `parseFloat` | `float8` | Avoids IEEE-754 drift on fractional kg/liters |
| No ownership gate | Any space member can update/delete | Owner-only | Explicit decision in design session: collaborative harvest log |
| `harvestedAt` field | Required, separate from `createdAt` | Use `createdAt` | Allows backdated entries; common for harvest apps |
| No `plantId` FK | Not present in v1 | Link to `PlantAggregate` | Explicit scope decision; future change can add |
| Unit enum | `KG \| G \| PIECES \| LITERS \| ML \| BUNCHES` | Free text | Structured data needed for future aggregation |

## Data Flow

```
REST/GraphQL ──(JwtAuthGuard + SpaceGuard)──> Command/Query
     │                                              │
CommandBus ──> Handler ──> Builder ──> Aggregate ──> WriteRepo(tenant) ──> PG
     │              │                                   (space_id injected)
     │         AssertExists (read repo, 404 on miss)
QueryBus  ──> Handler ──> ReadRepo(tenant, WHERE space_id) ──> ViewModel ──> Mapper ──> DTO
```

## File Changes

All new under `src/contexts/harvests/`. Tree (≈42 files):

```
domain/
  aggregates/harvest.aggregate.ts
  builders/harvest.builder.ts
  enums/harvest-unit.enum.ts
  events/harvest-created/harvest-created.event.ts
  events/harvest-updated/harvest-updated.event.ts
  events/harvest-deleted/harvest-deleted.event.ts
  events/field-changed/crop-type-changed/crop-type-changed.event.ts
  events/field-changed/quantity-changed/quantity-changed.event.ts
  events/field-changed/unit-changed/unit-changed.event.ts
  events/field-changed/harvested-at-changed/harvested-at-changed.event.ts
  events/interfaces/harvest-event-data.interface.ts
  exceptions/harvest-not-found.exception.ts                    # 404
  interfaces/harvest.interface.ts
  primitives/harvest.primitives.ts
  repositories/read/harvest-read.repository.ts                 # IHarvestReadRepository + HARVEST_READ_REPOSITORY
  repositories/write/harvest-write.repository.ts               # IHarvestWriteRepository + HARVEST_WRITE_REPOSITORY
  value-objects/harvest-id/harvest-id.value-object.ts
  value-objects/harvest-crop-type/harvest-crop-type.value-object.ts
  value-objects/harvest-quantity/harvest-quantity.value-object.ts
  value-objects/harvest-unit/harvest-unit.value-object.ts
  value-objects/harvest-harvested-at/harvest-harvested-at.value-object.ts
  view-models/harvest.view-model.ts
application/
  commands/create-harvest/create-harvest.command.ts
  commands/create-harvest/create-harvest.handler.ts
  commands/update-harvest/update-harvest.command.ts
  commands/update-harvest/update-harvest.handler.ts
  commands/delete-harvest/delete-harvest.command.ts
  commands/delete-harvest/delete-harvest.handler.ts
  queries/harvest-find-by-id/harvest-find-by-id.query.ts
  queries/harvest-find-by-id/harvest-find-by-id.handler.ts
  queries/harvest-find-by-criteria/harvest-find-by-criteria.query.ts
  queries/harvest-find-by-criteria/harvest-find-by-criteria.handler.ts
  services/write/assert-harvest-exists/assert-harvest-exists.service.ts
  services/read/assert-harvest-view-model-exists/assert-harvest-view-model-exists.service.ts
infrastructure/
  persistence/typeorm/entities/harvest.entity.ts
  persistence/typeorm/mappers/harvest-typeorm.mapper.ts
  persistence/typeorm/repositories/harvest-typeorm-write.repository.ts
  persistence/typeorm/repositories/harvest-typeorm-read.repository.ts
transport/
  rest/controllers/harvests.controller.ts
  rest/dtos/create-harvest.dto.ts
  rest/dtos/update-harvest.dto.ts
  rest/dtos/harvest-rest-response.dto.ts
  rest/mappers/harvest/harvest.mapper.ts
  graphql/resolvers/harvest-queries.resolver.ts
  graphql/resolvers/harvest-mutations.resolver.ts
  graphql/dtos/requests/create-harvest-graphql.dto.ts
  graphql/dtos/requests/update-harvest-graphql.dto.ts
  graphql/dtos/requests/harvest-criteria-graphql.dto.ts
  graphql/dtos/responses/harvest.response.dto.ts
  graphql/mappers/harvest.mapper.ts
  graphql/enums/harvest-registered-enums.graphql.ts
harvests.module.ts
```

| File | Action | Description |
|------|--------|-------------|
| `src/database/migrations/1780000000015-CreateHarvests.ts` | Create | `harvests` table + `IDX_harvests_space_id` |
| `src/app.module.ts` | Modify | Register `HarvestsModule` |

## Interfaces / Contracts

```ts
// domain/enums/harvest-unit.enum.ts
export enum HarvestUnitEnum {
  KG = 'KG',
  G = 'G',
  PIECES = 'PIECES',
  LITERS = 'LITERS',
  ML = 'ML',
  BUNCHES = 'BUNCHES',
}

// domain/repositories/read/harvest-read.repository.ts
export const HARVEST_READ_REPOSITORY = Symbol('HARVEST_READ_REPOSITORY');
export type HarvestCriteria = {
  cropType?: string;      // ILIKE %value%
  unit?: HarvestUnitEnum;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
};
export interface IHarvestReadRepository extends IBaseReadRepository<HarvestViewModel> {
  findByCriteria(criteria: HarvestCriteria): Promise<HarvestViewModel[]>;
}

// domain/repositories/write/harvest-write.repository.ts
export const HARVEST_WRITE_REPOSITORY = Symbol('HARVEST_WRITE_REPOSITORY');
export interface IHarvestWriteRepository extends IBaseWriteRepository<HarvestAggregate> {}
```

**Entity columns**: `id` (uuid pk), `crop_type` (varchar 200 NOT NULL), `quantity` (decimal(10,3) NOT NULL), `unit` (varchar NOT NULL), `harvested_at` (timestamptz NOT NULL), `user_id` (uuid NOT NULL), `space_id` (uuid NOT NULL), `created_at` (timestamptz), `updated_at` (timestamptz). Index on `space_id`.

**Aggregate**: VOs for all fields. `create()`, `update({cropType?, quantity?, unit?, harvestedAt?})`, `delete()` emit events. `update()` checks per-field change events only when value differs.

**Builder**: receives primitives, constructs VOs, passes `IHarvest` to aggregate constructor.

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | Aggregate events, `HarvestQuantityValueObject` (≤0 throws), `HarvestCropTypeValueObject` (empty throws), `HarvestUnitValueObject` (invalid throws), handler happy paths + 404 | Jest, `jest.Mocked<T>` |
| Integration | Tenant isolation (harvest in S1 invisible under S2); `cropType` ILIKE filter; `unit` filter; `dateFrom/dateTo` range; `decimal` round-trip | Test DB + SpaceContext |
| E2E | REST + GraphQL CRUD behind `JwtAuthGuard` + `SpaceGuard`; invalid unit → 400; quantity=0 → 400; tenant isolation → 404 | supertest |

## Migration / Rollout

Single additive migration `1780000000015`; `down()` drops `harvests`. No data backfill. No impact on other bounded contexts.

## Open Questions

- None. Scope is fully defined.
