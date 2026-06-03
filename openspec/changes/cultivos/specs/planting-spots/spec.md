# Spec: PlantingSpots bounded context — change `cultivos`

Phase 1 — standalone module. No plant integration.

---

## 1. Domain Model

### 1.1 PlantingSpotAggregate

| Field | Type | Nullable | Notes |
|-------|------|----------|-------|
| id | UUID | No | Generated on create |
| name | string | No | Non-empty, max 255 chars |
| type | PlantingSpotType | No | Enum value object |
| description | string | Yes | Max 1000 chars |
| userId | UUID | No | Creator / owner |
| spaceId | UUID | No | Tenant scope |
| createdAt | Date | No | Set on create |
| updatedAt | Date | No | Set on every write |

### 1.2 PlantingSpotType enum

Allowed values: `raised_bed`, `pot`, `container`, `field_section`, `other`.

Any other string MUST be rejected with a domain validation error.

### 1.3 Value Objects

- `PlantingSpotTypeValueObject` extends `EnumValueObject`. Validation in the VO constructor, not in the application layer.

### 1.4 Domain Events

| Event | Trigger |
|-------|---------|
| `PlantingSpotCreated` | After successful create |
| `PlantingSpotUpdated` | After successful update |
| `PlantingSpotDeleted` | After successful delete |

---

## 2. Ports

### 2.1 IPlantingSpotRepository (write)

MUST expose:
- `save(spot: PlantingSpotAggregate): Promise<void>`
- `findById(id: string, spaceId: string): Promise<PlantingSpotAggregate | null>`

### 2.2 IPlantingSpotReadRepository (read)

MUST expose:
- `findById(id: string, spaceId: string): Promise<PlantingSpotViewModel | null>`
- `findByCriteria(criteria: PlantingSpotCriteria): Promise<PlantingSpotViewModel[]>`

### 2.3 ICountPlantsInSpotPort (delete guard)

MUST expose:
- `countByPlantingSpotId(plantingSpotId: string): Promise<number>`

Phase 1 implementation MUST return `0` always. The port MUST be wired into `AssertPlantingSpotNotInUseService`. The service MUST throw `PlantingSpotInUseException` when the count is greater than 0.

---

## 3. Commands

### 3.1 CreatePlantingSpot

**Inputs:** name, type, description (optional), userId (from JWT), spaceId (from `X-Space-ID`).

**Rules:**
- `name` is required and non-empty.
- `type` MUST be a valid `PlantingSpotType` value.
- `userId` and `spaceId` MUST be taken from the authenticated context — never from the request body.
- `spaceId` MUST match the space the authenticated user belongs to (enforced by `SpaceGuard`).
- The created spot is persisted and a `PlantingSpotCreated` event is dispatched.

### 3.2 UpdatePlantingSpot

**Inputs:** id (path/arg), partial set of {name, type, description}, userId + spaceId from auth context.

**Rules:**
- The spot MUST exist in the caller's space. `findById(id, spaceId)` returns null → `PlantingSpotNotFoundException` (404).
- Only the owner (`userId` matches `spot.userId`) MAY update. Other caller → `PlantingSpotForbiddenException` (403).
- Each supplied field is validated (same rules as create).
- `updatedAt` is refreshed on every successful update.
- `PlantingSpotUpdated` event is dispatched.

### 3.3 DeletePlantingSpot

**Inputs:** id, userId + spaceId from auth context.

**Rules:**
- The spot MUST exist in caller's space. Not found → `PlantingSpotNotFoundException` (404).
- Only the owner MAY delete. Other caller → `PlantingSpotForbiddenException` (403).
- `AssertPlantingSpotNotInUseService` is called before deletion. If `ICountPlantsInSpotPort.countByPlantingSpotId` returns > 0 → `PlantingSpotInUseException` (409). Processing stops.
- If guard passes, the spot is deleted and `PlantingSpotDeleted` event dispatched.
- In Phase 1 the port always returns 0, so delete always succeeds (guard wiring verified by unit test).

---

## 4. Queries

### 4.1 FindById

