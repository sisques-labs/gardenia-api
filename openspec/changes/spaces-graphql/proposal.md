# Proposal: Spaces GraphQL Transport

## Intent

### Problem
The `spaces` bounded context is fully built at the application and REST layers but has **zero GraphQL transport**. Clients that consume Gardenia through GraphQL (the canonical transport for `plants`) cannot create spaces, list their spaces, fetch a space by id, or manage membership. This forces space-related flows to mix REST and GraphQL, breaking transport consistency across the API.

### Why now
`plants` already ships a complete, canonical GraphQL transport (resolvers, DTOs, mapper, enum scaffold). `spaces` is the next context that GraphQL clients depend on — notably because `plants` operations are scoped by `X-Space-ID` and a GraphQL client needs a GraphQL path to obtain and select a space first. Closing this gap unblocks an all-GraphQL client without touching the domain or application layers.

### Success criteria
- All five space operations are reachable over GraphQL with the same semantics as REST.
- The implementation mirrors the `plants` GraphQL transport structure exactly — same folder layout, same DTO/mapper/resolver patterns, same `@nestjs/graphql` + `@sisques-labs/nestjs-kit` conventions.
- No changes to the domain, application, or persistence layers. No changes to `SpaceGuard` / `SpaceInterceptor` (both already resolve `GqlExecutionContext`).
- New resolvers and mapper are wired into `SpacesModule` and covered by unit specs at parity with the `plants` specs.

## Scope

### In scope
- GraphQL transport layer for `spaces` under `src/contexts/spaces/transport/graphql/`.
- Mutations: `spaceCreate` (`@SkipSpace`), `spaceAddMember`, `spaceRemoveMember`.
- Queries: `spaceFindById`, `spacesFindByUser` (`@SkipSpace`, paginated).
- Request input DTOs, a `SpaceResponseDto` response object type, a paginated result type, a space GraphQL mapper, and a registered-enums scaffold file.
- Wiring resolvers + mapper into `SpacesModule` via a `GRAPHQL_PROVIDERS` array (mirroring `plants.module.ts`).
- Unit specs for the mapper and both resolvers.

### Out of scope
- Any change to domain, application (commands/queries/handlers), or persistence layers.
- Any change to `SpaceGuard`, `SpaceInterceptor`, or the shared `space-context` service.
- Any change to REST transport (`SpacesController`, REST DTOs, REST mapper).
- E2E / integration tests (defer to a follow-up; this change targets transport + unit parity with `plants`).
- Exposing `membershipRole` on the space response (see Open Questions — current `SpaceViewModel` does not carry it).
- The `MembershipFindByUserAndSpaceQuery` — no current GraphQL operation maps to it.

### Affected files
New (12) under `src/contexts/spaces/transport/graphql/`:
```
dtos/requests/space/space-create.request.dto.ts
dtos/requests/space/space-find-by-id.request.dto.ts
dtos/requests/space/space-add-member.request.dto.ts
dtos/requests/space/space-remove-member.request.dto.ts
dtos/responses/space/space.response.dto.ts
enums/space/space-registered-enums.graphql.ts
mappers/space/space.mapper.ts
mappers/space/space.mapper.spec.ts
resolvers/space/space-queries.resolver.ts
resolvers/space/space-queries.resolver.spec.ts
resolvers/space/space-mutations.resolver.ts
resolvers/space/space-mutations.resolver.spec.ts
```
Modified (1):
```
src/contexts/spaces/spaces.module.ts   (add GRAPHQL_PROVIDERS array + register it)
```

## Approach

### Architecture decision: mirror `plants` exactly
The `plants` GraphQL transport is the canonical reference and is treated as a fixed template. Each `spaces` artifact maps 1:1 to its `plants` counterpart so the two contexts stay structurally identical and future maintenance is uniform.

| plants artifact | spaces artifact | Notes |
|---|---|---|
| `PlantMutationsResolver` | `SpaceMutationsResolver` | `@Resolver()` + `@UseGuards(JwtAuthGuard)`; injects `CommandBus` + `MutationResponseGraphQLMapper`; returns `MutationResponseDto` |
| `PlantQueriesResolver` | `SpaceQueriesResolver` | `@Resolver()`; injects `QueryBus` + `SpaceGraphQLMapper` |
| `PlantGraphQLMapper` | `SpaceGraphQLMapper` | `toResponseDtoFromViewModel(SpaceViewModel)` + `toPaginatedResponseDto(PaginatedResult<SpaceViewModel>)` |
| `PlantResponseDto` / `PaginatedPlantResultDto` | `SpaceResponseDto` / `PaginatedSpaceResultDto` | `@ObjectType`; paginated type extends `BasePaginatedResultDto` |
| `plant-*.request.dto.ts` | `space-*.request.dto.ts` | `@InputType` + `class-validator` |
| `plant-registered-enums.graphql.ts` | `space-registered-enums.graphql.ts` | enum scaffold/registration |

### Operation mapping (resolver -> application contract)
Application contracts are already grounded and unchanged:

