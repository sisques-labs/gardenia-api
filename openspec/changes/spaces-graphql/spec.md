# Spec: Spaces GraphQL Transport

**Change name**: `spaces-graphql`
**Status**: draft
**Author**: sdd-spec agent
**Date**: 2026-05-31

---

## 1. Scope

This spec is a DELTA spec. It describes WHAT MUST BE TRUE after the change. It does not touch domain, application, persistence, REST, SpaceGuard, SpaceInterceptor, or SpaceContext — those are already correct and must remain unchanged.

---

## 2. File Structure

The following 12 files MUST exist after the change:

```
src/contexts/spaces/transport/graphql/
  dtos/
    requests/
      space/
        space-create.request.dto.ts
        space-find-by-id.request.dto.ts
        space-add-member.request.dto.ts
        space-remove-member.request.dto.ts
    responses/
      space/
        space.response.dto.ts
  enums/
    space/
      space-registered-enums.graphql.ts
  mappers/
    space/
      space.mapper.ts
      space.mapper.spec.ts
  resolvers/
    space/
      space-queries.resolver.ts
      space-queries.resolver.spec.ts
      space-mutations.resolver.ts
      space-mutations.resolver.spec.ts
```

One existing file is modified:

```
src/contexts/spaces/spaces.module.ts
```

---

## 3. GraphQL Operations

### 3.1 Mutations (`SpaceMutationsResolver`)

| Operation | Auth | @SkipSpace | Return type | Reason for SkipSpace |
|---|---|---|---|---|
| `spaceCreate` | `@JwtAuthGuard` (class) | YES | `MutationResponseDto` | Space does not exist yet; no X-Space-ID to validate |
| `spaceAddMember` | `@JwtAuthGuard` (class) | NO | `MutationResponseDto` | Operates on an existing space; SpaceGuard must run |
| `spaceRemoveMember` | `@JwtAuthGuard` (class) | NO | `MutationResponseDto` | Operates on an existing space; SpaceGuard must run |

`@UseGuards(JwtAuthGuard)` is applied at class level (same as `PlantMutationsResolver`).

#### spaceCreate
```
mutation spaceCreate(input: SpaceCreateRequestDto): MutationResponseDto
```
- Dispatches `CreateSpaceCommand({ name: input.name, ownerId: user.userId })`
- Returns `mutationResponseGraphQLMapper.toResponseDto({ success: true, message: 'Space created successfully', id: result })`

#### spaceAddMember
```
mutation spaceAddMember(input: SpaceAddMemberRequestDto): MutationResponseDto
```
- Dispatches `AddMemberCommand({ spaceId: input.spaceId, targetUserId: input.targetUserId, requestingUserId: user.userId })`
- Returns `mutationResponseGraphQLMapper.toResponseDto({ success: true, message: 'Member added successfully', id: input.spaceId })`

#### spaceRemoveMember
```
mutation spaceRemoveMember(input: SpaceRemoveMemberRequestDto): MutationResponseDto
```
- Dispatches `RemoveMemberCommand({ spaceId: input.spaceId, targetUserId: input.targetUserId, requestingUserId: user.userId })`
- Returns `mutationResponseGraphQLMapper.toResponseDto({ success: true, message: 'Member removed successfully', id: input.spaceId })`

---

### 3.2 Queries (`SpaceQueriesResolver`)

`SpaceQueriesResolver` has NO class-level `@UseGuards` (same as `PlantQueriesResolver`). Auth guards are NOT applied to queries in this context.

| Operation | @SkipSpace | Return type | Reason for SkipSpace |
|---|---|---|---|
| `spaceFindById` | NO | `SpaceResponseDto \| null` | Space must exist; SpaceGuard validates header |
| `spacesFindByUser` | YES | `PaginatedSpaceResultDto` | Lists all spaces for a user; no single space context |

