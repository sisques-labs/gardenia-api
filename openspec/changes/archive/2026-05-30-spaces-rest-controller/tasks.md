# Tasks: Spaces REST Controller

**Change**: spaces-rest-controller
**Phase**: tasks
**Date**: 2026-05-30
**Status**: complete
**Spec**: `openspec/changes/spaces-rest-controller/spec.md`
**Design**: `openspec/changes/spaces-rest-controller/design.md`

---

## Execution Order

Tasks are grouped in dependency layers. Tasks within the same layer can run in parallel.
Tasks in a later layer MUST wait for all tasks in the preceding layer to complete.

```
Layer 1 (parallel): T1, T2, T3, T4
Layer 2 (parallel): T5, T6
Layer 3 (parallel): T7, T8, T9
Layer 4 (sequential): T10
Layer 5 (sequential): T11
```

---

## Layer 1 — Foundation (parallel)

These tasks create new files or modify files that no other task in this change depends on.
No cross-dependencies within the layer.

---

### [x] T1 — Create `NotSpaceOwnerException`

- **File**: `src/contexts/spaces/domain/exceptions/not-space-owner.exception.ts`
- **Action**: Create new domain exception `NotSpaceOwnerException extends BaseException` that maps to HTTP 403 Forbidden. Pattern: copy `NotASpaceMemberException` but use message `"User '{userId}' is not the owner of space '{spaceId}'"`.
- **Spec**: §2.2 — ForbiddenException (HTTP 403) for non-owner AddMember/RemoveMember
- **Test**: No unit test required for a plain exception class (value is verified via handler tests in T5/T6). If a test is added, assert the message format.

---

### [x] T2 — Create `CreateSpaceDto`

- **File**: `src/contexts/spaces/transport/rest/dtos/create-space.dto.ts`
- **Action**: Create DTO with `name: string` decorated with `@IsString()`, `@IsNotEmpty()`, and `@ApiProperty()`.
- **Spec**: §4.1
- **Test**: No unit test required (validation is exercised by e2e or NestJS pipe tests). A short spec comment inline is sufficient.

---

### [x] T3 — Create `AddMemberDto`

- **File**: `src/contexts/spaces/transport/rest/dtos/add-member.dto.ts`
- **Action**: Create DTO with `userId: string` decorated with `@IsUUID()`, `@IsNotEmpty()`, and `@ApiProperty()`.
- **Spec**: §4.2
- **Test**: Same as T2 — no unit test required for pure validation DTO.

---

### [x] T4 — Create `SpaceRestResponseDto`

- **File**: `src/contexts/spaces/transport/rest/dtos/space-rest-response.dto.ts`
- **Action**: Create response DTO with fields `id`, `name`, `ownerId`, `createdAt`, `updatedAt`, all decorated with `@ApiProperty()`. Types match `SpaceViewModel` fields.
- **Spec**: §4.3
- **Test**: No unit test required; shape verified via mapper test in T7.

---

## Layer 2 — Exception fix + Read repository extension (parallel)

T5 and T6 both depend on T1 (new exception). T7 (read-repo impl) has no Layer 1 dependency and can be placed here for parallelism.

---

### [x] T5 — Fix `AddMemberCommandHandler`: swap exception

- **File**: `src/contexts/spaces/application/commands/add-member/add-member.handler.ts`
- **Action**: Import `NotSpaceOwnerException`. In the requester-authorization check, split the two failure cases:
  - If `!requesterMembership` → keep throwing `NotASpaceMemberException` (requester is not a member at all; HTTP 404 mapping is preserved per §8).
  - If `requesterMembership && !requesterMembership.role.isOwner()` → throw `NotSpaceOwnerException` (HTTP 403).
- **Spec**: §2.2
- **Depends on**: T1
- **Test** (`add-member.handler.spec.ts`): Update existing test `"should throw NotASpaceMemberException when requester is not the owner"` — split into two cases:
  1. Requester is a member but not owner → expects `NotSpaceOwnerException`
  2. Requester is not a member at all → expects `NotASpaceMemberException` (existing test, no change needed)

---

### [x] T6 — Fix `RemoveMemberCommandHandler`: swap exception

- **File**: `src/contexts/spaces/application/commands/remove-member/remove-member.handler.ts`
- **Action**: Same split as T5 — identical pattern on the authorization block.
- **Spec**: §2.2
- **Depends on**: T1
- **Test** (`remove-member.handler.spec.ts`): Mirror T5 spec updates for the remove handler.

---

### [x] T7 — Extend `ISpaceReadRepository` interface + implement `findByMember`

Two sub-steps that must ship together:

**7a — Interface extension**
- **File**: `src/contexts/spaces/domain/repositories/read/space-read.repository.ts`
- **Action**: Change `ISpaceReadRepository` from a plain type alias of `IBaseReadRepository<SpaceViewModel>` to an interface that extends it and adds `findByMember(userId: string): Promise<PaginatedResult<SpaceViewModel>>`.

