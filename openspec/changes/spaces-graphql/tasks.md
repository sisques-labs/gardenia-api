# Tasks: Spaces GraphQL Transport

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 280–340 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | All 13 files (12 new + 1 modified) | PR 1 | Single atomic transport slice; all tests included |

---

## Phase 1: DTOs (no dependencies)

- [x] T1 — Create `src/contexts/spaces/transport/graphql/dtos/requests/space/space-create.request.dto.ts` — `SpaceCreateRequestDto` with `@Field(() => String) name: string` + `@IsString @IsNotEmpty`. No `ownerId` field.
- [x] T2 — Create `src/contexts/spaces/transport/graphql/dtos/requests/space/space-find-by-id.request.dto.ts` — `SpaceFindByIdRequestDto` with `@Field(() => ID) id: string` + `@IsUUID @IsNotEmpty`.
- [x] T3 — Create `src/contexts/spaces/transport/graphql/dtos/requests/space/space-add-member.request.dto.ts` — `SpaceAddMemberRequestDto` with `spaceId: string` + `targetUserId: string` (both `@IsUUID @IsNotEmpty`). No `requestingUserId`.
- [x] T4 — Create `src/contexts/spaces/transport/graphql/dtos/requests/space/space-remove-member.request.dto.ts` — `SpaceRemoveMemberRequestDto` identical shape to `SpaceAddMemberRequestDto`.
- [x] T5 — Create `src/contexts/spaces/transport/graphql/dtos/responses/space/space.response.dto.ts` — `SpaceResponseDto` (`id`, `name`, `ownerId`, `createdAt`, `updatedAt`; no `role`/`membershipRole`). `PaginatedSpaceResultDto extends BasePaginatedResultDto` adding `items: SpaceResponseDto[]`.
- [x] T6 — Create `src/contexts/spaces/transport/graphql/enums/space/space-registered-enums.graphql.ts` — `registerEnumType(MembershipRoleEnum, { name: 'MembershipRoleEnum' })` side-effect only; no DTO field yet.

## Phase 2: Mapper + spec (depends on T5)

- [x] T7 — Create `src/contexts/spaces/transport/graphql/mappers/space/space.mapper.ts` — `SpaceGraphQLMapper` with `toResponseDtoFromViewModel(vm: SpaceViewModel): SpaceResponseDto` (maps `id, name, ownerId, createdAt, updatedAt`; ownerId NOT userId) and `toPaginatedResponseDto(result: PaginatedResult<SpaceViewModel>): PaginatedSpaceResultDto`.
- [x] T8 — Create `src/contexts/spaces/transport/graphql/mappers/space/space.mapper.spec.ts` — unit, direct construction. Cases: all 5 fields incl. ownerId, nullable `updatedAt`, paginated with items, empty paginated. Mirrors `plant.mapper.spec.ts` pattern.

## Phase 3: Resolvers + specs (depends on T1–T8)

- [x] T9 — Create `src/contexts/spaces/transport/graphql/resolvers/space/space-queries.resolver.ts` — `SpaceQueriesResolver` with `QueryBus` + `SpaceGraphQLMapper`. Methods: `spaceFindById(input, @CurrentUser user)` → `SpaceFindByIdQuery`, returns `SpaceResponseDto | null`; `spacesFindByUser(@CurrentUser user)` → `@SkipSpace() @UseGuards(JwtAuthGuard)` at method, `SpacesFindByUserQuery({userId: user.userId})` → `PaginatedSpaceResultDto`.
- [x] T10 — Create `src/contexts/spaces/transport/graphql/resolvers/space/space-queries.resolver.spec.ts` — unit, direct construction with `{ execute: jest.fn() }` buses and mock mapper. Cases: `spaceFindById` found, `spaceFindById` null, `spacesFindByUser` dispatches correct userId, `@SkipSpace` metadata on `spacesFindByUser` via `Reflect.getMetadata`.
- [x] T11 — Create `src/contexts/spaces/transport/graphql/resolvers/space/space-mutations.resolver.ts` — `SpaceMutationsResolver` with `@UseGuards(JwtAuthGuard)` at class. Methods: `spaceCreate(@CurrentUser, input)` → `@SkipSpace()`, `CreateSpaceCommand({name, ownerId: user.userId})`; `spaceAddMember(@CurrentUser, input)` → `AddMemberCommand({spaceId, targetUserId, requestingUserId: user.userId})`; `spaceRemoveMember` same shape. All return `MutationResponseDto` via `MutationResponseGraphQLMapper`.
- [x] T12 — Create `src/contexts/spaces/transport/graphql/resolvers/space/space-mutations.resolver.spec.ts` — unit, direct construction with mock `CommandBus` and `MutationResponseGraphQLMapper`. Cases: all 3 mutations dispatch correct command shapes (ownerId/requestingUserId from user payload NOT input); `@SkipSpace` metadata on `spaceCreate` via `Reflect.getMetadata`; id echoed for `spaceAddMember`/`spaceRemoveMember`.

## Phase 4: Module wiring (depends on T6, T9, T11)

- [x] T13 — Modify `src/contexts/spaces/spaces.module.ts` — add side-effect import `import './transport/graphql/enums/space/space-registered-enums.graphql'` at top; add `const GRAPHQL_PROVIDERS = [SpaceQueriesResolver, SpaceMutationsResolver, SpaceGraphQLMapper]` and spread into `providers`. `CqrsModule` already imported; `TRANSPORT_PROVIDERS` untouched.
