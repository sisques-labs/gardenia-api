# Archive: Plant Bounded Context

**Status**: COMPLETE  
**Archived**: 2026-05-30  
**PRs**: #103 (domain+app), #104 (infra+module), #105 (transport+E2E)

## What was delivered

Fourth bounded context for gardenia-api — the core domain object of the product.

### Domain & Application (PR #103)
- `PlantAggregate` with `name`, `species`, `imageUrl`, `userId` (owner), `spaceId` (tenant)
- 4 value objects, 3 domain events + 3 field-changed events (`PlantNameChanged`, `PlantSpeciesChanged`, `PlantImageUrlChanged`)
- 3 commands (`CreatePlant`, `UpdatePlant`, `DeletePlant`) with owner-only authz in handlers
- 2 queries (`PlantFindById`, `PlantFindByCriteria`) — tenant-scoped
- 2 assert services, `BaseExceptionFilter` wired for 404/403

### Infrastructure (PR #104)
- `PlantTypeOrmEntity` + migration `1780000000005-CreatePlants`
- `PlantTypeOrmMapper`, tenant-scoped read/write repos via `createTenantRepository`
- `PlantsModule` registered in `AppModule`

### Transport (PR #105)
- REST: `PlantsController` (5 endpoints), DTOs, `PlantRestMapper`
- GraphQL: `PlantQueriesResolver`, `PlantMutationsResolver`, DTOs, `PlantGraphQLMapper`
- First dual-transport context in the project

## Test coverage

- 33 unit tests (domain + application)
- 12 integration tests (Testcontainers — tenant isolation)
- 15 E2E tests (REST — happy paths, 400/403/404)

## Pending features (tracked separately)

- **`admin-authorization`** — space admin bypass for UpdatePlant/DeletePlant owner check. The owner check in both handlers is a one-line extension point.
- **`locations` module** — `locationId` field on PlantAggregate, deferred.
- **`tasks` module** — watering schedules / `lastWateredAt`, deferred.