#### spaceFindById
```
query spaceFindById(input: SpaceFindByIdRequestDto): SpaceResponseDto | null
```
- Dispatches `SpaceFindByIdQuery({ spaceId: input.id })`
- Returns `spaceGraphQLMapper.toResponseDtoFromViewModel(result)` or `null` if result is falsy

#### spacesFindByUser
```
query spacesFindByUser: PaginatedSpaceResultDto
```
- No input DTO required (user identity comes from `@CurrentUser`)
- Dispatches `SpacesFindByUserQuery({ userId: user.userId })`
- Returns `spaceGraphQLMapper.toPaginatedResponseDto(result)`
- MUST be decorated with `@SkipSpace()`
- `@CurrentUser()` IS used here to extract `user.userId`
- `@UseGuards(JwtAuthGuard)` MUST be applied to this method (method-level, since no class-level guard)

---

## 4. Request DTOs

### 4.1 `SpaceCreateRequestDto`

```ts
@InputType('SpaceCreateRequestDto')
export class SpaceCreateRequestDto {
  @Field(() => String, { description: 'The name of the space' })
  @IsString()
  @IsNotEmpty()
  name!: string;
}
```

- `ownerId` is NOT a client field — it comes exclusively from `@CurrentUser().userId` in the resolver

### 4.2 `SpaceFindByIdRequestDto`

```ts
@InputType('SpaceFindByIdRequestDto')
export class SpaceFindByIdRequestDto {
  @Field(() => String, { description: 'The id of the space to find' })
  @IsUUID()
  @IsNotEmpty()
  id!: string;
}
```

### 4.3 `SpaceAddMemberRequestDto`

```ts
@InputType('SpaceAddMemberRequestDto')
export class SpaceAddMemberRequestDto {
  @Field(() => String, { description: 'The id of the space' })
  @IsUUID()
  @IsNotEmpty()
  spaceId!: string;

  @Field(() => String, { description: 'The id of the user to add' })
  @IsUUID()
  @IsNotEmpty()
  targetUserId!: string;
}
```

- REST path params `:id` and `:userId` are FLATTENED to `spaceId` and `targetUserId`
- `requestingUserId` is NOT a client field — always from `@CurrentUser().userId`

### 4.4 `SpaceRemoveMemberRequestDto`

```ts
@InputType('SpaceRemoveMemberRequestDto')
export class SpaceRemoveMemberRequestDto {
  @Field(() => String, { description: 'The id of the space' })
  @IsUUID()
  @IsNotEmpty()
  spaceId!: string;

  @Field(() => String, { description: 'The id of the user to remove' })
  @IsUUID()
  @IsNotEmpty()
  targetUserId!: string;
}
```

- Same flattening rationale as `SpaceAddMemberRequestDto`
- `requestingUserId` is NOT a client field

---

## 5. Response DTOs

### 5.1 `SpaceResponseDto`

```ts
@ObjectType('SpaceResponseDto')
export class SpaceResponseDto {
  @Field(() => ID, { description: 'The id of the space' })
  id!: string;

  @Field(() => String, { description: 'The name of the space' })
  name!: string;

  @Field(() => String, { description: 'The id of the space owner' })
  ownerId!: string;

  @Field(() => Date, { description: 'When the space was created' })
  createdAt!: Date;

  @Field(() => Date, { nullable: true, description: 'When the space was last updated' })
  updatedAt?: Date;
}
```

Fields map 1:1 from `SpaceViewModel`: `id`, `name`, `ownerId`, `createdAt`, `updatedAt`.

MUST NOT include a `role` or `membershipRole` field. `SpaceViewModel` does not carry membership role and this DTO must not expose it.

### 5.2 `PaginatedSpaceResultDto`

```ts
@ObjectType('PaginatedSpaceResultDto')
export class PaginatedSpaceResultDto extends BasePaginatedResultDto {
  @Field(() => [SpaceResponseDto], { description: 'The spaces in the current page' })
  items!: SpaceResponseDto[];
}
```

