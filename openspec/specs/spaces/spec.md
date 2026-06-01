# Spec: Spaces Bounded Context

**Change**: spaces-rest-controller (extends multitenant)
**Phase**: spec
**Date**: 2026-05-30
**Status**: done

---

## 1. Overview

This spec describes the delta — what MUST be true after the multi-tenancy change is applied — for the `spaces` bounded context. It does not prescribe implementation structure beyond what is already decided.

---

## 2. Invariants

### 2.1 `Space` Aggregate

- A `Space` MUST have a non-empty `id` (UUID), a non-empty `name`, and at least one `SpaceMembership` with role `owner` at all times.
- A `Space` MUST contain one or more `SpaceMembership` child entities.
- A `Space` MUST NOT be created without an owner `SpaceMembership` present in the same operation.
- The `Space` aggregate constructor MUST be hydration-only; domain events MUST be emitted via named instance methods (e.g., `create()`, `addMember()`, `removeMember()`).

### 2.2 `SpaceMembership` Child Entity

- `SpaceMembership` is a child entity of `Space`; it MUST NOT be its own aggregate root.
- `SpaceMembership` MUST carry: `userId` (UUID), `spaceId` (UUID), `role` (`owner` | `member`), and `joinedAt` (timestamp).
- A `SpaceMembership` with role `owner` MUST NOT be removable if it is the last owner in the `Space`. Attempting this MUST raise a domain exception.
- Roles are limited to `owner` and `member`; any other value MUST be rejected at the value-object level.

---

## 3. Space Creation

### 3.1 Standard Creation

**Given** an authenticated user who belongs to fewer than `MAX_SPACES_PER_USER` spaces as owner  
**When** a `CreateSpaceCommand` is dispatched with a valid name  
**Then** a new `Space` is persisted with a generated UUID, the given name, and one `SpaceMembership` (role: `owner`, `userId` = the requesting user)  
**And** a `SpaceCreatedEvent` MUST be emitted by the aggregate  
**And** the new Space MUST be immediately accessible via `SpaceFindByIdQuery` for that user

### 3.2 Auto-Creation on Registration

**Given** a new user completes the `register-account` flow  
**When** the account is created successfully  
**Then** a `Space` MUST be created automatically in the same operation, using a default name derived from the user's identity  
**And** the user MUST be assigned the `owner` role on that Space via a `SpaceMembership`  
**And** this MUST happen atomically: if Space creation fails, account creation MUST also roll back  
**And** the auto-created Space counts toward `MAX_SPACES_PER_USER`

### 3.3 Cap Enforcement

- `MAX_SPACES_PER_USER` is an integer configurable via environment variable; its default value MUST be documented.
- A user is considered the "owner" of a Space when they hold a `SpaceMembership` with role `owner`.
- **Given** a user who already owns `MAX_SPACES_PER_USER` spaces  
  **When** `CreateSpaceCommand` is dispatched  
  **Then** a `SpaceLimitExceededException` domain exception MUST be raised and no Space is persisted.
- The cap check MUST occur before any persistence write.

---

## 4. Membership Management

### 4.1 Adding a Member

**Given** an authenticated owner of Space S  
**When** `AddMemberCommand` is dispatched with a valid `userId` and Space S's `spaceId`  
**Then** a new `SpaceMembership` (role: `member`) is persisted on Space S  
**And** a `MemberAddedEvent` MUST be emitted  
**And** the added user MUST immediately have access to Space S data via `SpaceGuard`

**Given** the target user already holds a `SpaceMembership` for that Space  
**When** `AddMemberCommand` is dispatched again  
**Then** a domain exception MUST be raised and no duplicate membership is created

### 4.2 Removing a Member

**Given** an authenticated owner of Space S  
**When** `RemoveMemberCommand` is dispatched with a valid `userId` that holds a `member` role  
**Then** the `SpaceMembership` is removed  
**And** a `MemberRemovedEvent` MUST be emitted  
**And** the removed user MUST NOT be able to access Space S data after removal

**Given** the target user holds the only `owner` membership of Space S  
**When** `RemoveMemberCommand` is dispatched for that user  
**Then** a `LastOwnerRemovalException` domain exception MUST be raised and no membership is removed

### 4.3 Non-Owner Attempt

