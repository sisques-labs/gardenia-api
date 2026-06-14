# Spec: CareLog bounded context — change `care-log`

Tenant-scoped care journal for plants. Supports all care activity types and cross-context access from the plants context.

---

## 1. Domain Model

### 1.1 CareLogEntryAggregate

| Field | Type | Nullable | Notes |
|-------|------|----------|-------|
| id | UUID | No | Generated on create |
| plantId | UUID | No | Reference to the plant |
| userId | UUID | No | Who performed the activity |
| spaceId | UUID | No | Tenant scope |
| activityType | CareLogActivityType | No | Enum value object |
| performedAt | Date | No | Defaults to `now()` if not provided |
| notes | string | Yes | Max 2000 chars |
| quantity | number | Yes | Positive number; MUST be provided together with `unit` |
| unit | CareLogUnit | Yes | Enum value object; MUST be provided together with `quantity` |
| createdAt | Date | No | Set on create |
| updatedAt | Date | No | Set on every write |

### 1.2 CareLogActivityType enum

Allowed values: `WATERING`, `FERTILIZING`, `PRUNING`, `REPOTTING`, `TRANSPLANTING`, `PEST_TREATMENT`, `MISTING`, `ROTATION`, `OTHER`.

Any other string MUST be rejected with a domain validation error.

### 1.3 CareLogUnit enum

Allowed values: `ML`, `L`, `G`, `KG`.

Any other string MUST be rejected with a domain validation error.

### 1.4 Business Rules

- `quantity` and `unit` MUST be provided together or both omitted. Providing one without the other MUST throw a domain validation error (`CareLogQuantityUnitMismatchException`, HTTP 422).
- `performedAt` MUST NOT be in the future (server time). Backdating is allowed.
- `notes`, when provided, MUST be non-empty and at most 2000 characters.
- Only the entry author (`userId`) or a space owner MAY update or delete an entry. Other members MUST receive HTTP 403.

### 1.5 Domain Events

| Event | Trigger |
|-------|---------|
| `CareLogEntryCreated` | After successful create |
| `CareLogEntryUpdated` | After successful update |
| `CareLogEntryDeleted` | After successful delete |

---

## 2. Repositories / Ports

### 2.1 ICareLogEntryWriteRepository

MUST expose:
- `save(entry: CareLogEntryAggregate): Promise<void>`
- `findById(id: string, spaceId: string): Promise<CareLogEntryAggregate | null>`

### 2.2 ICareLogEntryReadRepository

MUST expose:
- `findById(id: string, spaceId: string): Promise<CareLogEntryViewModel | null>`
- `findByPlant(plantId: string, spaceId: string, pagination: Pagination): Promise<CareLogEntryViewModel[]>`
- `findBySpace(spaceId: string, criteria: CareLogSpaceCriteria): Promise<CareLogEntryViewModel[]>`
- `findLastByType(plantId: string, spaceId: string, activityType: string): Promise<CareLogEntryViewModel | null>`

All queries MUST be scoped to `spaceId` (tenant isolation).

`findByPlant` MUST return entries ordered by `performedAt` descending. Default pagination: `page=1`, `limit=20`, max `limit=100`.

---

## 3. Commands

### 3.1 CreateCareLogEntry

**Inputs:** `plantId` (required), `activityType` (required), `performedAt?` (optional, defaults to now), `notes?`, `quantity?`, `unit?`; `userId` and `spaceId` from authenticated context.

**Rules:**
- `plantId` MUST be a valid UUID (format validation only — no cross-context existence check in Phase 1).
- `activityType` MUST be a valid `CareLogActivityType`.
- `quantity` and `unit` MUST be provided together or both omitted.
- `performedAt` when provided MUST NOT be in the future.
- `userId` and `spaceId` MUST come from the authenticated JWT / `X-Space-ID` header — never from the request body.

### 3.2 UpdateCareLogEntry

**Inputs:** `id` (path/arg), partial `{activityType?, performedAt?, notes?, quantity?, unit?}`; `userId` + `spaceId` from auth context.

**Rules:**
- Entry MUST exist in the given `spaceId` (404 otherwise).
- `userId` from auth MUST match the entry's `userId` (403 otherwise).
- Partial update: unset fields are preserved.
- `quantity` + `unit` pair rule re-applies to the resulting state after merge (cannot set quantity while clearing unit, etc.).

### 3.3 DeleteCareLogEntry

**Inputs:** `id`; `userId` + `spaceId` from auth context.

**Rules:**
- Entry MUST exist in `spaceId` (404 otherwise).
- `userId` from auth MUST match the entry's `userId` (403 otherwise).

---

## 4. Queries

### 4.1 CareLogFindByPlant

**Inputs:** `plantId`, `spaceId`, optional `page`, `limit`.

Returns paginated `CareLogEntryViewModel[]` ordered by `performedAt` desc. Empty list → 200.

### 4.2 CareLogFindBySpace

**Inputs:** `spaceId`, optional `activityType[]`, `fromDate`, `toDate`, `page`, `limit`.

Returns paginated entries for the entire space, optionally filtered. Ordered by `performedAt` desc. Empty list → 200.

### 4.3 CareLogFindLastByType

**Inputs:** `plantId`, `spaceId`, `activityType`.

Returns the single most recent `CareLogEntryViewModel` matching the given type for the given plant, or `null` if none exists. This query is used internally by the cross-context `ICareLogPort`.

---

## 5. Cross-context: ICareLogPort (plants context)