**7b — TypeORM implementation**
- **File**: `src/contexts/spaces/infrastructure/persistence/typeorm/repositories/space-typeorm-read.repository.ts`
- **Action**: Implement `findByMember(userId)` using a `QueryBuilder` left join on `space_memberships` where `m.user_id = :userId`. Map results to `SpaceViewModel[]` using the existing `spaceMapper`. Return a `PaginatedResult` (all results, no pagination params — see design open question: user space count is capped by `MAX_SPACES_PER_USER`).

  ```ts
  async findByMember(userId: string): Promise<PaginatedResult<SpaceViewModel>> {
    const entities = await this.spaceRepo
      .createQueryBuilder('s')
      .innerJoin('space_memberships', 'm', 'm.space_id = s.id')
      .where('m.user_id = :userId', { userId })
      .getMany();

    const items = entities.map((e) => {
      const agg = this.spaceMapper.toDomain(e);
      return new SpaceViewModel(agg.toPrimitives());
    });
    return new PaginatedResult(items, items.length, 1, items.length || 1);
  }
  ```

- **Spec**: §2.1
- **Test** (`space-typeorm-read.repository.spec.ts`): Add `findByMember()` describe block:
  1. Mock `createQueryBuilder` chain → returns 1 owner-space + 1 member-space → assert 2 items in result.
  2. Mock returns empty array → assert `total = 0`, `items = []`.

---

## Layer 3 — Application fix + Mapper + Controller (parallel)

T8 depends on T7 (new repo method called by handler).
T9 depends on T2/T3/T4 (DTOs needed by mapper output shape).
T10 depends on T8/T9, so these must complete first.

---

### [x] T8 — Fix `SpacesFindByUserQueryHandler`: use `findByMember`

- **File**: `src/contexts/spaces/application/queries/spaces-find-by-user/spaces-find-by-user.handler.ts`
- **Action**: Replace the `Criteria`-based `findByCriteria` call with `this.spaceReadRepository.findByMember(query.userId.value)`. Remove the `Criteria` / `FilterOperator` imports if no longer needed.
- **Spec**: §2.1
- **Depends on**: T7
- **Test** (`spaces-find-by-user.handler.spec.ts`): Update mock and assertions:
  1. Mock `findByMember` returns 2 VMs (owner-space + member-space) → assert result has both.
  2. Assert `findByCriteria` is NOT called.

---

### [x] T9 — Create `SpaceRestMapper`

- **File**: `src/contexts/spaces/transport/rest/mappers/space/space.mapper.ts`
- **Action**: Create `@Injectable() SpaceRestMapper` with method `toResponse(vm: SpaceViewModel): SpaceRestResponseDto` that maps `{ id, name, ownerId, createdAt, updatedAt }` from VM to DTO. No builder required (VM is flat). Pattern: `account.mapper.ts`.
- **Spec**: §5
- **Depends on**: T4 (response DTO shape)
- **Test** (`space.mapper.spec.ts`): Create unit test:
  1. Build a `SpaceViewModel` fixture → call `mapper.toResponse(vm)` → assert all 5 fields match.
  2. Assert no secrets / extra fields leaked.

---

## Layer 4 — Controller (sequential — depends on T8, T9)

---

### [x] T10 — Create `SpacesController`

- **File**: `src/contexts/spaces/transport/rest/controllers/spaces.controller.ts`
- **Action**: Create controller following `auth.controller.ts` pattern. Inject `CommandBus`, `QueryBus`, `SpaceRestMapper`. Implement all 5 endpoints:

  | Route | Decorators | Bus call | Response |
  |-------|-----------|----------|----------|
  | `POST /spaces` | `@SkipSpace()`, `@UseGuards(JwtAuthGuard)`, `@HttpCode(201)` | `CreateSpaceCommand({ name, ownerId: user.userId })` | `201 SpaceRestResponseDto` (map command result via mapper) |
  | `GET /spaces/me` | `@SkipSpace()`, `@UseGuards(JwtAuthGuard)`, `@HttpCode(200)` | `SpacesFindByUserQuery({ userId: user.userId })` | `200 PaginatedResult<SpaceRestResponseDto>` |
  | `GET /spaces/:id` | `@UseGuards(JwtAuthGuard)`, `@HttpCode(200)` | `SpaceFindByIdQuery({ spaceId: params.id })` | `200 SpaceRestResponseDto` |
  | `POST /spaces/:id/members` | `@UseGuards(JwtAuthGuard)`, `@HttpCode(201)` | `AddMemberCommand({ spaceId: params.id, userId: body.userId, requestingUserId: user.userId })` | `201 void` |
  | `DELETE /spaces/:id/members/:userId` | `@UseGuards(JwtAuthGuard)`, `@HttpCode(204)` | `RemoveMemberCommand({ spaceId: params.id, userId: params.userId, requestingUserId: user.userId })` | `204 void` |

  All routes: `@ApiTags('spaces')`, `@ApiBearerAuth()` on class. Each route: `@ApiOperation`, `@ApiResponse` for every status code listed in spec §3.

