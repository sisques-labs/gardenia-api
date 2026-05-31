# Design: Spaces GraphQL Transport

## 1. Executive summary

Add a GraphQL transport layer to the `spaces` bounded context by mirroring the
canonical `plants` GraphQL transport 1:1. No domain, application, or persistence
code is touched. We introduce request DTOs, response DTOs, a view-model mapper, an
enum scaffold, and two resolvers (queries + mutations), then wire them into
`SpacesModule` via a `GRAPHQL_PROVIDERS` array plus an enum side-effect import.

## 2. Architecture decisions (ADR-style)

### ADR-1 — Mirror the `plants` GraphQL pattern exactly

**Decision:** Replicate the existing `plants` transport/graphql structure file-for-file,
adapting only vocabulary (`plant` -> `space`, `userId` -> `ownerId`) and the operation map.

**Rationale:** `plants` is the proven, in-repo canonical GraphQL transport. The pattern
already resolves `GqlExecutionContext` correctly through `SpaceGuard`/`SpaceInterceptor`,
already integrates with the global GraphQL module, and is covered by unit specs. Copying
a proven convention minimizes risk, review surface, and cognitive load — there are NO new
architectural decisions to make here, only a mechanical translation.

**Rejected alternatives:**
- *Single combined resolver (queries + mutations in one class).* Rejected: breaks parity
  with `plants`, mixes `@UseGuards(JwtAuthGuard)` (mutation-only) with guard-free queries,
  and reduces testability.
- *Reuse REST `createSpace` semantics (re-query and return full space).* Rejected: GraphQL
  mutations follow the `MutationResponseDto` convention from `plants`; returning the full
  aggregate would diverge from the established transport contract.

### ADR-2 — Split queries and mutations into separate resolvers

**Decision:** Two resolver classes:
- `SpaceQueriesResolver` — `@Resolver()`, no guard, injects `QueryBus` + `SpaceGraphQLMapper`.
- `SpaceMutationsResolver` — `@Resolver()` + `@UseGuards(JwtAuthGuard)`, injects `CommandBus`
  + `MutationResponseGraphQLMapper`.

**Rationale:**
1. **Auth boundary clarity.** All mutations require an authenticated user (`@CurrentUser`),
   so `@UseGuards(JwtAuthGuard)` applies cleanly at the class level. Queries here do not need
   the JWT guard at class level (`spacesFindByUser` still reads `@CurrentUser` for `userId`,
   but parity with `plants` keeps the split). Keeping them apart avoids guard bleed.
2. **Testability.** Each resolver is constructed directly with mocked buses/mappers in its own
   spec (`new SpaceQueriesResolver(queryBus, mapper)`), with no NestJS testing module overhead.
   A combined resolver would force every spec to mock both buses and both mappers.
3. **Dependency minimalism.** Query resolver never sees `CommandBus`; mutation resolver never
   sees `QueryBus`. Constructor signatures stay narrow and intent-revealing.

### ADR-3 — `@SkipSpace()` on `spaceCreate` and `spacesFindByUser`

**Decision:** Decorate `spaceCreate` and `spacesFindByUser` resolver methods with `@SkipSpace()`
(from `src/shared/decorators/skip-space.decorator`).

**Rationale:** `SpaceGuard` enforces an `X-Space-ID` header/context for every operation by
default. But these two operations run *before* a space context can exist:
- `spaceCreate` is how a client obtains its very first space — there is no `X-Space-ID` yet.
- `spacesFindByUser` lists the spaces a user belongs to precisely so the client can *choose*
  an `X-Space-ID` — it cannot require one as a precondition.

Their REST equivalents in `SpacesController` already carry `@SkipSpace()` (lines 50 and 76),
so this preserves cross-transport parity. Omitting it would cause `SpaceGuard` to reject these
calls with an "X-Space-ID required" error, making space bootstrapping impossible. The other
three operations (`spaceFindById`, `spaceAddMember`, `spaceRemoveMember`) operate on a known
space and therefore keep the default space-context requirement.

### ADR-4 — Resolved open questions (locked)

