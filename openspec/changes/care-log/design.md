# Design: CareLog bounded context

## Technical Approach

Mirror the `planting-spots` module structure (domain → application → infrastructure → transport, CQRS, dual transport) applying tenant isolation via `createTenantRepository(rawRepo, spaceContext)` in both repo constructors. Carry both `userId` and `spaceId` like `PlantAggregate` and `PlantingSpotAggregate`.

The cross-context link to `plants` follows the established adapter-via-QueryBus pattern: `ICareLogPort` is defined in `plants/application/ports/`, implemented by `CareLogAdapter` in `plants/infrastructure/adapters/` (same shape as `PlantingSpotAdapter`). The `plants` context dispatches `CareLogFindLastByTypeQuery` through the global `QueryBus` — no direct import of care-log repositories from plants.

## Architecture Decisions

| Decision | Choice | Alternatives rejected | Rationale |
|----------|--------|-----------------------|-----------|
| Tenant isolation | `createTenantRepository` in both repo constructors | Non-tenant like plant-species | Entries are scoped to a space; all reads/writes MUST be tenant-gated |
| `activityType` modeling | `EnumValueObject<CareLogActivityTypeEnum>` in `domain/enums/` | Plain string VO | Matches `PlantingSpotTypeValueObject`; domain validates membership at construction |
| `unit` modeling | `EnumValueObject<CareLogUnitEnum>` — nullable via VO wrapping `null` | DB-only constraint | Domain validates the pair rule; VO null-wrapping is already the pattern for optional enums |
| quantity + unit pair rule | Enforced in `CareLogEntryAggregate.create()` and `update()` | Application layer only | Domain invariant — belongs in aggregate, not handler |
| `performedAt` | Required field, defaults to `new Date()` in handler when not provided | Store as string | Typed timestamp; timezone-aware (TIMESTAMPTZ in PG) |
| Cross-context port | `ICareLogPort` in `plants/application/ports/` + `CareLogAdapter` in `plants/infrastructure/adapters/` via QueryBus | Direct import of care-log read repo from plants | Maintains bounded-context isolation; established pattern (PlantingSpotAdapter) |
| `findLastByType` return type | `CareLogEntryViewModel \| null` (query handler), `Date \| null` (port) | Return full VM via port | Port exposes only what the consumer needs (`performedAt`); avoids plants knowing VM shape |
| Migration number | `1780000000016-CreateCareLog` | — | Next free slot after existing `...0014` duplicates |

## Data Flow

```
REST/GraphQL ──(JwtAuthGuard + SpaceGuard)──> Command/Query
     │                                              │
CommandBus ──> Handler ──> Builder ──> Aggregate ──> WriteRepo(tenant) ──> PG
     │              │                                   (space_id injected)
     │         AssertEntryExists / domain invariants
QueryBus  ──> Handler ──> ReadRepo(tenant, WHERE space_id + plantId/activityType) ──> ViewModel ──> DTO

Cross-context (plants → care-log):
PlantCareLogResolvedFieldsResolver
  ──> ICareLogPort (CARE_LOG_PORT)
  ──> CareLogAdapter
  ──> QueryBus.execute(CareLogFindLastByTypeQuery)
  ──> CareLogFindLastByTypeHandler
  ──> CareLogEntryReadRepo.findLastByType(plantId, spaceId, activityType)
  ──> performedAt: Date | null
```

## File Changes

All new files under `src/contexts/care-log/`. Tree (≈53 files):