**Given** an authenticated user with `member` role in Space S  
**When** `AddMemberCommand` or `RemoveMemberCommand` is dispatched for Space S  
**Then** the command handler MUST reject the operation before any membership write  
**And** if the user is not a member at all, `NotASpaceMemberException` MUST be raised (HTTP 404)  
**And** if the user is a member but not owner, `NotSpaceOwnerException` MUST be raised (HTTP 403)

### 4.4 User Space Listing (`SpacesFindByUserQuery`)

**Given** an authenticated user who is owner of Space A and member of Space B  
**When** `SpacesFindByUserQuery` is dispatched for that user  
**Then** BOTH Space A and Space B MUST appear in the result  
**And** spaces where the user holds no `SpaceMembership` MUST NOT appear

**Given** an authenticated user who is a `member` (not owner) of Space C  
**When** `SpacesFindByUserQuery` is dispatched for that user  
**Then** Space C MUST appear in the result

---

## 5. Space Isolation Guarantee

- A user MUST NOT read or write data belonging to a Space they are not a member of, through any application-layer path.
- This guarantee is enforced at two layers:
  1. **Transport** (`SpaceGuard`): validates the `X-Space-ID` header and the user's `SpaceMembership` before the request reaches any handler.
  2. **Infrastructure** (`createTenantRepository`): appends `spaceId` to every query; the domain layer MUST NOT contain tenant-aware logic.
- Authorized bypasses are permitted ONLY when:
  - The lookup is by a globally-unique UUID (no cross-space ambiguity is possible), AND
  - The endpoint is decorated with `@IdentityOnly()` (see auth spec §5), AND
  - The bypass is explicitly documented in the repository implementation.
- No other cross-space bypass is permitted.

---

## 6. `SpaceGuard` Behavior

- `SpaceGuard` MUST be applied globally (or on all routes that require tenant context).
- Routes excluded from `SpaceGuard` MUST use one of two explicitly declared skip markers:

| Decorator | When to use | JWT required? |
|---|---|---|
| `@SkipSpace()` | Fully public auth routes (`register`, `login`, `refresh`, `logout`) | No |
| `@IdentityOnly()` | Identity-scoped routes that require JWT but no space context (`me`, `delete-account`, `change-password`, `logout-all`) | Yes |

- `SpaceGuard` MUST check both `SKIP_SPACE_KEY` and `IDENTITY_ONLY_KEY` metadata keys and skip space validation if either is set.
- `OptionalJwtAuthGuard` (APP_GUARD) MUST only skip JWT validation for `@SkipSpace()` routes. `@IdentityOnly()` routes MUST still enforce JWT authentication.

**Given** an incoming request with no `X-Space-ID` header  
**When** `SpaceGuard` evaluates the request  
**Then** the request MUST be rejected with HTTP 400 (Bad Request)

**Given** an incoming request with a valid `X-Space-ID` header but the authenticated user has no `SpaceMembership` for that Space  
**When** `SpaceGuard` evaluates the request  
**Then** the request MUST be rejected with HTTP 403 (Forbidden)

**Given** an incoming request with a valid `X-Space-ID` header and the authenticated user has a `SpaceMembership` for that Space  
**When** `SpaceGuard` evaluates the request  
**Then** `spaceId` MUST be stored in `SpaceContext` (via `AsyncLocalStorage`) before control passes to the route handler  
**And** subsequent repository calls within that request MUST read `spaceId` from `SpaceContext` without any additional header parsing

**Given** an invalid UUID in the `X-Space-ID` header (i.e., not a well-formed UUID)  
**When** `SpaceGuard` evaluates the request  
**Then** the request MUST be rejected with HTTP 400 (Bad Request)

---

## 7. `SpaceContext` (AsyncLocalStorage)

- `SpaceContext` MUST be a request-scoped service backed by `AsyncLocalStorage`.
- `SpaceContext` MUST expose: `run(spaceId, fn)`, `get(): string | undefined`, and `require(): string`.
- `SpaceContext` MUST be populated by `SpaceInterceptor` (wraps the handler via `next.handle()`) after `SpaceGuard` validates the space membership.
- Tenant-scoped repositories (`createTenantRepository` proxy) MUST call `SpaceContext.require()` on every query. If the ALS store is empty, `require()` MUST throw `SpaceContextMissingException`. This is the **fail-closed** contract.
- Identity-scoped repositories (see auth spec §5.3) MUST use the raw (non-proxied) TypeORM repository for UUID-based lookups and deletes, bypassing the tenant proxy entirely.
- No part of the domain layer MAY import or reference `SpaceContext` directly.

