# Design: PlantingSpots bounded context (Phase 1)

## Technical Approach

Mirror the proven `plant-species` module structure (domain → application → infrastructure → transport, CQRS, dual transport) but apply tenant isolation using the **QR repository pattern** (`createTenantRepository(rawRepo, spaceContext)` inside the repo constructor) — NOT the plant-species repos, which are intentionally non-tenant. Carry both `userId` and `spaceId` like `PlantAggregate`. `type` is an `EnumValueObject` over a local enum. The delete guard (`AssertPlantingSpotNotInUseService` + `IPlantingSpotInUsePort`) is wired now; a stub adapter returns 0 in Phase 1.

## Architecture Decisions

| Decision | Choice | Alternatives rejected | Rationale |
|----------|--------|-----------------------|-----------|
| Tenant isolation | `createTenantRepository` in BOTH repo constructors (QR pattern) | plant-species non-tenant repos | Spec mandates tenant scope on `space_id`; QR is the live tenant exemplar |
| `type` modeling | `PlantingSpotTypeValueObject extends EnumValueObject` + local `PlantingSpotTypeEnum` in `domain/enums/` | string VO; DB-only enum | Matches `MembershipRoleValueObject`; domain validates membership |
| Delete-in-use guard | Port + stub adapter wired now, returns 0 | defer wiring to Phase 2 | Confirmed decision; avoids re-touching delete handler in Phase 2 |
| In-use port shape | `IPlantingSpotInUsePort.countByPlantingSpotId(id): Promise<number>` | boolean `isInUse` | Count mirrors `IPlantSpeciesReferencePort`; reusable for messaging |
| No `plants` import | port direction `plants → planting-spots` only (Phase 2) | direct query into `plants` | Prevents circular dep; spec rule |
| Migration | `1780000000010-CreatePlantingSpots`, `space_id` + index | — | Highest existing is `...0009`; QR migration is the template |

## Data Flow

    REST/GraphQL ──(JwtAuthGuard + SpaceGuard)──> Command/Query
         │                                              │
    CommandBus ──> Handler ──> Builder ──> Aggregate ──> WriteRepo(tenant) ──> PG
         │              │                                   (space_id injected)
         │         AssertExists / AssertNotInUse(port→stub:0)
    QueryBus  ──> Handler ──> ReadRepo(tenant, WHERE space_id) ──> ViewModel ──> Mapper ──> DTO

## File Changes

All new under `src/contexts/planting-spots/`. Tree (≈40 files):

```
domain/
  aggregates/planting-spot.aggregate.ts
  builders/planting-spot.builder.ts
  enums/planting-spot-type.enum.ts
  events/planting-spot-created|updated|deleted/*.event.ts
  events/field-changed/{name,type,description}-changed/*.event.ts
  events/interfaces/planting-spot-event-data.interface.ts
  exceptions/planting-spot-not-found.exception.ts          # 404
  exceptions/planting-spot-in-use.exception.ts             # 409
  interfaces/planting-spot.interface.ts
  primitives/planting-spot.primitives.ts
  repositories/read/planting-spot-read.repository.ts        # + PLANTING_SPOT_READ_REPOSITORY
  repositories/write/planting-spot-write.repository.ts      # + PLANTING_SPOT_WRITE_REPOSITORY
  value-objects/planting-spot-id|name|type|description/*.value-object.ts
  view-models/planting-spot.view-model.ts
application/
  commands/create|update|delete-planting-spot/*.command.ts + *.handler.ts
  queries/planting-spot-find-by-id|find-by-criteria/*.query.ts + *.handler.ts
  ports/planting-spot-in-use.port.ts                        # IPlantingSpotInUsePort + token
  services/write/assert-planting-spot-exists/*.service.ts
  services/write/assert-planting-spot-not-in-use/*.service.ts
  services/read/assert-planting-spot-view-model-exists/*.service.ts
infrastructure/
  adapters/planting-spot-in-use-stub.adapter.ts            # returns 0 (Phase 1)
  persistence/typeorm/entities/planting-spot.entity.ts
  persistence/typeorm/mappers/planting-spot-typeorm.mapper.ts
  persistence/typeorm/repositories/planting-spot-typeorm-read|write.repository.ts
transport/
  rest/controllers/planting-spots.controller.ts
  rest/dtos/{create,update}-planting-spot.dto.ts + planting-spot-rest-response.dto.ts
  rest/mappers/planting-spot/planting-spot.mapper.ts
  graphql/resolvers/planting-spot-{queries,mutations}.resolver.ts
  graphql/dtos/requests/*.dto.ts + responses/planting-spot.response.dto.ts
  graphql/mappers/planting-spot.mapper.ts
  graphql/enums/planting-spot-registered-enums.graphql.ts
planting-spots.module.ts
```

| File | Action | Description |
|------|--------|-------------|
| `src/database/migrations/1780000000010-CreatePlantingSpots.ts` | Create | `planting_spots` table + `IDX_planting_spots_space_id` |
| `src/app.module.ts` | Modify | Register `PlantingSpotsModule` |
| `src/core/filters/base-exception.filter.ts` | Modify (conditional) | Map `PlantingSpotInUseException`→409 only if filter enumerates exceptions |

## Interfaces / Contracts

```ts
// domain/enums/planting-spot-type.enum.ts
export enum PlantingSpotTypeEnum {
  RAISED_BED = 'raised_bed', POT = 'pot', CONTAINER = 'container',
  FIELD_SECTION = 'field_section', OTHER = 'other',
}

// application/ports/planting-spot-in-use.port.ts
export const PLANTING_SPOT_IN_USE_PORT = Symbol('PLANTING_SPOT_IN_USE_PORT');
export interface IPlantingSpotInUsePort {
  countByPlantingSpotId(plantingSpotId: string): Promise<number>;
}
```

Repos: both extend `BaseDatabaseRepository`, build `this.repository = createTenantRepository(rawRepo, spaceContext)` in constructor (QR pattern). Stub adapter `countByPlantingSpotId` resolves `0`. Aggregate: VOs `id,name,type,description(null)`, `userId,spaceId` as `UuidValueObject`; `create/update/delete` emit events; `update` accepts `{name?,type?,description?}` with per-field change events.

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | Aggregate events, `PlantingSpotTypeValueObject` validation, `AssertPlantingSpotNotInUse` (count>0 throws) | Jest, mock port |
| Integration | Tenant isolation: spot under S1 invisible under S2; `type` filter in find-by-criteria | Test DB + SpaceContext |
| E2E | REST + GraphQL CRUD behind JwtAuthGuard + SpaceGuard; X-Space-ID required | supertest |

## Migration / Rollout

Single additive migration `1780000000010`; `down()` drops `planting_spots`. No data backfill. Stub adapter makes delete guard inert until Phase 2 swaps in a real adapter.

## Open Questions

- [ ] Confirm `base-exception.filter.ts` strategy (global vs enumerated) before editing — design assumes conditional edit.