| # | Question | Decision |
|---|----------|----------|
| 1 | `membershipRole` in `SpaceResponseDto`? | **NO.** `SpaceViewModel` exposes only `id, name, ownerId, createdAt, updatedAt`. No role field. `MembershipRoleEnum` is still registered as a scaffold for future use. |
| 2 | Mutation return shape | **`MutationResponseDto`** with `id`, built via `MutationResponseGraphQLMapper.toResponseDto({ success, message, id })`. Plants parity. |
| 3 | Owner field name | **`ownerId`** (spaces vocabulary, matches `SpaceViewModel.ownerId` and `SpaceRestResponseDto.ownerId`). NOT `userId`. |

## 3. File structure (full paths)

All new files live under `src/contexts/spaces/transport/graphql/`:

```
src/contexts/spaces/transport/graphql/
  dtos/
    requests/space/
      space-create.request.dto.ts          # InputType: name
      space-add-member.request.dto.ts       # InputType: spaceId, targetUserId
      space-remove-member.request.dto.ts    # InputType: spaceId, targetUserId
      space-find-by-id.request.dto.ts       # InputType: id
    responses/space/
      space.response.dto.ts                 # SpaceResponseDto + PaginatedSpaceResultDto
  enums/space/
    space-registered-enums.graphql.ts       # registerEnumType(MembershipRoleEnum) side-effect
  mappers/space/
    space.mapper.ts                         # SpaceGraphQLMapper
    space.mapper.spec.ts                    # unit spec
  resolvers/space/
    space-queries.resolver.ts               # SpaceQueriesResolver
    space-queries.resolver.spec.ts          # unit spec
    space-mutations.resolver.ts             # SpaceMutationsResolver
    space-mutations.resolver.spec.ts        # unit spec
```

Note: `spacesFindByUser` takes no client-facing positional argument (the `userId` comes from
`@CurrentUser`), so there is NO `spaces-find-by-user.request.dto.ts`. This is the one deliberate
deviation from a literal plant-for-space file copy.

Plus one modified file: `src/contexts/spaces/spaces.module.ts` (~6 lines).

## 4. Exact GraphQL schema (generated SDL)

### Input types

```graphql
input SpaceCreateRequestDto {
  "The name of the space"
  name: String!
}

input SpaceAddMemberRequestDto {
  "The id of the space"
  spaceId: ID!
  "The id of the user to add"
  targetUserId: ID!
}

input SpaceRemoveMemberRequestDto {
  "The id of the space"
  spaceId: ID!
  "The id of the user to remove"
  targetUserId: ID!
}

input SpaceFindByIdRequestDto {
  "The id of the space"
  id: ID!
}
```

### Return types

```graphql
type SpaceResponseDto {
  "The id of the space"
  id: ID!
  "The name of the space"
  name: String!
  "The id of the space owner"
  ownerId: String!
  "When the space was created"
  createdAt: DateTime!
  "When the space was last updated"
  updatedAt: DateTime
}

type PaginatedSpaceResultDto {       # extends BasePaginatedResultDto
  items: [SpaceResponseDto!]!
  total: Int!
  page: Int!
  perPage: Int!
  totalPages: Int!
}

# MutationResponseDto is provided by @sisques-labs/nestjs-kit (already in schema):
# type MutationResponseDto { success: Boolean!  message: String!  id: String }

# MembershipRole enum registered as scaffold (not referenced by any field yet):
enum MembershipRole { OWNER  MEMBER  ... }
```

### Queries and Mutations

```graphql
type Query {
  spaceFindById(input: SpaceFindByIdRequestDto!): SpaceResponseDto      # nullable
  spacesFindByUser: PaginatedSpaceResultDto!                            # @SkipSpace, no args
}

type Mutation {
  spaceCreate(input: SpaceCreateRequestDto!): MutationResponseDto!      # @SkipSpace
  spaceAddMember(input: SpaceAddMemberRequestDto!): MutationResponseDto!
  spaceRemoveMember(input: SpaceRemoveMemberRequestDto!): MutationResponseDto!
}
```

`requestingUserId` is NEVER a client-facing field. It is always derived from `@CurrentUser`.
`spacesFindByUser` exposes no input argument — its `userId` is derived from `@CurrentUser`.

## 5. Module integration

In `src/contexts/spaces/spaces.module.ts`, mirror `plants.module.ts`:

