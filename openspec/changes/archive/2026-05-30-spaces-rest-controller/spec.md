# Delta Spec: Spaces REST Controller

**Change**: spaces-rest-controller
**Phase**: spec
**Date**: 2026-05-30
**Status**: done
**Extends**: `openspec/specs/spaces/spec.md` (multitenant change)

---

## 1. Overview

This is a **delta spec** — it describes only what changes from the existing `spaces` spec after this change is applied. All invariants, domain events, and domain exceptions from the base spec remain in force unless explicitly overridden here.

This change introduces the REST transport layer for `SpacesModule` (5 endpoints) and corrects two pre-existing application-layer defects that become observable once endpoints are live.

---

## 2. Bug Fix Deltas (Application Layer)

### 2.1 SpacesFindByUserQuery — Membership Filter (Bug Fix)

**Current (wrong)**: The handler filters spaces by `ownerId = currentUser.id` only.

**Required after this change**: The handler MUST return all spaces where the user holds ANY `SpaceMembership` — either as `owner` or as `member`.

**Scenarios:**

**Given** an authenticated user who is owner of Space A and member of Space B  
**When** `SpacesFindByUserQuery` is dispatched for that user  
**Then** BOTH Space A and Space B MUST appear in the result  
**And** spaces where the user holds no `SpaceMembership` MUST NOT appear

**Given** an authenticated user who is a `member` (not owner) of Space C  
**When** `SpacesFindByUserQuery` is dispatched for that user  
**Then** Space C MUST appear in the result (this was the defect — it was excluded before)

### 2.2 AddMemberCommand / RemoveMemberCommand — Owner Authorization (Bug Fix)

**Current (wrong)**: Command handlers execute without verifying the requesting user is the space owner.

**Required after this change**: Both `AddMemberCommand` and `RemoveMemberCommand` handlers MUST verify that `requestingUserId` matches the space's owner `SpaceMembership` before executing. This enforces the invariant already stated in base spec section 4.3.

**Scenarios:**

**Given** a user with `member` role in Space S  
**When** `AddMemberCommand` is dispatched with `requestingUserId` = that user's id  
**Then** the handler MUST throw a `ForbiddenException` (HTTP 403) before any membership write  
**And** no `SpaceMembership` record is created

**Given** a user with `member` role in Space S  
**When** `RemoveMemberCommand` is dispatched with `requestingUserId` = that user's id  
**Then** the handler MUST throw a `ForbiddenException` (HTTP 403) before any membership removal  
**And** no `SpaceMembership` record is removed

---

## 3. New REST Endpoints

All endpoints MUST be registered under the `SpacesController` in `src/contexts/spaces/transport/rest/controllers/spaces.controller.ts`.

All endpoints MUST be protected with `@UseGuards(JwtAuthGuard)`. The authenticated user is resolved via `@CurrentUser()`.

Routes marked **SkipSpace** MUST be decorated with `@SkipSpace()` so `SpaceGuard` does not require an `X-Space-ID` header. Routes marked **SpaceGuard active** rely on the global guard and MUST include a valid `X-Space-ID` header.

### 3.1 POST /spaces — Create Space

| Property | Value |
|---|---|
| Method + Path | `POST /spaces` |
| Auth | JwtAuthGuard |
| SpaceGuard | **SkipSpace** |
| Request body | `CreateSpaceDto` |
| Success response | `201 Created` + `SpaceRestResponseDto` |

**CreateSpaceDto** MUST contain:
- `name: string` — required, non-empty (class-validator: `@IsString()`, `@IsNotEmpty()`)

The controller MUST dispatch `CreateSpaceCommand` with `ownerId = currentUser.id`.

**Scenarios:**

**Given** an authenticated user who owns fewer than `MAX_SPACES_PER_USER` spaces  
**When** `POST /spaces` is called with `{ "name": "My Space" }`  
**Then** the response status MUST be `201`  
**And** the body MUST be a `SpaceRestResponseDto` with `id`, `name`, `ownerId = currentUser.id`, `createdAt`, `updatedAt`

