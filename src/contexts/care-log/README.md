# Care Log Module

Manages the **plant care journal** — a chronological record of every care activity performed on a plant (watering, fertilizing, pruning, pest treatments, etc.).

Each entry is **space-scoped** (tenant-isolated) and carries an optional quantity + unit pair so users can track dosages precisely. The module also exposes `lastWateredAt` / `lastFertilizedAt` as resolved fields on `PlantResponseDto` via a cross-context port.

---

## Quick orientation

```
src/contexts/care-log/
├── application/
│   ├── commands/          # create-care-log-entry, update-care-log-entry,
│   │                      # delete-care-log-entry
│   ├── queries/           # care-log-find-by-plant, care-log-find-by-space,
│   │                      # care-log-find-last-by-type
│   └── services/
│       ├── read/          # assert-care-log-entry-view-model-exists
│       └── write/         # assert-care-log-entry-exists
├── domain/
│   ├── aggregates/        # CareLogEntryAggregate
│   ├── builders/          # CareLogEntryBuilder
│   ├── enums/             # CareLogActivityTypeEnum, CareLogUnitEnum
│   ├── events/            # CareLogEntryCreated, Updated, Deleted
│   ├── exceptions/        # domain errors mapped to HTTP in exception filter
│   ├── repositories/      # read/write interfaces + DI tokens
│   ├── value-objects/     # id, activityType, unit, notes, quantity, performedAt
│   └── view-models/       # CareLogEntryViewModel
├── infrastructure/
│   └── persistence/typeorm/
│       ├── entities/      # care_log_entries table
│       ├── mappers/       # toDomain / toPersistence / toViewModel
│       └── repositories/  # typeorm read + write (tenant-isolated)
└── transport/
    ├── exceptions/        # resolveCareLogExceptionStatus (wired globally)
    ├── graphql/           # mutations + queries resolvers, DTOs, mapper
    └── rest/              # CareLogController, DTOs, mapper
```

---

## Core concepts

### CareLogEntry

An immutable record of a single care activity on a plant.

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Auto-generated |
| `plantId` | UUID | Reference to the plant (not FK-enforced at DB level) |
| `userId` | UUID | Who performed the activity |
| `spaceId` | UUID | Tenant scope — injected automatically from `SpaceContext` |
| `activityType` | `CareLogActivityTypeEnum` | See table below |
| `performedAt` | `timestamptz` | Defaults to `now()` on create; can be backdated but not future-dated |
| `notes` | `text` (nullable) | Free text, max 2000 chars |
| `quantity` | `decimal(10,3)` (nullable) | Positive number — must be set together with `unit` |
| `unit` | `CareLogUnitEnum` (nullable) | Must be set together with `quantity` |
| `createdAt` / `updatedAt` | `timestamptz` | Managed by TypeORM |

### Quantity / unit invariant

`quantity` and `unit` are either **both present or both absent**. Setting one without the other throws `CareLogQuantityUnitMismatchException` (HTTP 422). This rule is enforced at the aggregate level on both `create()` and `update()`.

### Activity types (`CareLogActivityTypeEnum`)

| Value | Description |
|-------|-------------|
| `WATERING` | Plain watering |
| `FERTILIZING` | Fertilizer application |
| `PRUNING` | Trimming / pruning |
| `REPOTTING` | Repotting into a new container |
| `TRANSPLANTING` | Moving to a different location |
| `PEST_TREATMENT` | Pesticide / insecticide treatment |
| `MISTING` | Leaf misting |
| `ROTATION` | Rotating the plant for even light |
| `OTHER` | Any other activity |

### Units (`CareLogUnitEnum`)

| Value | Use case |
|-------|----------|
| `ML` | Small liquid doses (e.g. fertilizer concentrate) |
| `L` | Larger liquid volumes (e.g. watering cans) |
| `G` | Solid / granular weight |
| `KG` | Larger solid quantities |

---

## REST API

All endpoints require `Authorization: Bearer <token>` and `X-Space-ID: <uuid>`.

| Method | Path | Status | Description |
|--------|------|--------|-------------|
| `POST` | `/api/care-log` | 201 | Create a care log entry |
| `GET` | `/api/care-log` | 200 | List entries for the current space (filterable) |
| `GET` | `/api/care-log/plant/:plantId` | 200 | List entries for a specific plant (paginated) |
| `GET` | `/api/care-log/:id` | 200 | Get a single entry by ID |
| `PATCH` | `/api/care-log/:id` | 200 | Update an entry (author only) |
| `DELETE` | `/api/care-log/:id` | 204 | Delete an entry (author only) |

### `GET /api/care-log` query parameters

| Param | Type | Description |
|-------|------|-------------|
| `activityTypes` | `string` | Comma-separated list of `CareLogActivityTypeEnum` values |
| `fromDate` | `ISO 8601` | Filter entries on or after this date |
| `toDate` | `ISO 8601` | Filter entries on or before this date |
| `page` | `number` | Page number (default: 1) |
| `limit` | `number` | Page size (default: 20, max: 100) |

### `GET /api/care-log/plant/:plantId` query parameters

| Param | Type | Description |
|-------|------|-------------|
| `page` | `number` | Page number (default: 1) |
| `limit` | `number` | Page size (default: 20, max: 100) |

Results are always **sorted descending by `performedAt`**.

---

## GraphQL API

All operations require JWT (`Authorization: Bearer`) and `X-Space-ID`.

### Mutations

| Operation | Description |
|-----------|-------------|
| `careLogEntryCreate(input: CreateCareLogEntryGraphQLDto)` | Create an entry |
| `careLogEntryUpdate(input: UpdateCareLogEntryGraphQLDto)` | Update an entry (author only) |
| `careLogEntryDelete(id: ID!)` | Delete an entry (author only) |