- `spaceCreate(input: { name })` + `@CurrentUser` -> `CreateSpaceCommand({ name, ownerId: user.userId })` -> returns `MutationResponseDto` with the new space id. `@SkipSpace`.
- `spaceAddMember(input: { spaceId, targetUserId })` + `@CurrentUser` -> `AddMemberCommand({ spaceId, targetUserId, requestingUserId: user.userId })`.
- `spaceRemoveMember(input: { spaceId, targetUserId })` + `@CurrentUser` -> `RemoveMemberCommand({ spaceId, targetUserId, requestingUserId: user.userId })`.
- `spaceFindById(input: { spaceId })` -> `SpaceFindByIdQuery({ spaceId })` -> `SpaceResponseDto | null`.
- `spacesFindByUser` + `@CurrentUser` -> `SpacesFindByUserQuery({ userId: user.userId })` -> `PaginatedSpaceResultDto`. `@SkipSpace`.

### Key design choices
1. **Path-param flattening (risk #2).** REST exposes `spaceId`/`targetUserId` via URL path params (`:id`, `:id/members/:userId`). GraphQL has no path; these become explicit fields on the input DTOs: `spaceAddMember`/`spaceRemoveMember` inputs carry both `spaceId` and `targetUserId`. `requestingUserId` is never a client field — it always comes from `@CurrentUser`, exactly as REST does.
2. **`@SkipSpace` on `spaceCreate` and `spacesFindByUser` (risk #1).** Both run before a space context exists, so without `@SkipSpace` the `SpaceGuard` rejects them for a missing `X-Space-ID`. REST already marks the equivalent endpoints (`POST /spaces`, `GET /spaces/me`) with `@SkipSpace` — GraphQL mirrors this.
3. **`spaceCreate` returns `MutationResponseDto`, not the full space.** This follows the `plants` mutation convention (`plantCreate` returns `MutationResponseDto` with the id). Unlike REST `createSpace`, the resolver does not re-query the space — clients fetch it via `spaceFindById` if needed. This keeps mutation shape identical to `plants`.
4. **Paginated `spacesFindByUser`.** The application query returns `PaginatedResult<SpaceViewModel>`, so the GraphQL response is `PaginatedSpaceResultDto` (extends `BasePaginatedResultDto`) via `mapper.toPaginatedResponseDto`, mirroring `plantsFindByCriteria`.
5. **Enum registration scaffold (risk #3).** A `space-registered-enums.graphql.ts` file is created for parity with `plants`. `MembershipRoleEnum` is registered via `registerEnumType()` here so it is available to the schema. Whether the space response actually exposes a role field is an open question (see below) — registration is cheap and keeps the scaffold ready regardless.
6. **No guard/interceptor/module-import surprises.** `SpacesModule` already imports `CqrsModule`; the global GraphQL module is configured app-wide (as for `plants`). The only module change is adding a `GRAPHQL_PROVIDERS = [SpaceQueriesResolver, SpaceMutationsResolver, SpaceGraphQLMapper]` array to the providers list.

## Open questions
1. **Does `SpaceResponseDto` expose the caller's membership role?** `SpaceViewModel` exposes `id, name, ownerId, createdAt, updatedAt` only — it does NOT carry a membership role. `plants` has no equivalent. Options: (a) ship `SpaceResponseDto` mirroring the view model fields only (recommended — zero application-layer change, register the enum as a scaffold without using it on the response); (b) extend the read/query layer to surface role (OUT of the stated scope). **Recommended: option (a); resolve in spec.**
2. **Should `spaceCreate` return the full created space (like REST) or just `MutationResponseDto` (like `plants`)?** Recommended: `MutationResponseDto` for `plants` parity. Confirm in spec.
3. **`SpaceResponseDto` field naming for the owner:** REST/view model use `ownerId`; `plants` uses `userId`. Recommended: keep `ownerId` to match the `spaces` domain vocabulary rather than copying the `plants` field name. Confirm in spec.

## Risks
1. **Missing `@SkipSpace`** on `spaceCreate` / `spacesFindByUser` would throw "X-Space-ID required" via `SpaceGuard`. Mitigation: both decorated, asserted in resolver specs.
2. **Path-param flattening errors** — forgetting `spaceId`/`targetUserId` on add/remove member inputs, or accidentally exposing `requestingUserId` as a client field. Mitigation: input DTOs explicitly enumerate only client-supplied fields; `requestingUserId` sourced from `@CurrentUser` only.
3. **`MembershipRoleEnum` not registered** with `registerEnumType()` would break the schema if any field references it. Mitigation: registration scaffold file created; if Open Question #1 resolves to "no role field," the enum is still registered harmlessly for future use.
4. **Field-naming drift** between `plants` (`userId`) and `spaces` (`ownerId`) response DTOs could confuse clients. Mitigation: decided in spec (Open Question #3) and documented in the response DTO.

## Estimated effort
- **Lines changed:** ~250–320 added (12 small files, most under 40 lines, following `plants` sizes), ~6 lines modified in `spaces.module.ts`.
- **PR complexity:** Low. Pure additive transport layer, no domain/application/persistence changes, no migrations. Well within a single ~400-line PR budget.
- **Test surface:** 3 new spec files (mapper + 2 resolvers) at parity with `plants` specs.

## Dependencies
- `spaces` application layer (3 commands, 3 queries) and `SpaceViewModel` — already complete and stable.
- `SpaceGuard` + `SpaceInterceptor` already resolve `GqlExecutionContext` — no changes required.
- `@SkipSpace` decorator (shared) — already exists and used by REST.
- Global GraphQL module configured app-wide (same setup `plants` relies on) — already present.
- `@sisques-labs/nestjs-kit` providing `MutationResponseDto`, `MutationResponseGraphQLMapper`, `BasePaginatedResultDto`, `PaginatedResult` — already a dependency.