```
domain/
  aggregates/care-log-entry.aggregate.ts
  builders/care-log-entry.builder.ts
  enums/care-log-activity-type.enum.ts
  enums/care-log-unit.enum.ts
  events/care-log-entry-created/care-log-entry-created.event.ts
  events/care-log-entry-updated/care-log-entry-updated.event.ts
  events/care-log-entry-deleted/care-log-entry-deleted.event.ts
  events/interfaces/care-log-event-data.interface.ts
  exceptions/care-log-entry-not-found.exception.ts          # 404
  exceptions/care-log-entry-forbidden.exception.ts          # 403
  exceptions/care-log-quantity-unit-mismatch.exception.ts   # 422
  interfaces/care-log-entry.interface.ts
  primitives/care-log-entry.primitives.ts
  repositories/read/care-log-entry-read.repository.ts
  repositories/write/care-log-entry-write.repository.ts
  value-objects/care-log-id/care-log-id.value-object.ts
  value-objects/care-log-activity-type/care-log-activity-type.value-object.ts
  value-objects/care-log-notes/care-log-notes.value-object.ts
  value-objects/care-log-quantity/care-log-quantity.value-object.ts
  value-objects/care-log-unit/care-log-unit.value-object.ts
  value-objects/care-log-performed-at/care-log-performed-at.value-object.ts
  view-models/care-log-entry.view-model.ts
application/
  commands/create-care-log-entry/create-care-log-entry.command.ts + .handler.ts
  commands/update-care-log-entry/update-care-log-entry.command.ts + .handler.ts
  commands/delete-care-log-entry/delete-care-log-entry.command.ts + .handler.ts
  queries/care-log-find-by-plant/care-log-find-by-plant.query.ts + .handler.ts
  queries/care-log-find-by-space/care-log-find-by-space.query.ts + .handler.ts
  queries/care-log-find-last-by-type/care-log-find-last-by-type.query.ts + .handler.ts
  services/write/assert-care-log-entry-exists/assert-care-log-entry-exists.service.ts
  services/read/assert-care-log-entry-view-model-exists/assert-care-log-entry-view-model-exists.service.ts
infrastructure/
  persistence/typeorm/entities/care-log-entry.entity.ts
  persistence/typeorm/mappers/care-log-entry-typeorm.mapper.ts
  persistence/typeorm/repositories/care-log-entry-typeorm-write.repository.ts
  persistence/typeorm/repositories/care-log-entry-typeorm-read.repository.ts
transport/
  rest/controllers/care-log.controller.ts
  rest/dtos/create-care-log-entry.dto.ts
  rest/dtos/update-care-log-entry.dto.ts
  rest/dtos/care-log-rest-response.dto.ts
  rest/mappers/care-log/care-log.mapper.ts
  graphql/enums/care-log-registered-enums.graphql.ts
  graphql/dtos/requests/create-care-log-entry-graphql.dto.ts
  graphql/dtos/requests/update-care-log-entry-graphql.dto.ts
  graphql/dtos/requests/care-log-find-by-space-graphql.dto.ts
  graphql/dtos/responses/care-log-entry.response.dto.ts
  graphql/mappers/care-log/care-log.mapper.ts
  graphql/resolvers/care-log-mutations.resolver.ts
  graphql/resolvers/care-log-queries.resolver.ts
care-log.module.ts
```

Modified files:

| File | Action | Description |
|------|--------|-------------|
| `src/database/migrations/1780000000016-CreateCareLog.ts` | Create | `care_log_entries` table + indexes |
| `src/app.module.ts` | Modify | Register `CareLogModule` |
| `src/contexts/plants/application/ports/care-log.port.ts` | Create | `ICareLogPort` + `CARE_LOG_PORT` token |
| `src/contexts/plants/infrastructure/adapters/care-log.adapter.ts` | Create | `CareLogAdapter` |
| `src/contexts/plants/transport/graphql/resolvers/plant/plant-care-log-resolved-fields.resolver.ts` | Create | `lastWateredAt`, `lastFertilizedAt` resolved fields |
| `src/contexts/plants/transport/graphql/dtos/responses/plant/plant.response.dto.ts` | Modify | Add `lastWateredAt?`, `lastFertilizedAt?` nullable `Date` fields |
| `src/contexts/plants/plants.module.ts` | Modify | Register `CareLogAdapter` bound to `CARE_LOG_PORT` |
| `src/contexts/care-log/README.md` | Create | Context documentation |
| `src/contexts/plants/README.md` | Update | Document new resolved fields |

## Interfaces / Contracts