---

## 8. Domain Events

| Event | Emitted By | Payload |
|---|---|---|
| `SpaceCreatedEvent` | `Space.create()` | `spaceId`, `name`, `ownerId` |
| `MemberAddedEvent` | `Space.addMember()` | `spaceId`, `userId`, `role` |
| `MemberRemovedEvent` | `Space.removeMember()` | `spaceId`, `userId` |

---

## 9. Domain Exceptions

| Exception | Trigger |
|---|---|
| `SpaceNotFoundException` | Space does not exist for a given `spaceId` |
| `NotASpaceMemberException` | User has no `SpaceMembership` for the target Space |
| `SpaceLimitExceededException` | User already owns `MAX_SPACES_PER_USER` spaces |
| `LastOwnerRemovalException` | Attempt to remove the last owner from a Space |
| `SpaceContextMissingException` | Repository call when `SpaceContext` is empty |
| `DuplicateMembershipException` | `AddMemberCommand` for a user already in the Space |
| `NotSpaceOwnerException` | User is a member but not the owner when owner-only operation is attempted |

### 9.1 REST Exception → HTTP Mapping

| Domain Exception | HTTP Status |
|---|---|
| `SpaceLimitExceededException` | `409 Conflict` |
| `SpaceNotFoundException` | `404 Not Found` |
| `NotASpaceMemberException` | `404 Not Found` |
| `DuplicateMembershipException` | `409 Conflict` |
| `LastOwnerRemovalException` | `422 Unprocessable Entity` |
| `NotSpaceOwnerException` | `403 Forbidden` |

---

## 10. REST Transport Layer

All endpoints MUST be registered under `SpacesController` in `src/contexts/spaces/transport/rest/controllers/spaces.controller.ts`.

All endpoints MUST be protected with `@UseGuards(JwtAuthGuard)`. The authenticated user is resolved via `@CurrentUser()`.

Routes marked **SkipSpace** MUST be decorated with `@SkipSpace()` so `SpaceGuard` does not require an `X-Space-ID` header. Routes marked **SpaceGuard active** rely on the global guard and MUST include a valid `X-Space-ID` header.

### 10.1 POST /spaces — Create Space

| Property | Value |
|---|---|
| Method + Path | `POST /spaces` |
| Auth | JwtAuthGuard |
| SpaceGuard | **SkipSpace** |
| Request body | `CreateSpaceDto` |
| Success response | `201 Created` + `SpaceRestResponseDto` |

**CreateSpaceDto** MUST contain:
- `name: string` — required, non-empty (`@IsString()`, `@IsNotEmpty()`)

The controller MUST dispatch `CreateSpaceCommand` with `ownerId = currentUser.id` (never from the request body).

**Given** an authenticated user who owns fewer than `MAX_SPACES_PER_USER` spaces  
**When** `POST /spaces` is called with `{ "name": "My Space" }`  
**Then** the response status MUST be `201`  
**And** the body MUST be a `SpaceRestResponseDto` with `id`, `name`, `ownerId = currentUser.id`, `createdAt`, `updatedAt`

**Given** an authenticated user who already owns `MAX_SPACES_PER_USER` spaces  
**When** `POST /spaces` is called  
**Then** the response status MUST be `409 Conflict`

**Given** a request with no or invalid JWT  
**When** `POST /spaces` is called  
**Then** the response status MUST be `401 Unauthorized`

### 10.2 GET /spaces/me — List My Spaces

| Property | Value |
|---|---|
| Method + Path | `GET /spaces/me` |
| Auth | JwtAuthGuard |
| SpaceGuard | **SkipSpace** |
| Success response | `200 OK` + `PaginatedResult<SpaceRestResponseDto>` |

The controller MUST dispatch `SpacesFindByUserQuery` with `userId = currentUser.id`. The result MUST include all spaces where the user holds any `SpaceMembership` (see §4.4).

**Given** an authenticated user who is owner of Space A and member of Space B  
**When** `GET /spaces/me` is called  
**Then** the response status MUST be `200`  
**And** the body MUST include both Space A and Space B as `SpaceRestResponseDto` items

**Given** an authenticated user with no spaces  
**When** `GET /spaces/me` is called  
**Then** the response status MUST be `200` with an empty paginated result

### 10.3 GET /spaces/:id — Get Space by ID