**Given** an authenticated user who already owns `MAX_SPACES_PER_USER` spaces  
**When** `POST /spaces` is called  
**Then** the response status MUST be `409 Conflict`  
**And** no Space is persisted

**Given** a request with no or invalid JWT  
**When** `POST /spaces` is called  
**Then** the response status MUST be `401 Unauthorized`

### 3.2 GET /spaces/me — List My Spaces

| Property | Value |
|---|---|
| Method + Path | `GET /spaces/me` |
| Auth | JwtAuthGuard |
| SpaceGuard | **SkipSpace** |
| Success response | `200 OK` + `PaginatedResult<SpaceRestResponseDto>` |

The controller MUST dispatch `SpacesFindByUserQuery` with `userId = currentUser.id`. The result MUST include all spaces where the user holds any `SpaceMembership` (see section 2.1).

**Scenarios:**

**Given** an authenticated user who is owner of Space A and member of Space B  
**When** `GET /spaces/me` is called  
**Then** the response status MUST be `200`  
**And** the body MUST include both Space A and Space B as `SpaceRestResponseDto` items  
**And** spaces where the user has no membership MUST NOT appear

**Given** an authenticated user with no spaces  
**When** `GET /spaces/me` is called  
**Then** the response status MUST be `200` with an empty paginated result

### 3.3 GET /spaces/:id — Get Space by ID

| Property | Value |
|---|---|
| Method + Path | `GET /spaces/:id` |
| Auth | JwtAuthGuard |
| SpaceGuard | **Active** (X-Space-ID header required) |
| Success response | `200 OK` + `SpaceRestResponseDto` |

The controller MUST dispatch `SpaceFindByIdQuery` with `spaceId = params.id`.

**Scenarios:**

**Given** an authenticated member of Space S with a valid `X-Space-ID` header  
**When** `GET /spaces/:id` is called with `:id = S.id`  
**Then** the response status MUST be `200`  
**And** the body MUST be `SpaceRestResponseDto` for Space S

**Given** a request without an `X-Space-ID` header  
**When** `GET /spaces/:id` is called  
**Then** `SpaceGuard` MUST reject with `400 Bad Request`

**Given** a valid `X-Space-ID` header for a space the user is NOT a member of  
**When** `GET /spaces/:id` is called  
**Then** `SpaceGuard` MUST reject with `403 Forbidden`

### 3.4 POST /spaces/:id/members — Add Member

| Property | Value |
|---|---|
| Method + Path | `POST /spaces/:id/members` |
| Auth | JwtAuthGuard |
| SpaceGuard | **Active** (X-Space-ID header required) |
| Request body | `AddMemberDto` |
| Success response | `201 Created` (no body required) |

**AddMemberDto** MUST contain:
- `userId: string` — required, valid UUID (class-validator: `@IsUUID()`, `@IsNotEmpty()`)

The controller MUST dispatch `AddMemberCommand` with `spaceId = params.id`, `targetUserId = body.userId`, `requestingUserId = currentUser.id`.

**Scenarios:**

**Given** an authenticated owner of Space S with a valid `X-Space-ID` header  
**When** `POST /spaces/:id/members` is called with `{ "userId": "<target-user-id>" }`  
**Then** the response status MUST be `201`  
**And** the target user gains a `SpaceMembership` with role `member` in Space S

**Given** an authenticated member (not owner) of Space S  
**When** `POST /spaces/:id/members` is called  
**Then** the response status MUST be `403 Forbidden`  
**And** no membership is created

**Given** the target user already has a `SpaceMembership` in Space S  
**When** `POST /spaces/:id/members` is called  
**Then** a `DuplicateMembershipException` MUST be raised (HTTP 409 Conflict)

**Given** `SpaceGuard` evaluates the request and the space does not exist  
**When** `POST /spaces/:id/members` is called  
**Then** the response status MUST be `404 Not Found`