```ts
// domain/enums/care-log-activity-type.enum.ts
export enum CareLogActivityTypeEnum {
  WATERING = 'WATERING',
  FERTILIZING = 'FERTILIZING',
  PRUNING = 'PRUNING',
  REPOTTING = 'REPOTTING',
  TRANSPLANTING = 'TRANSPLANTING',
  PEST_TREATMENT = 'PEST_TREATMENT',
  MISTING = 'MISTING',
  ROTATION = 'ROTATION',
  OTHER = 'OTHER',
}

// domain/enums/care-log-unit.enum.ts
export enum CareLogUnitEnum {
  ML = 'ML',
  L = 'L',
  G = 'G',
  KG = 'KG',
}

// domain/repositories/read/care-log-entry-read.repository.ts
export const CARE_LOG_ENTRY_READ_REPOSITORY = Symbol('CARE_LOG_ENTRY_READ_REPOSITORY');
export interface Pagination { page: number; limit: number; }
export interface CareLogSpaceCriteria extends Pagination {
  activityTypes?: string[];
  fromDate?: Date;
  toDate?: Date;
}
export interface ICareLogEntryReadRepository extends IBaseReadRepository<CareLogEntryViewModel> {
  findByPlant(plantId: string, spaceId: string, pagination: Pagination): Promise<CareLogEntryViewModel[]>;
  findBySpace(spaceId: string, criteria: CareLogSpaceCriteria): Promise<CareLogEntryViewModel[]>;
  findLastByType(plantId: string, spaceId: string, activityType: string): Promise<CareLogEntryViewModel | null>;
}

// plants/application/ports/care-log.port.ts
export const CARE_LOG_PORT = Symbol('CARE_LOG_PORT');
export interface ICareLogPort {
  findLastPerformedAt(plantId: string, spaceId: string, activityType: string): Promise<Date | null>;
}
```

## Database Schema

Table: `care_log_entries`

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | UUID | No | PK |
| plant_id | UUID | No | No FK constraint (Phase 1) |
| user_id | UUID | No | Author |
| space_id | UUID | No | Tenant; injected by tenant repo |
| activity_type | varchar(32) | No | Stored as enum string |
| performed_at | TIMESTAMPTZ | No | |
| notes | text | Yes | |
| quantity | decimal(10,3) | Yes | |
| unit | varchar(8) | Yes | |
| created_at | TIMESTAMPTZ | No | |
| updated_at | TIMESTAMPTZ | No | |

Indexes:
- `IDX_care_log_entries_space_id` on `(space_id)` — tenant scoping
- `IDX_care_log_entries_plant_id_space_id` on `(plant_id, space_id)` — `findByPlant` hot path
- `IDX_care_log_entries_performed_at` on `(plant_id, space_id, performed_at DESC)` — `findLastByType` + ordered list

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | Aggregate quantity+unit pair rule, `CareLogActivityTypeValueObject` validation, `performedAt` future guard, assert services, command handlers (happy + 403 + 404), query handlers | Jest, `jest.Mocked<T>` |
| Integration | Tenant isolation (SC-15), `findByPlant` ordering (SC-11), `findBySpace` date range (SC-12), `findLastByType` (SC-13, SC-14) | Real Postgres + `createTenantRepository` |
| E2E | REST + GraphQL CRUD behind `JwtAuthGuard` + `SpaceGuard`; `lastWateredAt` resolved field (SC-16) | supertest |
| Static | No import from `plants` in `care-log` context (SC-17) | Jest static scan |

## Migration / Rollout

Single additive migration `1780000000016-CreateCareLog`; `down()` drops `care_log_entries`. No data backfill. `care-log` context has no FK to `plants` in Phase 1 (cross-context integrity is not enforced at DB level — consistent with the existing pattern for `plant_id` references in other contexts).

## Open Questions

- [ ] Should `findByPlant` return a paginated wrapper DTO (total count) or a plain array? Recommendation: paginated wrapper consistent with other `findByCriteria` queries.
- [ ] Should `performedAt` future-guard be a VO invariant or a command handler validation? Recommendation: VO invariant (`CareLogPerformedAtValueObject` validates `value <= new Date()`) to keep domain-pure.