Extends `BasePaginatedResultDto` from `@sisques-labs/nestjs-kit` (provides `total`, `page`, `perPage`, `totalPages`).

---

## 6. Mapper

### `SpaceGraphQLMapper`

```ts
@Injectable()
export class SpaceGraphQLMapper {
  toResponseDtoFromViewModel(vm: SpaceViewModel): SpaceResponseDto
  toPaginatedResponseDto(paginatedResult: PaginatedResult<SpaceViewModel>): PaginatedSpaceResultDto
}
```

#### `toResponseDtoFromViewModel` contract:
- Maps `vm.id → dto.id`
- Maps `vm.name → dto.name`
- Maps `vm.ownerId → dto.ownerId`
- Maps `vm.createdAt → dto.createdAt`
- Maps `vm.updatedAt → dto.updatedAt` (may be undefined/null)
- No other fields are mapped

#### `toPaginatedResponseDto` contract:
- Calls `toResponseDtoFromViewModel` for each item
- Maps `paginatedResult.items → dto.items`
- Maps `paginatedResult.total → dto.total`
- Maps `paginatedResult.page → dto.page`
- Maps `paginatedResult.perPage → dto.perPage`
- Maps `paginatedResult.totalPages → dto.totalPages`

---

## 7. Enum Registration

### `space-registered-enums.graphql.ts`

```ts
import { registerEnumType } from '@nestjs/graphql';
import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';

registerEnumType(MembershipRoleEnum, {
  name: 'MembershipRoleEnum',
  description: 'Membership role within a space',
});

export const registeredSpaceEnums: unknown[] = [];
```

- `registerEnumType` is called as a side effect when the file is imported
- `MembershipRoleEnum` values: `OWNER = 'owner'`, `MEMBER = 'member'`
- This enum is NOT exposed in any DTO field in this change, but MUST be registered so future additions won't break schema

---

## 8. Module Wiring (`spaces.module.ts`)

A new `GRAPHQL_PROVIDERS` constant MUST be added and included in the module's `providers` array:

```ts
const GRAPHQL_PROVIDERS = [
  SpaceQueriesResolver,
  SpaceMutationsResolver,
  SpaceGraphQLMapper,
];
```

The enum side-effect import MUST appear at the top of `spaces.module.ts`:

```ts
import './transport/graphql/enums/space/space-registered-enums.graphql';
```

The existing `TRANSPORT_PROVIDERS` array (`SpaceGuard`, `SpaceInterceptor`, `SpaceRestMapper`) MUST remain unchanged.

Final `providers` array shape:
```ts
providers: [
  SpaceContext,
  ...COMMAND_HANDLERS,
  ...QUERY_HANDLERS,
  ...APPLICATION_SERVICES,
  ...DOMAIN_BUILDERS,
  ...INFRASTRUCTURE_MAPPERS,
  ...INFRASTRUCTURE_REPOSITORIES,
  ...TRANSPORT_PROVIDERS,
  ...GRAPHQL_PROVIDERS,   // NEW
],
```

---

## 9. Acceptance Scenarios

### Scenario 1 — spaceCreate dispatches command and returns MutationResponseDto with id

**Given** an authenticated user with `userId = 'user-1'`  
**And** a valid `SpaceCreateRequestDto` with `name = 'My Garden'`  
**When** `spaceCreate(input, user)` is called on `SpaceMutationsResolver`  
**Then** `commandBus.execute` is called once with `CreateSpaceCommand({ name: 'My Garden', ownerId: 'user-1' })`  
**And** `mutationResponseGraphQLMapper.toResponseDto` is called with `{ success: true, message: 'Space created successfully', id: <commandResult> }`  
**And** the returned `MutationResponseDto` carries the space id

---

### Scenario 2 — spaceAddMember flattens input and injects requestingUserId from token

