# Apply Progress: Spaces REST Controller — PR1

**Change**: spaces-rest-controller
**PR slice**: PR1 — Application Layer Fixes
**Mode**: Strict TDD (tests written alongside implementation)
**Date**: 2026-05-30
**Status**: PR1 complete — 5/11 tasks done

---

## Completed Tasks (PR1)

- [x] T1 — `NotSpaceOwnerException` created at `src/contexts/spaces/domain/exceptions/not-space-owner.exception.ts`
- [x] T5 — `AddMemberCommandHandler` exception split: non-member → `NotASpaceMemberException`, member-not-owner → `NotSpaceOwnerException`
- [x] T6 — `RemoveMemberCommandHandler` exception split: same pattern as T5
- [x] T7 — `ISpaceReadRepository` extended with `findByMember(userId)` interface method; TypeORM implementation added via `createQueryBuilder` inner join on `space_memberships`
- [x] T8 — `SpacesFindByUserQueryHandler` updated to call `findByMember(userId)` instead of `findByCriteria` with ownerId filter

**Additional (not in original task list but required for correctness):**
- [x] `BaseExceptionFilter` updated to register all space exceptions with correct HTTP status codes (403 for `NotSpaceOwnerException`, 404 for `SpaceNotFoundException`/`NotASpaceMemberException`, 409 for `SpaceLimitExceededException`/`DuplicateMembershipException`, 422 for `LastOwnerRemovalException`)

---

## Remaining Tasks (PR2)

- [ ] T2 — Create `CreateSpaceDto`
- [ ] T3 — Create `AddMemberDto`
- [ ] T4 — Create `SpaceRestResponseDto`
- [ ] T9 — Create `SpaceRestMapper`
- [ ] T10 — Create `SpacesController`
- [ ] T11 — Wire controller + mapper into `SpacesModule`

---

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `src/contexts/spaces/domain/exceptions/not-space-owner.exception.ts` | Created | New 403-mapping domain exception |
| `src/contexts/spaces/application/commands/add-member/add-member.handler.ts` | Modified | Split owner check: `!requesterMembership` → NotASpaceMemberException; `!isOwner()` → NotSpaceOwnerException |
| `src/contexts/spaces/application/commands/add-member/add-member.handler.spec.ts` | Modified | Updated authorization tests to expect NotSpaceOwnerException for member-not-owner case |
| `src/contexts/spaces/application/commands/remove-member/remove-member.handler.ts` | Modified | Same split as AddMember |
| `src/contexts/spaces/application/commands/remove-member/remove-member.handler.spec.ts` | Modified | Updated + added non-member test case |
| `src/contexts/spaces/domain/repositories/read/space-read.repository.ts` | Modified | Changed from type alias to interface; added `findByMember(userId)` |
| `src/contexts/spaces/infrastructure/persistence/typeorm/repositories/space-typeorm-read.repository.ts` | Modified | Implemented `findByMember` via QueryBuilder inner join on space_memberships |
| `src/contexts/spaces/infrastructure/persistence/typeorm/repositories/space-typeorm-read.repository.spec.ts` | Modified | Added `findByMember()` describe block with 2 test cases |
| `src/contexts/spaces/application/queries/spaces-find-by-user/spaces-find-by-user.handler.ts` | Modified | Replaced Criteria-based findByCriteria with findByMember call |
| `src/contexts/spaces/application/queries/spaces-find-by-user/spaces-find-by-user.handler.spec.ts` | Modified | Rewrote tests to use findByMember mock; assert findByCriteria NOT called |
| `src/core/filters/base-exception.filter.ts` | Modified | Added space exception → HTTP status mappings |

---

## TDD Cycle Evidence

| Task | RED (test written) | GREEN (impl passes) | REFACTOR |
|------|--------------------|---------------------|----------|
| T1 | n/a (verified via T5/T6 tests) | Handler tests assert NotSpaceOwnerException | n/a |
| T5 | Tests updated first to expect NotSpaceOwnerException | Handler logic split into two conditions | - |
| T6 | Tests updated first; added non-member case | Handler logic split identically | - |
| T7 | findByMember spec block added | TypeORM impl with QueryBuilder inner join | - |
| T8 | Spec rewritten to assert findByMember called, findByCriteria NOT called | Handler simplified to single findByMember call | Removed Criteria/FilterOperator imports |

---

## Test Results

```
Test Suites: 5 passed, 5 total
Tests:       25 passed, 25 total (18 domain + 7 filter)
```

---

## Deviations from Design

1. **BaseExceptionFilter updated** — the design/tasks did not explicitly mention updating the filter, but the spec (§8) requires specific HTTP codes for space exceptions. Without this change, all space exceptions return 400. This is a necessary companion to T1 to make `NotSpaceOwnerException` return 403 as required.

2. **T7 renamed** — tasks listed T4 for findByMember and T5 for handler fix, but the actual task numbering in tasks.md is T7 for repo + T8 for handler. Implementation follows tasks.md numbering.

---

## Workload / PR Boundary

- Mode: chained PR slice (PR1 of 2)
- Current work unit: Application Layer Fixes
- Boundary: T1 + T5 + T6 + T7 + T8 (plus filter update)
- Estimated review budget impact: ~180 impl lines + ~120 test lines = ~300 lines