1. **Enum side-effect import** at the top of the import block (registers enums before schema build):
   ```ts
   import './transport/graphql/enums/space/space-registered-enums.graphql';
   ```
2. **Import the providers:**
   ```ts
   import { SpaceGraphQLMapper } from './transport/graphql/mappers/space/space.mapper';
   import { SpaceQueriesResolver } from './transport/graphql/resolvers/space/space-queries.resolver';
   import { SpaceMutationsResolver } from './transport/graphql/resolvers/space/space-mutations.resolver';
   ```
3. **Declare a `GRAPHQL_PROVIDERS` array** alongside the existing grouped-providers convention:
   ```ts
   const GRAPHQL_PROVIDERS = [
     SpaceQueriesResolver,
     SpaceMutationsResolver,
     SpaceGraphQLMapper,
   ];
   ```
4. **Spread it into `providers`:**
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
     ...GRAPHQL_PROVIDERS,
   ],
   ```

`CqrsModule` is already imported, so `CommandBus`/`QueryBus` resolve for the resolvers.
The existing `TRANSPORT_PROVIDERS` (SpaceGuard, SpaceInterceptor, SpaceRestMapper) stay untouched.

### Enum side-effect import pattern

The enum file is imported purely for its side effect (calling `registerEnumType` at module load),
NOT for any exported symbol. Following `plant-registered-enums.graphql.ts`, the file also exports a
`registeredSpaceEnums` array for documentation/future reference, but the load-bearing line is the
bare `import '...';` in `spaces.module.ts`. This guarantees `MembershipRoleEnum` is registered with
the GraphQL type registry before NestJS builds the schema, preventing schema-build failure if a
field ever references it.

## 6. Data flow per operation

### Queries (`SpaceQueriesResolver`, via `QueryBus` + `SpaceGraphQLMapper`)

```
spaceFindById(input):
  Resolver -> new SpaceFindByIdQuery({ spaceId: input.id })
           -> queryBus.execute -> SpaceFindByIdQueryHandler
           -> SpaceViewModel | null
           -> result ? mapper.toResponseDtoFromViewModel(result) : null
           -> SpaceResponseDto | null

spacesFindByUser():                                  # @SkipSpace, @CurrentUser
  Resolver -> new SpacesFindByUserQuery({ userId: user.userId })
           -> queryBus.execute -> SpacesFindByUserQueryHandler
           -> PaginatedResult<SpaceViewModel>
           -> mapper.toPaginatedResponseDto(result)
           -> PaginatedSpaceResultDto
```

### Mutations (`SpaceMutationsResolver`, via `CommandBus` + `MutationResponseGraphQLMapper`)

```
spaceCreate(input, user):                            # @SkipSpace, @CurrentUser
  Resolver -> commandBus.execute<CreateSpaceCommand, string>(
                new CreateSpaceCommand({ name: input.name, ownerId: user.userId }))
           -> spaceId: string
           -> mutationResponseGraphQLMapper.toResponseDto({
                success: true, message: 'Space created successfully', id: spaceId })
           -> MutationResponseDto

spaceAddMember(input, user):                         # @CurrentUser
  Resolver -> commandBus.execute(new AddMemberCommand({
                spaceId: input.spaceId,
                targetUserId: input.targetUserId,
                requestingUserId: user.userId }))    # void
           -> mutationResponseGraphQLMapper.toResponseDto({
                success: true, message: 'Member added successfully', id: input.spaceId })
           -> MutationResponseDto

spaceRemoveMember(input, user):                      # @CurrentUser
  Resolver -> commandBus.execute(new RemoveMemberCommand({
                spaceId: input.spaceId,
                targetUserId: input.targetUserId,
                requestingUserId: user.userId }))    # void
           -> mutationResponseGraphQLMapper.toResponseDto({
                success: true, message: 'Member removed successfully', id: input.spaceId })
           -> MutationResponseDto
```

Key flow rules:
- `CreateSpaceCommand` returns the new `spaceId` (string) -> placed in `MutationResponseDto.id`.
- `AddMemberCommand` / `RemoveMemberCommand` are void -> `MutationResponseDto.id` echoes
  `input.spaceId` (parity with how `plantUpdate`/`plantDelete` echo `input.id`).

### `SpaceGraphQLMapper` shape

```ts
toResponseDtoFromViewModel(vm: SpaceViewModel): SpaceResponseDto {
  return {
    id: vm.id,
    name: vm.name,
    ownerId: vm.ownerId,
    createdAt: vm.createdAt,
    updatedAt: vm.updatedAt,
  };
}

