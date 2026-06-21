# Harvests Context

## Purpose

The `harvests` context records and manages harvest events within a space. A **harvest** tracks what was collected (`cropType`), how much (`quantity` + `unit`), and when (`harvestedAt`), linked to the user who recorded it and the space it belongs to.

This is a standalone bounded context with no cross-context dependencies. All data is tenant-scoped via `SpaceContext`.

---

## Core aggregate

### `HarvestAggregate`

| Field | Type | Description |
|-------|------|-------------|
| `id` | `HarvestIdValueObject` | UUID generated on creation |
| `cropType` | `HarvestCropTypeValueObject` | Free-text label, 1–200 chars (e.g. `"Tomate Cherry Rojo"`) |
| `quantity` | `HarvestQuantityValueObject` | Positive decimal > 0 (stored as `decimal(10,3)`) |
| `unit` | `HarvestUnitValueObject` | `KG`, `G`, `PIECES`, `LITERS`, `ML`, or `BUNCHES` |
| `harvestedAt` | `HarvestHarvestedAtValueObject` | Date of harvest (past or present, required) |
| `userId` | `UuidValueObject` | User who recorded the harvest (`@CurrentUser`) |
| `spaceId` | `UuidValueObject` | Space owning this record (`SpaceContext` ALS) |
| `createdAt` / `updatedAt` | `Date` | Managed by TypeORM |

Domain methods:

- `create()` — applies `HarvestCreatedEvent`, call after saving via the builder
- `update(fields)` — applies `HarvestUpdatedEvent` and per-field change events for each modified field
- `delete()` — applies `HarvestDeletedEvent`

Business rules enforced in the domain:
- `quantity` must be greater than 0 (enforced by `HarvestQuantityValueObject` with `min: 0.001`)
- `cropType` must be non-empty and non-whitespace (enforced by `HarvestCropTypeValueObject`)
- Any space member can create, update, and delete any harvest within the space

---

## Architecture layers

| Layer | Path | What lives here |
|-------|------|-----------------|
| **domain** | `domain/` | `HarvestAggregate`, `HarvestBuilder`, value objects, domain events, repository interfaces (`IHarvestReadRepository`, `IHarvestWriteRepository`), `HarvestNotFoundException`, `HarvestUnitEnum` |
| **application** | `application/` | Command handlers (`CreateHarvestCommandHandler`, `UpdateHarvestCommandHandler`, `DeleteHarvestCommandHandler`), query handlers (`HarvestFindByIdQueryHandler`, `HarvestFindByCriteriaQueryHandler`) |
| **infrastructure** | `infrastructure/` | TypeORM repository implementations (`HarvestTypeOrmReadRepository`, `HarvestTypeOrmWriteRepository`), `HarvestTypeOrmMapper`, `HarvestTypeOrmEntity` |
| **transport** | `transport/` | `HarvestsController` (REST CRUD), `HarvestQueriesResolver` + `HarvestMutationsResolver` (GraphQL), DTOs, mappers, exception filter |

---

## Public API

All endpoints require:
- `Authorization: Bearer <accessToken>` — enforced by `JwtAuthGuard`
- `X-Space-ID: <uuid>` — enforced by the global `SpaceGuard`

### REST Endpoints

Base path: `/harvests`

| Method | Path | Status | Description |
|--------|------|--------|-------------|
| `POST` | `/harvests` | 201 | Record a new harvest |
| `GET` | `/harvests` | 200 | List harvests (with optional filters) |
| `GET` | `/harvests/:id` | 200 | Get a single harvest by ID |
| `PATCH` | `/harvests/:id` | 200 | Update a harvest |
| `DELETE` | `/harvests/:id` | 200 | Delete a harvest |

**GET `/harvests` query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `cropType` | `string` | Case-insensitive partial match on `crop_type` |
| `unit` | `HarvestUnitEnum` | Exact match on `unit` |
| `dateFrom` | `ISO date string` | Filter `harvestedAt >= dateFrom` |
| `dateTo` | `ISO date string` | Filter `harvestedAt <= dateTo` |
| `page` | `number` | Page number (default: 1) |
| `limit` | `number` | Items per page (default: 20) |

**POST `/harvests` body:**

```json
{
  "cropType": "Tomate Cherry Rojo",
  "quantity": 2.5,
  "unit": "KG",
  "harvestedAt": "2026-06-01T00:00:00.000Z"
}
```