**Given** an authenticated user with `userId = 'requester-1'`  
**And** a valid `SpaceAddMemberRequestDto` with `spaceId = 'space-1'`, `targetUserId = 'target-1'`  
**When** `spaceAddMember(input, user)` is called  
**Then** `commandBus.execute` is called with `AddMemberCommand({ spaceId: 'space-1', targetUserId: 'target-1', requestingUserId: 'requester-1' })`  
**And** `requestingUserId` was NOT sourced from the client input

---

### Scenario 3 — spaceRemoveMember flattens input and injects requestingUserId from token

**Given** an authenticated user with `userId = 'requester-1'`  
**And** a valid `SpaceRemoveMemberRequestDto` with `spaceId = 'space-1'`, `targetUserId = 'target-1'`  
**When** `spaceRemoveMember(input, user)` is called  
**Then** `commandBus.execute` is called with `RemoveMemberCommand({ spaceId: 'space-1', targetUserId: 'target-1', requestingUserId: 'requester-1' })`

---

### Scenario 4 — spaceFindById returns mapped SpaceResponseDto

**Given** `SpaceFindByIdQuery` returns a `SpaceViewModel` with `id`, `name`, `ownerId`, `createdAt`, `updatedAt`  
**And** `SpaceGraphQLMapper.toResponseDtoFromViewModel` is configured to return a `SpaceResponseDto`  
**When** `spaceFindById({ id: 'space-1' })` is called on `SpaceQueriesResolver`  
**Then** `queryBus.execute` is called once with `SpaceFindByIdQuery({ spaceId: 'space-1' })`  
**And** the result equals the DTO returned by the mapper

---

### Scenario 5 — spaceFindById returns null when space does not exist

**Given** `SpaceFindByIdQuery` returns `null`  
**When** `spaceFindById({ id: 'nonexistent' })` is called  
**Then** the resolver returns `null` without calling the mapper

---

### Scenario 6 — spacesFindByUser returns paginated result

**Given** an authenticated user with `userId = 'user-1'`  
**And** `SpacesFindByUserQuery` returns a `PaginatedResult<SpaceViewModel>` with 2 items  
**And** `SpaceGraphQLMapper.toPaginatedResponseDto` returns a `PaginatedSpaceResultDto`  
**When** `spacesFindByUser(user)` is called  
**Then** `queryBus.execute` is called with `SpacesFindByUserQuery({ userId: 'user-1' })`  
**And** the result contains `items` with length 2

---

### Scenario 7 — SpaceGraphQLMapper maps all 5 fields from SpaceViewModel

**Given** a `SpaceViewModel` with `id = 'space-1'`, `name = 'Test'`, `ownerId = 'user-1'`, `createdAt = <date>`, `updatedAt = <date>`  
**When** `toResponseDtoFromViewModel(vm)` is called  
**Then** the returned `SpaceResponseDto` has exactly `id`, `name`, `ownerId`, `createdAt`, `updatedAt` mapped  
**And** no `role` or `membershipRole` field is present

---

### Scenario 8 — SpaceGraphQLMapper maps empty paginated result

**Given** a `PaginatedResult<SpaceViewModel>` with `items = []`, `total = 0`, `page = 1`, `perPage = 10`  
**When** `toPaginatedResponseDto(paginated)` is called  
**Then** the result has `items = []`, `total = 0`, `page = 1`, `perPage = 10`

---

### Scenario 9 — spaceCreate does NOT need X-Space-ID header

This scenario is verified via E2E test (NOT unit test). The `@SkipSpace()` decorator on `spaceCreate` causes `SpaceGuard` to bypass header validation. If `@SkipSpace()` is absent, the guard throws. The unit spec MUST NOT test decorator presence — only integration/E2E can assert this reliably.

---

### Scenario 10 — spacesFindByUser does NOT need X-Space-ID header

Same rationale as Scenario 9. `@SkipSpace()` is applied to `spacesFindByUser`. E2E validates guard bypass. Unit spec does NOT test decorator presence.

---

## 10. Test Requirements

### 10.1 `space.mapper.spec.ts` — unit tests (no NestJS DI)