toPaginatedResponseDto(p: PaginatedResult<SpaceViewModel>): PaginatedSpaceResultDto {
  return {
    items: p.items.map((vm) => this.toResponseDtoFromViewModel(vm)),
    total: p.total,
    page: p.page,
    perPage: p.perPage,
    totalPages: p.totalPages,
  };
}
```

## 7. Testing strategy

Pure unit specs, no NestJS testing module — construct each class directly with mocked
dependencies (the established `plants` pattern: `new Resolver(bus, mapper)`).

### `space.mapper.spec.ts`
- `toResponseDtoFromViewModel` maps every `SpaceViewModel` field to the DTO, including `ownerId`
  (NOT `userId`) and pass-through of `updatedAt`.
- `toPaginatedResponseDto` maps each item and preserves `total/page/perPage/totalPages`.

### `space-queries.resolver.spec.ts`
- Mock `QueryBus` (`{ execute: jest.fn() }`) and `SpaceGraphQLMapper`
  (`{ toResponseDtoFromViewModel, toPaginatedResponseDto }`).
- `spaceFindById`: dispatches `SpaceFindByIdQuery` once and returns the mapped DTO;
  returns `null` when the query resolves `null`.
- `spacesFindByUser`: derives `userId` from the injected `@CurrentUser` payload, dispatches
  `SpacesFindByUserQuery` once, returns the mapped paginated DTO.

### `space-mutations.resolver.spec.ts`
- Mock `CommandBus` and `MutationResponseGraphQLMapper`.
- `spaceCreate`: dispatches `CreateSpaceCommand` with `{ name, ownerId: user.userId }`; the
  returned `spaceId` lands in `MutationResponseDto.id`. Assert `ownerId` is taken from the user
  payload, never from input.
- `spaceAddMember` / `spaceRemoveMember`: dispatch the right command with
  `requestingUserId` sourced from `@CurrentUser` (assert it is NOT a client field) and
  `id` echoing `input.spaceId`.
- **`@SkipSpace` guard assertion (risk mitigation):** assert via `Reflect.getMetadata`
  (using the `SkipSpace` decorator's metadata key) that `spaceCreate` and `spacesFindByUser`
  carry the skip-space metadata, so a future refactor cannot silently drop it.

### Mock injection pattern (from `plant-queries.resolver.spec.ts`)
```ts
queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
mapper = {
  toResponseDtoFromViewModel: jest.fn(),
  toPaginatedResponseDto: jest.fn(),
} as unknown as jest.Mocked<SpaceGraphQLMapper>;
resolver = new SpaceQueriesResolver(queryBus, mapper);
```
For the `@CurrentUser` parameter, pass a plain payload object directly to the method under test
(e.g. `{ userId: USER_ID }`) — the decorator is a no-op when the method is invoked directly.

## 8. Risks and mitigations

| Risk | Mitigation |
|------|-----------|
| Missing `@SkipSpace` -> "X-Space-ID required" on create/list | Metadata assertion in mutations + queries specs (ADR-3). |
| `requestingUserId`/`ownerId` accidentally exposed as a client input field | Schema review + spec asserting these come from `@CurrentUser`; DTOs deliberately omit them. |
| `MembershipRoleEnum` not registered -> schema build failure if referenced | Enum side-effect import wired before schema build (Section 5). |
| Field-naming drift (`userId` vs `ownerId`) | Locked to `ownerId` (ADR-4 #3); mapper + DTO + spec all use `ownerId`. |

## 9. Out of scope (carried from proposal)

Domain/application/persistence changes; `SpaceGuard`/`SpaceInterceptor`/space-context changes;
REST changes; E2E tests; `membershipRole` on the response DTO; a GraphQL op for
`MembershipFindByUserAndSpace`.

## 10. Effort

~250–320 LOC across ~12 new files (most < 40 lines) plus ~6 lines in `spaces.module.ts`.
Low complexity, single PR, no migrations. Well under the 400-line review budget.
```