### GraphQL Operations

| Name | Type | Auth | `X-Space-ID` | Description |
|------|------|------|--------------|-------------|
| `harvestsFindByCriteria(input?)` | Query | No* | No* | Returns paginated harvests matching optional filters/sorts/pagination |
| `harvestFindById(input)` | Query | No* | No* | Returns a single harvest by id, or `null` |
| `harvestCreate(input)` | Mutation | Yes | Yes | Records a new harvest. Returns `MutationResponseDto` |
| `harvestUpdate(input)` | Mutation | Yes | Yes | Updates a harvest. Returns `MutationResponseDto` |
| `harvestDelete(input)` | Mutation | Yes | Yes | Deletes a harvest. Returns `MutationResponseDto` |

> *Queries do not declare explicit guards but rely on the global `SpaceGuard` + `SpaceInterceptor` when `X-Space-ID` is present.

Example:

```graphql
mutation {
  harvestCreate(input: {
    cropType: "Tomate Cherry Rojo"
    quantity: 2.5
    unit: KG
    harvestedAt: "2026-06-01T00:00:00.000Z"
  }) {
    success
    message
    id
  }
}

query {
  harvestsFindByCriteria(input: {
    pagination: { page: 1, perPage: 20 }
  }) {
    items {
      id
      cropType
      quantity
      unit
      harvestedAt
    }
    total
    page
    perPage
    totalPages
  }
}

mutation {
  harvestDelete(input: { id: "uuid-here" }) {
    success
    message
  }
}
```

---

## Commands & Queries

| Class | Type | Purpose |
|-------|------|---------|
| `CreateHarvestCommand` | Command | Records a new harvest for a user+space |
| `UpdateHarvestCommand` | Command | Updates one or more fields of an existing harvest |
| `DeleteHarvestCommand` | Command | Removes a harvest |
| `HarvestFindByIdQuery` | Query | Returns a `HarvestViewModel` by id |
| `HarvestFindByCriteriaQuery` | Query | Returns `PaginatedResult<HarvestViewModel>` matching a `Criteria` |

---

## Domain Events

| Class | When emitted |
|-------|-------------|
| `HarvestCreatedEvent` | When `HarvestAggregate.create()` is called |
| `HarvestUpdatedEvent` | When `HarvestAggregate.update()` is called |
| `HarvestDeletedEvent` | When `HarvestAggregate.delete()` is called |
| `HarvestCropTypeChangedEvent` | When `cropType` changes during `update()` |
| `HarvestQuantityChangedEvent` | When `quantity` changes during `update()` |
| `HarvestUnitChangedEvent` | When `unit` changes during `update()` |
| `HarvestHarvestedAtChangedEvent` | When `harvestedAt` changes during `update()` |

---

## How to Test This Module

**Unit tests** (no database, no HTTP):

```bash
pnpm test src/contexts/harvests
```

Unit spec files live next to their source files. They use direct class instantiation with `jest.Mocked<T>` collaborators — no NestJS DI container.

**E2E tests** (requires Docker):

```bash
docker compose -f docker-compose.test.yml up -d
pnpm test:e2e --testPathPattern=harvests
```

E2E coverage lives in `test/e2e/harvests/`. REST and GraphQL are each covered in a separate spec file (`harvests-rest.e2e-spec.ts`, `harvests-graphql.e2e-spec.ts`). Tests include tenant isolation assertions (cross-space queries return 404).

**Cross-context isolation test:**

```bash
pnpm test src/contexts/harvests/harvests-no-cross-context-import.spec.ts
```

Statically verifies that no file in the harvests context imports from other bounded contexts.

---

## Configuration & Dependencies

### Environment Variables

