# Design: Spaces REST Controller

## Technical Approach

Add a transport-only REST slice to `SpacesModule` mirroring `auth.controller.ts`: a `SpacesController` dispatching exclusively via `CommandBus`/`QueryBus`, request/response DTOs with class-validator + Swagger, and a `SpaceRestMapper` shaping `SpaceViewModel` → `SpaceRestResponseDto`. Two application-layer fixes accompany it: a membership-inclusive `SpacesFindByUserQuery`, and a verification/clarification of the AddMember/RemoveMember owner check. No domain logic enters the transport layer; authorization stays in application/domain.

## Architecture Decisions

| Decision | Choice | Alternatives rejected | Rationale |
|----------|--------|----------------------|-----------|
| Mapping | Dedicated `SpaceRestMapper` provider (no domain builder needed — VM is already flat) | Inline mapping in controller | Auth uses a mapper provider; isolates shaping, testable in isolation |
| Guard usage | `@SkipSpace()` on `POST /spaces` and `GET /spaces/me`; let global `SpaceGuard` enforce `X-Space-ID` on `:id`-scoped routes | Manual membership check per route | `SpaceGuard` already validates membership via `MembershipFindByUserAndSpaceQuery`; reuse it |
| `ownerId` source | From `@CurrentUser().userId`, never request body | Accept `ownerId` in DTO | Prevents spoofing; matches CQRS command input contract |
| Bug 1 fix location | New repo method `findByMember(userId)` on `ISpaceReadRepository` using a `QueryBuilder` join, called by handler | Filter via `Criteria` only | `Criteria`/`findByCriteria` cannot express a join on `space_memberships`; needs explicit query |
| Bug 2 (owner check) | KEEP existing aggregate check (`space.memberships → role.isOwner()`); only swap thrown exception to a 403-mapping one | Add redundant read-repo fetch + `ownerId` compare | Check ALREADY EXISTS and is correct DDD (decision lives on the aggregate). A second fetch+compare duplicates enforcement and bypasses the aggregate |

## Bug 2 clarification (IMPORTANT)

The proposal states AddMember/RemoveMember handlers "lack owner-only authorization." That is INACCURATE. Both handlers already enforce it:

```ts
if (!requesterMembership || !requesterMembership.role.isOwner()) {
  throw new NotASpaceMemberException(...); // maps to 4xx
}
```

The real gap is exception SEMANTICS: a non-owner member gets `NotASpaceMemberException` ("not a member") which is misleading and may not map to HTTP 403. Fix = introduce/throw a `NotSpaceOwnerException` (403) for the "is a member but not owner" case, keeping the aggregate-based check. Do NOT add a separate read-repo `ownerId` compare.

## Data Flow

    POST /spaces ─→ SpacesController ─→ CommandBus ─→ CreateSpaceCommandHandler ─→ write repo
       (@CurrentUser.userId = ownerId)                         │
                                                               └→ returns spaceId

    GET /spaces/me ─→ Controller ─→ QueryBus ─→ SpacesFindByUserQueryHandler
                                                    └→ readRepo.findByMember(userId)
                                                          (spaces INNER JOIN space_memberships ON userId)
                                                    └→ map VM → SpaceRestResponseDto[]

    :id routes ─→ SpaceGuard (X-Space-ID membership) ─→ Controller ─→ Bus

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `transport/rest/controllers/spaces.controller.ts` | Create | 5 endpoints; inject CommandBus+QueryBus+SpaceRestMapper |
| `transport/rest/dtos/create-space.dto.ts` | Create | `name` (IsString, IsNotEmpty) + Swagger |
| `transport/rest/dtos/add-member.dto.ts` | Create | `userId` (IsUUID) + Swagger |
| `transport/rest/dtos/space-rest-response.dto.ts` | Create | `id,name,ownerId,createdAt,updatedAt` — camelCase, no secrets |
| `transport/rest/mappers/space/space.mapper.ts` | Create | `toResponse(vm): SpaceRestResponseDto` |
| `spaces.module.ts` | Modify | add `controllers: [SpacesController]`; add `SpaceRestMapper` to providers |
| `domain/repositories/read/space-read.repository.ts` | Modify | extend interface with `findByMember(userId, pagination?)` |
| `infrastructure/.../space-typeorm-read.repository.ts` | Modify | implement `findByMember` via QueryBuilder join on `space_memberships` |
| `application/queries/spaces-find-by-user/spaces-find-by-user.handler.ts` | Modify | call `findByMember(query.userId.value)` instead of ownerId Criteria |
| `domain/exceptions/not-space-owner.exception.ts` | Create | 403-mapping exception for member-but-not-owner |
| `application/commands/add-member/add-member.handler.ts` | Modify | throw `NotSpaceOwnerException` when member lacks owner role |
| `application/commands/remove-member/remove-member.handler.ts` | Modify | same exception swap |

## Interfaces / Contracts

```ts
// REST endpoints (all JwtAuthGuard; @CurrentUser supplies userId)
POST   /spaces                         body: CreateSpaceDto      -> { spaceId } 201, @SkipSpace
GET    /spaces/me                                                -> SpaceRestResponseDto[] 200, @SkipSpace
GET    /spaces/:id                                              -> SpaceRestResponseDto 200, SpaceGuard
POST   /spaces/:id/members             body: AddMemberDto        -> 201/204, SpaceGuard
DELETE /spaces/:id/members/:userId                              -> 204, SpaceGuard

// repository extension
findByMember(userId: string): Promise<PaginatedResult<SpaceViewModel>>;
//  spaceRepo.createQueryBuilder('s')
//    .innerJoin('space_memberships','m','m.space_id = s.id')
//    .where('m.user_id = :userId', { userId })
```

`SpaceRestResponseDto`: `{ id: string; name: string; ownerId: string; createdAt: Date; updatedAt: Date }`.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `SpacesController` 5 routes dispatch correct command/query; ownerId taken from `@CurrentUser`, not body | mock CommandBus/QueryBus + mapper |
| Unit | `SpaceRestMapper.toResponse` field mapping, no secrets | plain VM fixture |
| Unit | `SpacesFindByUserQueryHandler` calls `findByMember` | mock read repo |
| Unit | AddMember/RemoveMember throw `NotSpaceOwnerException` for non-owner member; succeed for owner | mock write repo + aggregate fixture |
| Integration | `findByMember` returns owner AND member-role spaces, excludes non-member | TypeORM test DB, seed memberships |
| E2E | 5 endpoints: 201/200/204, 401 unauthenticated, 403 non-owner member, 400 missing `X-Space-ID` on `:id` routes | supertest + JWT |

## Migration / Rollout

No DB migration. `space_memberships` and indexes (`@Index(['userId'])`) already exist; the join is read-only. All changes additive except the two handler exception swaps (restore-on-revert).

## Open Questions

- [ ] Should `findByMember` be paginated like `findByCriteria`, or return all (a user's space count is small, capped by `MAX_SPACES_PER_USER`)? Lean: return all, no pagination params on `GET /spaces/me`.
- [ ] Confirm `NotSpaceOwnerException` maps to HTTP 403 via the global exception filter (verify `BaseException` → status mapping during apply).