MUST cover:
- `toResponseDtoFromViewModel` — maps all 5 fields from a full `SpaceViewModel`
- `toResponseDtoFromViewModel` — maps `updatedAt = undefined` (nullable)
- `toPaginatedResponseDto` — maps paginated result with items
- `toPaginatedResponseDto` — maps empty paginated result

MUST NOT cover:
- DTO decorator behavior (`@Field`, `@ObjectType`) — these are NestJS internals
- GraphQL schema generation

### 10.2 `space-queries.resolver.spec.ts` — unit tests

Setup:
- `queryBus = { execute: jest.fn() } as jest.Mocked<QueryBus>`
- `mapper = { toResponseDtoFromViewModel: jest.fn(), toPaginatedResponseDto: jest.fn() } as jest.Mocked<SpaceGraphQLMapper>`
- `resolver = new SpaceQueriesResolver(queryBus, mapper)`

MUST cover:
- `spaceFindById` — dispatches `SpaceFindByIdQuery` and returns mapped response
- `spaceFindById` — returns `null` when queryBus returns null/undefined
- `spacesFindByUser` — dispatches `SpacesFindByUserQuery` with `userId` from user and returns paginated response

MUST NOT cover:
- `@SkipSpace()` decorator presence (E2E only)
- `@UseGuards` decorator presence (E2E only)

### 10.3 `space-mutations.resolver.spec.ts` — unit tests

Setup:
- `commandBus = { execute: jest.fn() } as jest.Mocked<CommandBus>`
- `mutationResponseGraphQLMapper = { toResponseDto: jest.fn() } as jest.Mocked<MutationResponseGraphQLMapper>`
- `resolver = new SpaceMutationsResolver(commandBus, mutationResponseGraphQLMapper)`

MUST cover:
- `spaceCreate` — dispatches `CreateSpaceCommand` with `name` from input and `ownerId` from user, NOT from input
- `spaceAddMember` — dispatches `AddMemberCommand` with `spaceId`, `targetUserId` from input and `requestingUserId` from user
- `spaceRemoveMember` — dispatches `RemoveMemberCommand` with same flattening pattern
- All mutations return `MutationResponseDto` from `mutationResponseGraphQLMapper.toResponseDto`

MUST NOT cover:
- `@SkipSpace()` decorator presence on `spaceCreate` (E2E only)
- `@UseGuards` decorator presence (E2E only)

---

## 11. Constraints and Invariants

1. `requestingUserId` MUST NEVER be a client-visible input field in any DTO.
2. `ownerId` is the canonical field name for the space owner (not `userId`).
3. `SpaceResponseDto` MUST NOT include a `role` or `membershipRole` field.
4. `MembershipRoleEnum` MUST be registered via `registerEnumType()` before the GraphQL schema is built.
5. `@SkipSpace()` MUST be applied to `spaceCreate` and `spacesFindByUser` — these two operations run before a space context can exist.
6. `spaceAddMember` and `spaceRemoveMember` MUST NOT have `@SkipSpace()` — they require SpaceGuard to validate the X-Space-ID header.
7. All mutations MUST return `MutationResponseDto`, not a full entity response.
8. `SpaceGraphQLMapper` is the only place where `SpaceViewModel` is transformed to `SpaceResponseDto`. Resolvers MUST delegate all mapping to it.
9. The domain, application, and persistence layers MUST NOT be modified.
10. `SpacesModule` providers array MUST include all new GraphQL providers.

---

## 12. Out of Scope

- E2E tests (separate concern, not part of this spec)
- `MembershipFindByUserAndSpaceQuery` — no GraphQL operation exposed for it
- REST transport changes
- Domain / application / persistence changes
- `SpaceGuard`, `SpaceInterceptor`, `SpaceContext` changes
- Membership role on `SpaceResponseDto`
- Pagination input (filter/sort/page) for `spacesFindByUser` — pass-through to existing query as-is