### 3.5 DELETE /spaces/:id/members/:userId — Remove Member

| Property | Value |
|---|---|
| Method + Path | `DELETE /spaces/:id/members/:userId` |
| Auth | JwtAuthGuard |
| SpaceGuard | **Active** (X-Space-ID header required) |
| Success response | `204 No Content` |

The controller MUST dispatch `RemoveMemberCommand` with `spaceId = params.id`, `userId = params.userId`, `requestingUserId = currentUser.id`.

**Scenarios:**

**Given** an authenticated owner of Space S with a valid `X-Space-ID` header  
**When** `DELETE /spaces/:id/members/:userId` is called for a `member`-role user  
**Then** the response status MUST be `204`  
**And** the target user's `SpaceMembership` in Space S is removed

**Given** an authenticated member (not owner) of Space S  
**When** `DELETE /spaces/:id/members/:userId` is called  
**Then** the response status MUST be `403 Forbidden`  
**And** no membership is removed

**Given** the target user does not hold a `SpaceMembership` in Space S  
**When** `DELETE /spaces/:id/members/:userId` is called  
**Then** the response status MUST be `404 Not Found`

**Given** the target user is the only owner of Space S  
**When** `DELETE /spaces/:id/members/:userId` is called for that owner  
**Then** `LastOwnerRemovalException` MUST be raised (HTTP 422 or 400)

---

## 4. DTOs

### 4.1 CreateSpaceDto

**File**: `src/contexts/spaces/transport/rest/dtos/create-space.dto.ts`

| Field | Type | Constraints |
|---|---|---|
| `name` | `string` | `@IsString()`, `@IsNotEmpty()`, `@ApiProperty()` |

### 4.2 AddMemberDto

**File**: `src/contexts/spaces/transport/rest/dtos/add-member.dto.ts`

| Field | Type | Constraints |
|---|---|---|
| `userId` | `string` | `@IsUUID()`, `@IsNotEmpty()`, `@ApiProperty()` |

### 4.3 SpaceRestResponseDto

**File**: `src/contexts/spaces/transport/rest/dtos/space-rest-response.dto.ts`

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | UUID |
| `name` | `string` | |
| `ownerId` | `string` | UUID of the owner |
| `createdAt` | `Date` | ISO timestamp |
| `updatedAt` | `Date` | ISO timestamp |

All fields MUST be decorated with `@ApiProperty()` for Swagger.

---

## 5. REST Mapper

**File**: `src/contexts/spaces/transport/rest/mappers/space/space.mapper.ts`

A `SpaceMapper` (or equivalent) MUST be provided to convert the application-layer `SpaceViewModel` (or aggregate result) into `SpaceRestResponseDto`. This mapper MUST be registered as a provider in `SpacesModule` and injected into `SpacesController`.

---

## 6. Module Registration

`SpacesModule` MUST be updated to declare:
- `SpacesController` in the `controllers` array
- `SpaceMapper` (or equivalent) in the `providers` array

---

## 7. Swagger Documentation

Every endpoint MUST be documented with:
- `@ApiOperation({ summary: '...' })`
- `@ApiResponse` decorators for each success and error status code listed in section 3
- `@ApiBearerAuth()` on the controller class

---

## 8. Error-to-Exception Mapping

| Domain Exception | HTTP Status |
|---|---|
| `SpaceLimitExceededException` | `409 Conflict` |
| `SpaceNotFoundException` | `404 Not Found` |
| `NotASpaceMemberException` | `404 Not Found` |
| `DuplicateMembershipException` | `409 Conflict` |
| `LastOwnerRemovalException` | `422 Unprocessable Entity` |
| `ForbiddenException` (owner check) | `403 Forbidden` |

---

## 9. Out of Scope

All items from the base spec remain out of scope. Additionally:
- Update space (rename) and delete space lifecycle
- GraphQL resolver changes for spaces
- Invitation flows, billing/quotas, cross-space admin bypass
- Pagination query parameters (basic paginated result structure is sufficient)
