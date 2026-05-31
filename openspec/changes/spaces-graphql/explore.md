# Exploration: Spaces GraphQL Transport

## Current State

The `spaces` bounded context is **graphql-transport-zero** — no resolver, no DTO, no mapper, no enum registration file exists under `src/contexts/spaces/transport/graphql/`. What exists today:

**Application layer (complete — all use cases available):**
- Commands: `CreateSpaceCommand`, `AddMemberCommand`, `RemoveMemberCommand`
- Queries: `SpaceFindByIdQuery`, `SpacesFindByUserQuery`, `MembershipFindByUserAndSpaceQuery`
- `SpaceViewModel` shape: `id`, `name`, `ownerId`, `createdAt`, `updatedAt`

**REST transport (complete):** `SpacesController` with POST /, GET /me, GET /:id, POST /:id/members, DELETE /:id/members/:userId.

**Critical positive finding:** `SpaceGuard` and `SpaceInterceptor` are already GraphQL-aware. Both call `GqlExecutionContext.create(context)` for the `'graphql'` type. No guard/interceptor changes needed for GraphQL — the space-context validation flows automatically.

**No GraphQL code exists for spaces.** Zero files to migrate or refactor.

## Affected Areas

- `src/contexts/spaces/spaces.module.ts` — add `GRAPHQL_PROVIDERS` const array + side-effect enum import
- `src/contexts/spaces/transport/graphql/` — entire new directory tree (12 new files)

## Reference Pattern (plants)

The `plants` pattern is the canonical reference. Key conventions:

| Layer | Pattern |
|---|---|
| Input DTOs | `@InputType('{Name}RequestDto')` with `@Field` + class-validator |
| Response DTOs | `@ObjectType('{Name}ResponseDto')` + `Paginated{Name}ResultDto extends BasePaginatedResultDto` |
| Mapper | `@Injectable()` service, `toResponseDtoFromViewModel(vm)` + `toPaginatedResponseDto(paginated)` |
| Queries resolver | `@Resolver()`, injects `QueryBus` + mapper, `@Query(() => Type)` methods |
| Mutations resolver | `@Resolver()`, `@UseGuards(JwtAuthGuard)` at class level, injects `CommandBus` + `MutationResponseGraphQLMapper`, returns `MutationResponseDto` |
| Enums | Side-effect import file calls `registerEnumType()`, imported in module |
| Module | `const GRAPHQL_PROVIDERS = [QueriesResolver, MutationsResolver, Mapper]` + side-effect import |

## Operations to Expose via GraphQL

**Mutations:**
1. `spaceCreate(input)` — `@SkipSpace()` required (no active space yet), `@JwtAuthGuard`
2. `spaceAddMember(input)` — SpaceGuard handles membership, `@JwtAuthGuard`
3. `spaceRemoveMember(input)` — same as above

**Queries:**
4. `spaceFindById(input)` — `@JwtAuthGuard`, SpaceGuard enforces membership
5. `spacesFindByUser` — `@SkipSpace()` (lists ALL user's spaces, no single-space context), `@JwtAuthGuard`

## File Inventory

**12 new files:**
```
src/contexts/spaces/transport/graphql/
  dtos/requests/space/
    space-create.request.dto.ts
    space-find-by-id.request.dto.ts
    space-add-member.request.dto.ts
    space-remove-member.request.dto.ts
  dtos/responses/space/
    space.response.dto.ts              (SpaceResponseDto + PaginatedSpaceResultDto)
  enums/space/
    space-registered-enums.graphql.ts  (registerEnumType for MembershipRoleEnum)
  mappers/space/
    space.mapper.ts
    space.mapper.spec.ts
  resolvers/space/
    space-queries.resolver.ts
    space-queries.resolver.spec.ts
    space-mutations.resolver.ts
    space-mutations.resolver.spec.ts
```

**1 modified file:**
```
src/contexts/spaces/spaces.module.ts
```

## Approaches

| Approach | Pros | Cons | Effort |
|---|---|---|---|
| Mirror plants pattern exactly | Zero ambiguity, consistent codebase, patterns proven | None | Low |
| Combine queries+mutations in one resolver | Fewer files | Breaks convention, harder to isolate tests | Low (wrong) |

**Only one viable approach.** The plants pattern is the established convention — no architectural decisions needed.

## Recommendation

Direct parallel to the `plants` GraphQL transport. This is a mechanical, low-risk implementation. The guard and interceptor already support GraphQL. Follow plants exactly: 12 new files + 1 module update.

`spacesFindByUser` returns `PaginatedSpaceResultDto extends BasePaginatedResultDto` — consistent with plants, since the query handler returns `PaginatedResult<SpaceViewModel>`.

## Risks

1. `spacesFindByUser` must use `@SkipSpace()` — operates across all user spaces, not scoped to one. Missing this causes `X-Space-ID header required` errors.
2. `spaceCreate` must also use `@SkipSpace()` — same reason.
3. `SpaceAddMemberRequestDto` needs `spaceId` + `targetUserId` (REST uses path params — these must be flattened into the input object).
4. `SpaceRemoveMemberRequestDto` needs `spaceId` + `targetUserId` for the same reason.
5. `MembershipRoleEnum` must be registered via `registerEnumType()` even if not initially in the response DTO — avoids future GraphQL schema conflicts.