All mutations return `MutationResponseDto { success, message, id }`.

### Queries

| Operation | Description |
|-----------|-------------|
| `careLogFindById(id: ID!)` | Get a single entry |
| `careLogEntriesByPlant(plantId: ID!, page: Int, limit: Int)` | List entries for a plant, desc by `performedAt` |
| `careLogEntriesBySpace(input: CareLogFindBySpaceGraphQLDto)` | List entries for the space (filterable) |

`CareLogFindBySpaceGraphQLDto` accepts: `activityTypes`, `fromDate`, `toDate`, `page`, `limit`.

---

## Commands

| Command | Returns | Authorization | Notes |
|---------|---------|---------------|-------|
| `CreateCareLogEntryCommand` | `string` (entryId) | Any space member | `spaceId` injected from `SpaceContext` |
| `UpdateCareLogEntryCommand` | `void` | Author (`userId` match) | Partial update; validates quantity/unit pair |
| `DeleteCareLogEntryCommand` | `void` | Author (`userId` match) | Calls `writeRepository.delete(id)` directly |

---

## Queries

| Query | Returns | Notes |
|-------|---------|-------|
| `CareLogFindByPlantQuery` | `CareLogEntryViewModel[]` | Tenant-filtered; DESC by `performedAt` |
| `CareLogFindBySpaceQuery` | `CareLogEntryViewModel[]` | Tenant-filtered; optional `activityTypes[]`, `fromDate`, `toDate` |
| `CareLogFindLastByTypeQuery` | `CareLogEntryViewModel \| null` | Used by the plants cross-context adapter |

---

## Cross-context integration — Plants

`PlantResponseDto` exposes two resolved fields backed by care-log data:

| Field | Activity type queried |
|-------|-----------------------|
| `lastWateredAt: DateTime` | `WATERING` |
| `lastFertilizedAt: DateTime` | `FERTILIZING` |

### How it works

```
PlantCareLogResolvedFieldsResolver   (plants transport layer)
  └─ @Inject(CARE_LOG_PORT) ICareLogPort
       └─ CareLogAdapter              (plants infrastructure)
            └─ QueryBus.execute(CareLogFindLastByTypeQuery)
                 └─ CareLogFindLastByTypeQueryHandler
                      └─ ICareLogEntryReadRepository.findLastByType(plantId, activityType)
```

The **port interface and adapter live in the `plants` context**, not here. This keeps the dependency arrow pointing inward (plants → care-log via QueryBus), avoiding a circular context import.

The `CARE_LOG_PORT` token is registered in `PlantsModule`:

```ts
{ provide: CARE_LOG_PORT, useClass: CareLogAdapter }
```

---

## Domain exceptions → HTTP status

Mapped in `transport/exceptions/care-log-exception.filter.ts` and wired globally in `src/core/filters/base-exception.filter.ts`:

| Exception | HTTP |
|-----------|------|
| `CareLogEntryNotFoundException` | 404 Not Found |
| `CareLogEntryForbiddenException` | 403 Forbidden |
| `CareLogQuantityUnitMismatchException` | 422 Unprocessable Entity |

---

## Database

### `care_log_entries`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `plant_id` | `uuid` | |
| `user_id` | `uuid` | |
| `space_id` | `uuid` | Tenant column; filtered by `createTenantRepository` |
| `activity_type` | `varchar(32)` | |
| `performed_at` | `timestamptz` | |
| `notes` | `text` (nullable) | |
| `quantity` | `decimal(10,3)` (nullable) | String↔float transformer on read |
| `unit` | `varchar(8)` (nullable) | |
| `created_at` / `updated_at` | `timestamptz` | |

### Indexes

| Index | Columns | Purpose |
|-------|---------|---------|
| `IDX_care_log_entries_space_id` | `space_id` | Tenant listing scans |
| `IDX_care_log_entries_plant_id_space_id` | `plant_id, space_id` | Per-plant queries |
| `IDX_care_log_entries_performed_at` | `plant_id, space_id, performed_at` | `findLastByType` ORDER BY |

Migration: `src/database/migrations/1780000000016-CreateCareLog.ts`

---

## Things to know before making changes

1. **`performedAt` cannot be in the future** — `CareLogPerformedAtValueObject` throws if `value > new Date()`. Backdating is allowed (useful for logging yesterday's watering).

2. **quantity + unit are always paired** — the invariant is enforced in `CareLogEntryAggregate.assertQuantityUnitPair()` on both `create()` and `update()`. Sending one without the other always returns HTTP 422.

3. **Delete goes directly to the repository** — `DeleteCareLogEntryCommandHandler` calls `writeRepository.delete(id)` rather than `save()`. This is intentional: the aggregate's `delete()` method emits the domain event, which is published via `EventBus` before the row is removed.

4. **Tenant isolation is automatic** — both repositories use `createTenantRepository`, which scopes all queries to the active `spaceId` from `SpaceContext`. Do not pass `spaceId` as an explicit filter in handler code.

5. **Cross-context adapter dispatches via QueryBus** — `CareLogAdapter` in the `plants` context never imports from `care-log/infrastructure`. It only imports the query class and dispatches via `QueryBus`. Errors are silently caught and returned as `null` to avoid breaking plant queries if the care-log table is unavailable.

6. **`findByCriteria` is not implemented** — both repositories satisfy the `IBaseReadRepository` / `IBaseWriteRepository` interface contracts by throwing `Error('Method not implemented.')` for `findByCriteria`. Care-log queries use custom methods instead.