- **Spec**: §3, §7
- **Depends on**: T8 (query works correctly), T9 (mapper injectable), T2/T3/T4 (DTO types)
- **Test** (`spaces.controller.spec.ts`): Create unit test mirroring `auth.controller.spec.ts`:
  1. `createSpace()` — dispatches `CreateSpaceCommand` with `ownerId = currentUser.userId`, not body.
  2. `listMySpaces()` — dispatches `SpacesFindByUserQuery` with `userId = currentUser.userId`.
  3. `getSpace()` — dispatches `SpaceFindByIdQuery` with correct `spaceId`.
  4. `addMember()` — dispatches `AddMemberCommand` with correct `spaceId`, `userId`, `requestingUserId`.
  5. `removeMember()` — dispatches `RemoveMemberCommand` with correct ids.
  6. ownerId is taken from `@CurrentUser`, never from request body (assert `CreateSpaceCommand.ownerId === user.userId`).

---

## Layer 5 — Module wiring (sequential — depends on T10)

---

### [x] T11 — Wire `SpacesController` and `SpaceRestMapper` into `SpacesModule`

- **File**: `src/contexts/spaces/spaces.module.ts`
- **Action**:
  1. Import `SpacesController` and add to `controllers: [SpacesController]` array.
  2. Add `SpaceRestMapper` to the `TRANSPORT_PROVIDERS` const (or a new `REST_MAPPERS` const).
  3. Ensure all necessary imports are present.
- **Spec**: §6
- **Depends on**: T10
- **Test**: No unit test for module wiring; covered by e2e smoke.

---

## Summary Table

| Task | File(s) | Type | Layer | Parallel? | Spec Ref |
|------|---------|------|-------|-----------|----------|
| T1 | `domain/exceptions/not-space-owner.exception.ts` | New | 1 | Yes | §2.2 |
| T2 | `transport/rest/dtos/create-space.dto.ts` | New | 1 | Yes | §4.1 |
| T3 | `transport/rest/dtos/add-member.dto.ts` | New | 1 | Yes | §4.2 |
| T4 | `transport/rest/dtos/space-rest-response.dto.ts` | New | 1 | Yes | §4.3 |
| T5 | `application/commands/add-member/add-member.handler.ts` | Modify | 2 | Yes | §2.2 |
| T6 | `application/commands/remove-member/remove-member.handler.ts` | Modify | 2 | Yes | §2.2 |
| T7 | `domain/repositories/read/space-read.repository.ts` + `infrastructure/.../space-typeorm-read.repository.ts` | Modify×2 | 2 | Yes | §2.1 |
| T8 | `application/queries/spaces-find-by-user/spaces-find-by-user.handler.ts` | Modify | 3 | Yes | §2.1 |
| T9 | `transport/rest/mappers/space/space.mapper.ts` | New | 3 | Yes | §5 |
| T10 | `transport/rest/controllers/spaces.controller.ts` | New | 4 | No | §3, §7 |
| T11 | `spaces.module.ts` | Modify | 5 | No | §6 |

**New files**: 7 (T1, T2, T3, T4, T9, T10 + `spaces.controller.spec.ts`, `space.mapper.spec.ts`)
**Modified files**: 5 (T5, T6, T7×2, T8, T11)

---

## Test Coverage Required

| Task | Test file | Cases |
|------|-----------|-------|
| T5 | `add-member.handler.spec.ts` | Update: member-not-owner → `NotSpaceOwnerException`; non-member → `NotASpaceMemberException` |
| T6 | `remove-member.handler.spec.ts` | Same split as T5 |
| T7 | `space-typeorm-read.repository.spec.ts` | Add `findByMember()` — returns owner+member spaces, excludes non-member |
| T8 | `spaces-find-by-user.handler.spec.ts` | Update: calls `findByMember`, not `findByCriteria`; returns merged result |
| T9 | `transport/rest/mappers/space/space.mapper.spec.ts` | New: all 5 fields mapped correctly |
| T10 | `transport/rest/controllers/spaces.controller.spec.ts` | New: 5 routes dispatch correct commands/queries; ownerId from `@CurrentUser` |

---

## Review Workload Forecast

| Metric | Estimate |
|--------|----------|
| New files (implementation) | 7 |
| Modified files | 5 |
| Estimated new lines (implementation) | ~220 |
| Estimated new lines (tests) | ~280 |
| **Total estimated changed lines** | **~500** |
| 400-line budget risk | **Medium-High** |
| Chained PRs recommended | **Yes** |
| Decision needed before apply | **Yes** |

### Suggested PR split (if chaining)

**PR 1 — Application layer fixes + repo extension** (T1, T5, T6, T7, T8)
- Exception, handler fixes, `findByMember` repo method + handler update.
- Estimated lines: ~180 (impl) + ~160 (tests) = ~340.
- Self-contained; unblocks GET /spaces/me correctness.

**PR 2 — Transport layer** (T2, T3, T4, T9, T10, T11)
- DTOs, mapper, controller, module wiring.
- Estimated lines: ~100 (impl) + ~120 (tests) = ~220.
- Depends on PR 1 merging first.

If a single PR is preferred, request `size:exception` label before apply.