**Inputs:** id, spaceId from auth context.

**Rules:**
- Returns the `PlantingSpotViewModel` for the given id.
- The spot's `spaceId` MUST equal the caller's `spaceId`. If it does not (or the record does not exist) → return 404. The response MUST NOT reveal the existence of spots in other spaces.

### 4.2 FindByCriteria

**Inputs:** spaceId (from auth context), optional `type` filter, pagination (page, limit).

**Rules:**
- Results are always scoped to the caller's `spaceId` — no cross-space leakage regardless of filters.
- Optional `type` filter: when provided MUST match only spots with that exact type.
- Results are paginated. Default page = 1, default limit = 20, max limit = 100.
- An empty result set (0 items) is valid and MUST return 200, not 404.

---

## 5. Tenant Isolation

- Both the write repository and the read repository MUST be instantiated via `createTenantRepository`.
- The `space_id` column MUST exist on the `planting_spots` table. The `createTenantRepository` proxy injects `space_id` on all inserts and appends a `WHERE space_id = ?` clause on all selects.
- Direct TypeORM repository injection (bypassing the proxy) is NOT allowed.

---

## 6. Transport

### 6.1 REST

| Method | Path | Command / Query |
|--------|------|-----------------|
| POST | `/planting-spots` | CreatePlantingSpot |
| PATCH | `/planting-spots/:id` | UpdatePlantingSpot |
| DELETE | `/planting-spots/:id` | DeletePlantingSpot |
| GET | `/planting-spots/:id` | FindById |
| GET | `/planting-spots` | FindByCriteria |

All endpoints MUST be protected by `JwtAuthGuard` + `SpaceGuard`.
`X-Space-ID` header MUST be present; absence → 400 (enforced by `SpaceGuard`).

### 6.2 GraphQL

| Operation | Type | Resolver |
|-----------|------|----------|
| `createPlantingSpot(input)` | Mutation | CreatePlantingSpot |
| `updatePlantingSpot(id, input)` | Mutation | UpdatePlantingSpot |
| `deletePlantingSpot(id)` | Mutation | DeletePlantingSpot |
| `plantingSpot(id)` | Query | FindById |
| `plantingSpots(criteria)` | Query | FindByCriteria |

All resolvers MUST be protected by `JwtAuthGuard` + `SpaceGuard`.

---

## 7. Persistence

- Migration name: `1780000000010-CreatePlantingSpots`.
- Table: `planting_spots`.
- The `up()` method creates the table. The `down()` method drops it cleanly.
- `space_id` column MUST be NOT NULL and indexed.
- `type` column persisted as `varchar` with values matching the enum.

---

## 8. Module Registration

`PlantingSpotsModule` MUST be imported in `src/app.module.ts`. Absence causes a startup failure in integration/e2e tests.

---

## 9. Dependency Constraint

`planting-spots` MUST NOT import from `@contexts/plants` or any file inside `src/contexts/plants/`. This MUST be verifiable via a unit test or lint rule. Direction of coupling is `plants → planting-spots` (Phase 2 only).

---

## 10. Error Catalogue

| Exception class | HTTP status | GraphQL code | Trigger |
|----------------|-------------|--------------|---------|
| `PlantingSpotNotFoundException` | 404 | `NOT_FOUND` | spot not found or not in caller's space |
| `PlantingSpotForbiddenException` | 403 | `FORBIDDEN` | caller is not owner |
| `PlantingSpotInUseException` | 409 | `CONFLICT` | delete guard count > 0 |

`base-exception.filter.ts` MUST map `PlantingSpotInUseException` → 409 if the filter enumerates exceptions explicitly.

---

## 11. Acceptance Scenarios

### SC-01 Create — happy path

```
Given: authenticated user (userId=U1) in space S1
When:  POST /planting-spots { name: "Bancal Norte", type: "raised_bed" }
       with X-Space-ID: S1
Then:  201 Created
       response body contains id, name, type, userId=U1, spaceId=S1
       PlantingSpotCreated event dispatched
```

### SC-02 Create — invalid type