The harvests context has no environment variables of its own. It relies on the shared database config (`src/core/config/postgres.config.ts`):

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_HOST` | Yes | Postgres host |
| `DATABASE_PORT` | No | Postgres port (default: `5432`) |
| `DATABASE_USERNAME` | Yes | Postgres username |
| `DATABASE_PASSWORD` | Yes | Postgres password |
| `DATABASE_DATABASE` | Yes | Postgres database name |

### `@sisques-labs/nestjs-kit` base classes used

| Class / Type | Used by |
|---|---|
| `BaseAggregate` | `HarvestAggregate` — provides `apply()` and `getUncommittedEvents()` |
| `BaseBuilder` | `HarvestBuilder` — fluent aggregate construction |
| `NumberValueObject` | `HarvestQuantityValueObject` — with `{ min: 0.001 }` to enforce positive values |
| `StringValueObject` | `HarvestCropTypeValueObject` |
| `EnumValueObject` | `HarvestUnitValueObject` |
| `DateValueObject` | `HarvestHarvestedAtValueObject` |
| `UuidValueObject` | `HarvestIdValueObject`, `userId`, `spaceId` |
| `BaseDatabaseRepository` | Both TypeORM repositories — provides `calculatePagination()` |
| `IBaseReadRepository` | `IHarvestReadRepository` type alias |
| `Criteria` / `Filter` / `FilterOperator` | `HarvestFindByCriteriaQuery` and REST controller filter building |
| `PaginatedResult` | Return type of `findByCriteria` |
| `MutationResponseDto` | Return type of GraphQL mutations |
| `BaseFindByCriteriaInput` | `HarvestFindByCriteriaRequestDto` (GraphQL input) |
| `BaseEvent` / `IFieldChangedEventData` | All domain events |
| `BaseException` | `HarvestNotFoundException` |

### External NestJS packages

- `@nestjs/cqrs` — `CommandBus`, `QueryBus`, `CqrsModule`
- `@nestjs/typeorm` — `TypeOrmModule.forFeature([HarvestTypeOrmEntity])`
- `@nestjs/graphql` — `@Resolver()`, `@Query()`, `@Mutation()`, `@Args()`
- `@nestjs/swagger` — `@ApiTags()`, `@ApiResponse()` on `HarvestsController`

---

## Domain exceptions → HTTP status

Mapped in `transport/exceptions/harvests-exception.filter.ts`:

| Exception | HTTP |
|-----------|------|
| `HarvestNotFoundException` | 404 Not Found |

---

## Database

### `harvests`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | PK |
| `crop_type` | `varchar(200)` | Free-text label |
| `quantity` | `decimal(10,3)` | Positive decimal; TypeORM returns as string — mapper parses to `number` |
| `unit` | `enum` | `KG`, `G`, `PIECES`, `LITERS`, `ML`, `BUNCHES` |
| `harvested_at` | `timestamptz` | Indexed (`IDX_harvests_harvested_at`) for date-range queries |
| `user_id` | `uuid` | Who recorded the harvest |
| `space_id` | `uuid` | Tenant column — used by `createTenantRepository` |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

Migration: `src/database/migrations/1780000000015-CreateHarvests.ts`

**Tenant isolation:** `HarvestTypeOrmReadRepository` and `HarvestTypeOrmWriteRepository` both use `createTenantRepository(rawRepo, spaceContext)` to automatically scope all queries to the active `spaceId` from `SpaceContext` ALS.

---

## Things to know before making changes

1. **No cross-context imports** — harvests must not import from `@contexts/plants`, `@contexts/users`, or any other bounded context. The static scan in `harvests-no-cross-context-import.spec.ts` enforces this.
2. **`quantity` is a decimal stored as string** — TypeORM returns `decimal` columns as `string`. `HarvestTypeOrmMapper.toViewModel()` parses it with `parseFloat`. Always verify round-trip behaviour when touching the mapper.
3. **`SpaceContext` is global** — never add it to `HarvestsModule.providers`. Import from `@shared/space-context/space-context.service` and rely on the `SharedModule` registration.
4. **`SpaceGuard` is global** — registered via `APP_GUARD` in `AppModule`. No need for `@UseGuards(SpaceGuard)` on harvest controllers or resolvers.
5. **`harvestedAt` is indexed** — the `IDX_harvests_harvested_at` index supports efficient date-range filtering. If adding new frequent filter fields, add matching indexes in a new migration.

## MCP Tools

Exposed under `transport/mcp/` for AI clients (see `src/core/mcp/README.md`). Each tool dispatches through the Command/Query bus; the acting user and active space come from the authenticated MCP request context.

| Tool | Action |
|------|--------|
| `harvest_create` | Record a harvest |
| `harvest_update` | Update a harvest |
| `harvest_delete` | Delete a harvest |
| `harvest_find_by_id` | Get a harvest by id |
| `harvest_find_by_criteria` | Paginated list of harvests |