```ts
// src/contexts/plants/application/ports/care-log.port.ts
export const CARE_LOG_PORT = Symbol('CARE_LOG_PORT');

export interface ICareLogPort {
  findLastPerformedAt(
    plantId: string,
    spaceId: string,
    activityType: string,
  ): Promise<Date | null>;
}
```

- Implemented by `CareLogAdapter` in `src/contexts/plants/infrastructure/adapters/care-log.adapter.ts`.
- The adapter dispatches `CareLogFindLastByTypeQuery` via `QueryBus` and extracts `performedAt`.
- `lastWateredAt` and `lastFertilizedAt` on `PlantResponseDto` are resolved by `PlantCareLogResolvedFieldsResolver`.

---

## 6. Transport

### 6.1 REST endpoints (prefix: `api/care-log`)

| Method | Path | Guard | Description |
|--------|------|-------|-------------|
| POST | `/` | JwtAuthGuard + SpaceGuard | Create entry |
| PATCH | `/:id` | JwtAuthGuard + SpaceGuard | Update entry |
| DELETE | `/:id` | JwtAuthGuard + SpaceGuard | Delete entry |
| GET | `/:id` | JwtAuthGuard + SpaceGuard | Get by id |
| GET | `/plant/:plantId` | JwtAuthGuard + SpaceGuard | List by plant (paginated) |
| GET | `/` | JwtAuthGuard + SpaceGuard | List by space (filtered, paginated) |

### 6.2 GraphQL operations

| Operation | Type | Description |
|-----------|------|-------------|
| `createCareLogEntry(input)` | Mutation | Create |
| `updateCareLogEntry(id, input)` | Mutation | Update |
| `deleteCareLogEntry(id)` | Mutation | Delete → returns `Boolean` |
| `careLogEntry(id)` | Query | Get by id |
| `careLogEntriesByPlant(plantId, page?, limit?)` | Query | Paginated list by plant |
| `careLogEntriesBySpace(criteria?)` | Query | Paginated list by space |

---

## 7. Scenarios

### SC-01 Create entry — happy path (WATERING, no quantity)
**Given** an authenticated user in space S1 with plant P1  
**When** they POST `{plantId: P1, activityType: "WATERING"}`  
**Then** HTTP 201, entry saved with `performedAt ≈ now`, `CareLogEntryCreated` event dispatched.

### SC-02 Invalid activityType
**Given** an authenticated user  
**When** they submit `activityType: "DANCING"`  
**Then** HTTP 400, domain validation error.

### SC-03 Create with quantity + unit
**Given** an authenticated user  
**When** they submit `{activityType: "FERTILIZING", quantity: 5, unit: "G"}`  
**Then** HTTP 201, entry saved with both values.

### SC-04 Quantity without unit
**Given** an authenticated user  
**When** they submit `{activityType: "WATERING", quantity: 500}` (no unit)  
**Then** HTTP 422, `CareLogQuantityUnitMismatchException`.

### SC-05 Unit without quantity
**Given** an authenticated user  
**When** they submit `{activityType: "WATERING", unit: "ML"}` (no quantity)  
**Then** HTTP 422, `CareLogQuantityUnitMismatchException`.

### SC-06 performedAt in the future
**Given** an authenticated user  
**When** they submit `{performedAt: "2099-01-01T00:00:00Z"}`  
**Then** HTTP 422, domain validation error.

### SC-07 Update by author — happy path
**Given** user U1 created entry E1 in space S1  
**When** U1 submits PATCH `{notes: "updated"}`  
**Then** HTTP 200, entry updated, `CareLogEntryUpdated` event dispatched.

### SC-08 Update by non-author
**Given** user U1 created entry E1; user U2 is a member of the same space  
**When** U2 tries to update E1  
**Then** HTTP 403.

### SC-09 Delete by author — happy path
**Given** user U1 created entry E1  
**When** U1 deletes E1  
**Then** HTTP 200 (or 204), `CareLogEntryDeleted` event dispatched.

### SC-10 Delete by non-author
**Given** user U1 created entry E1; U2 is a member of the same space  
**When** U2 tries to delete E1  
**Then** HTTP 403.

### SC-11 FindByPlant — ordered, paginated
**Given** 3 entries for plant P1 created at T1 < T2 < T3  
**When** query `careLogEntriesByPlant(P1)`  
**Then** returned in order T3, T2, T1.

### SC-12 FindBySpace — date range filter
**Given** 5 entries, 2 within the last 7 days  
**When** query with `fromDate = 7 days ago`  
**Then** returns only the 2 recent entries.

### SC-13 FindLastByType — returns most recent
**Given** 3 WATERING entries for plant P1 at T1 < T2 < T3  
**When** query `findLastByType(P1, "WATERING")`  
**Then** returns entry with `performedAt = T3`.

### SC-14 FindLastByType — no entries
**Given** no WATERING entries for plant P1  
**When** query `findLastByType(P1, "WATERING")`  
**Then** returns `null`.

### SC-15 Tenant isolation
**Given** entry E1 in space S1  
**When** a user in space S2 queries entries or tries to update/delete E1  
**Then** E1 is invisible (404 / empty list).

### SC-16 Plants resolved fields — lastWateredAt
**Given** two WATERING entries for plant P1 at T1 < T2  
**When** GraphQL query `plant(id) { lastWateredAt }`  
**Then** returns `T2`.

### SC-17 No import from plants in care-log context
**Static**: `src/contexts/care-log/**` MUST NOT import from `src/contexts/plants/`.