```
Given: authenticated user in space S1
When:  POST /planting-spots { name: "X", type: "greenhouse" }
Then:  400 Bad Request
       PlantingSpot NOT persisted
```

### SC-03 Create — missing X-Space-ID

```
Given: authenticated user, no X-Space-ID header
When:  POST /planting-spots { name: "X", type: "pot" }
Then:  400 Bad Request (SpaceGuard rejects)
```

### SC-04 Update — happy path (owner)

```
Given: spot P1 owned by U1 in space S1
When:  PATCH /planting-spots/P1 { description: "Updated desc" }
       caller = U1, X-Space-ID: S1
Then:  200 OK
       response description = "Updated desc"
       updatedAt refreshed
       PlantingSpotUpdated event dispatched
```

### SC-05 Update — not owner

```
Given: spot P1 owned by U1 in space S1
When:  PATCH /planting-spots/P1 { name: "New name" }
       caller = U2 (different user), X-Space-ID: S1
Then:  403 Forbidden
       spot unchanged
```

### SC-06 Update — spot not in caller's space

```
Given: spot P1 exists in space S2
When:  PATCH /planting-spots/P1 { name: "X" }
       caller in space S1
Then:  404 Not Found
       spot unchanged
```

### SC-07 Delete — happy path (Phase 1, no plants)

```
Given: spot P1 owned by U1 in space S1
       ICountPlantsInSpotPort returns 0
When:  DELETE /planting-spots/P1
       caller = U1, X-Space-ID: S1
Then:  204 No Content
       PlantingSpotDeleted event dispatched
```

### SC-08 Delete — guard blocks (Phase 1 wiring test)

```
Given: spot P1 owned by U1 in space S1
       ICountPlantsInSpotPort stubbed to return 1
When:  DELETE /planting-spots/P1
       caller = U1, X-Space-ID: S1
Then:  409 Conflict (PlantingSpotInUseException)
       spot NOT deleted
```

### SC-09 Delete — not owner

```
Given: spot P1 owned by U1 in space S1
When:  DELETE /planting-spots/P1
       caller = U2, X-Space-ID: S1
Then:  403 Forbidden
       spot NOT deleted
```

### SC-10 FindById — happy path

```
Given: spot P1 in space S1
When:  GET /planting-spots/P1
       caller in space S1
Then:  200 OK with full PlantingSpotViewModel
```

### SC-11 FindById — cross-space (tenant isolation)

```
Given: spot P1 exists in space S2
When:  GET /planting-spots/P1
       caller in space S1
Then:  404 Not Found
       response MUST NOT reveal spot exists in S2
```

### SC-12 FindByCriteria — scoped results

```
Given: spots [P1, P2] in space S1; spots [P3] in space S2
When:  GET /planting-spots
       caller in space S1
Then:  200 OK, body contains [P1, P2] only
       P3 is absent
```

### SC-13 FindByCriteria — type filter

```
Given: spots P1(type=pot), P2(type=raised_bed) in space S1
When:  GET /planting-spots?type=pot
       caller in space S1
Then:  200 OK, body contains [P1] only
```

### SC-14 FindByCriteria — empty result

```
Given: space S1 has no planting spots
When:  GET /planting-spots
       caller in space S1
Then:  200 OK, body = []
       NOT 404
```

### SC-15 Tenant isolation — write isolation (integration test)

```
Given: two tenants with separate spaceIds S1 and S2
When:  a spot is created under S1 using createTenantRepository
       then a findByCriteria is executed for S2
Then:  the S2 query returns 0 results
       (proves createTenantRepository correctly filters space_id)
```

### SC-16 Dependency constraint

```
Given: the planting-spots bounded context source files
When:  imports are statically analysed
Then:  no file under src/contexts/planting-spots/ imports from src/contexts/plants/
```

---

## 12. Out of Scope (Phase 2)

- `plantingSpotId` FK on `PlantAggregate`.
- Real `ICountPlantsInSpotPort` adapter in the `plants` context.
- `PlantViewModel` enrichment with nested spot.
- Capacity limits, geo-coordinates, photos, nesting.