| Property | Value |
|---|---|
| Method + Path | `GET /spaces/:id` |
| Auth | JwtAuthGuard |
| SpaceGuard | **Active** (X-Space-ID header required) |
| Success response | `200 OK` + `SpaceRestResponseDto` |

The controller MUST dispatch `SpaceFindByIdQuery` with `spaceId = params.id`.

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

### 10.4 POST /spaces/:id/members — Add Member

| Property | Value |
|---|---|
| Method + Path | `POST /spaces/:id/members` |
| Auth | JwtAuthGuard |
| SpaceGuard | **Active** (X-Space-ID header required) |
| Request body | `AddMemberDto` |
| Success response | `201 Created` (no body required) |

**AddMemberDto** MUST contain:
- `userId: string` — required, valid UUID (`@IsUUID()`, `@IsNotEmpty()`)

The controller MUST dispatch `AddMemberCommand` with `spaceId = params.id`, `targetUserId = body.userId`, `requestingUserId = currentUser.id`.

**Given** an authenticated owner of Space S with a valid `X-Space-ID` header  
**When** `POST /spaces/:id/members` is called with `{ "userId": "<target-user-id>" }`  
**Then** the response status MUST be `201`  
**And** the target user gains a `SpaceMembership` with role `member` in Space S

**Given** an authenticated member (not owner) of Space S  
**When** `POST /spaces/:id/members` is called  
**Then** the response status MUST be `403 Forbidden`

**Given** the target user already has a `SpaceMembership` in Space S  
**When** `POST /spaces/:id/members` is called  
**Then** `DuplicateMembershipException` MUST be raised (HTTP 409 Conflict)

### 10.5 DELETE /spaces/:id/members/:userId — Remove Member

| Property | Value |
|---|---|
| Method + Path | `DELETE /spaces/:id/members/:userId` |
| Auth | JwtAuthGuard |
| SpaceGuard | **Active** (X-Space-ID header required) |
| Success response | `204 No Content` |

The controller MUST dispatch `RemoveMemberCommand` with `spaceId = params.id`, `userId = params.userId`, `requestingUserId = currentUser.id`.

**Given** an authenticated owner of Space S with a valid `X-Space-ID` header  
**When** `DELETE /spaces/:id/members/:userId` is called for a `member`-role user  
**Then** the response status MUST be `204`  
**And** the target user's `SpaceMembership` in Space S is removed

**Given** an authenticated member (not owner) of Space S  
**When** `DELETE /spaces/:id/members/:userId` is called  
**Then** the response status MUST be `403 Forbidden`

**Given** the target user does not hold a `SpaceMembership` in Space S  
**When** `DELETE /spaces/:id/members/:userId` is called  
**Then** the response status MUST be `404 Not Found`

**Given** the target user is the only owner of Space S  
**When** `DELETE /spaces/:id/members/:userId` is called for that owner  
**Then** `LastOwnerRemovalException` MUST be raised (HTTP 422)

### 10.6 DTOs

| DTO | File | Fields |
|---|---|---|
| `CreateSpaceDto` | `transport/rest/dtos/create-space.dto.ts` | `name: string` |
| `AddMemberDto` | `transport/rest/dtos/add-member.dto.ts` | `userId: string` |
| `SpaceRestResponseDto` | `transport/rest/dtos/space-rest-response.dto.ts` | `id`, `name`, `ownerId`, `createdAt`, `updatedAt` |

All DTO fields MUST be decorated with `@ApiProperty()` for Swagger.

### 10.7 REST Mapper and Module Registration

- A `SpaceRestMapper` MUST convert `SpaceViewModel` → `SpaceRestResponseDto` and be registered as a provider in `SpacesModule`.
- `SpacesModule` MUST declare `SpacesController` in the `controllers` array.

### 10.8 Swagger Documentation

Every endpoint MUST be documented with:
- `@ApiOperation({ summary: '...' })`
- `@ApiResponse` decorators for each success and error status code
- `@ApiBearerAuth()` on the controller class
- `@ApiTags('spaces')` on the controller class

---

## 11. Out of Scope

- Cross-space admin or `SpaceContext` bypass.
- Space deletion lifecycle and update space (rename).
- Invitation flows (membership is programmatic only at this stage).
- Billing or quotas per Space.
- GraphQL resolver changes for spaces.
- Pagination query parameters (basic paginated result structure is sufficient).
