# Verify Report — cultivos / PlantingSpots (Phase 1)

**Change**: cultivos
**Branch**: feat/planting-spots-tests
**Date**: 2026-06-02
**Verdict**: PASS WITH WARNINGS

---

## Test Results

| Suite | Files | Tests | Result |
|-------|-------|-------|--------|
| Unit (planting-spots) | 17 | 63 | ALL PASS |
| Full unit suite | 121 | 618 | ALL PASS |
| Integration | 2 files | requires DB | Not run (no DB in CI for verify) |
| E2E | 1 file | requires DB | Not run (no DB in CI for verify) |
| Static (SC-16) | 1 file | 1 | PASSES (part of unit suite) |

---

## Task Completeness

All 68 tasks marked complete in apply-progress. Code exists for every task.

| Phase | Tasks | Status |
|-------|-------|--------|
| 1 Domain | 22/22 | COMPLETE |
| 2 Application | 14/14 | COMPLETE |
| 3 Infrastructure | 6/6 | COMPLETE |
| 4 Transport | 11/11 | COMPLETE |
| 5 Module Wiring | 3/3 | COMPLETE |
| 6 Tests | 12/12 | COMPLETE |

---

## Critical Risk Checks

| Check | Status |
|-------|--------|
| Both repos use `createTenantRepository` (QR pattern) | PASS |
| `IPlantingSpotInUsePort` wired in `AssertPlantingSpotNotInUseService` | PASS |
| `PlantingSpotInUseStubAdapter` registered in module bound to `PLANTING_SPOT_IN_USE_PORT` | PASS |
| `PlantingSpotsModule` imported in `app.module.ts` | PASS |
| Exception filter updated (409 `PlantingSpotInUseException`, 404 `PlantingSpotNotFoundException`, 403 `PlantingSpotForbiddenException`) | PASS |

---

## Spec Compliance Matrix

| Req | Description | Status |
|-----|-------------|--------|
| 1.1 | Aggregate fields (id, name, type, description, userId, spaceId, createdAt, updatedAt) | PASS |
| 1.2 | PlantingSpotTypeEnum — 5 valid values | PASS |
| 1.3 | PlantingSpotTypeValueObject extends EnumValueObject | PASS |
| 1.4 | Domain events Created/Updated/Deleted emitted | PASS |
| 2.1 | IPlantingSpotWriteRepository (save, findById) | PASS |
| 2.2 | IPlantingSpotReadRepository (findById, findByCriteria) | PASS |
| 2.3 | ICountPlantsInSpotPort (stub returns 0, wired in assert service) | PASS |
| 3.1 | CreatePlantingSpot rules | PASS — SC-01/SC-02 unit tested |
| 3.2 | UpdatePlantingSpot rules (owner check, 404/403) | PASS — SC-04/SC-05/SC-06 unit tested |
| 3.3 | DeletePlantingSpot rules (owner, guard, 409) | PASS — SC-07/SC-08/SC-09 unit tested |
| 4.1 | FindById (space scoped, 404) | PASS — SC-10/SC-11 unit tested |
| 4.2 | FindByCriteria (scoped, type filter, pagination) | PASS — SC-12/SC-13/SC-14 unit tested |
| 5 | Tenant isolation via createTenantRepository | PASS |
| 6 | REST 5 routes, JwtAuthGuard | PASS |
| 6 | GraphQL 5 operations, guards | WARNING (see W-01) |
| 7 | Migration 1780000000010-CreatePlantingSpots | PASS |
| 8 | PlantingSpotsModule in app.module.ts | PASS |
| 9 | No plants import (SC-16) | PASS — static unit test passes |
| 10 | Error catalogue (404/403/409 in filter) | PASS |
| SC-08 | 409 E2E coverage | WARNING (see W-02) |
| SC-15 | Tenant isolation integration test | NOT RUN — requires DB |

---

## Design Coherence

| Decision | Implemented | Notes |
|----------|-------------|-------|
| `createTenantRepository` in both repo constructors | YES | |
| `PlantingSpotTypeValueObject extends EnumValueObject` | YES | |
| Delete guard port + stub wired in Phase 1 | YES | |
| Port shape `countByPlantingSpotId(id): Promise<number>` | YES | |
| No `plants` import (coupling direction plants→planting-spots) | YES | |
| Migration `1780000000010`, `space_id` indexed | YES | |
| Repos do NOT extend `BaseDatabaseRepository` | YES — documented deviation | plain `@Injectable()` classes, correct QR pattern |
| `findByCriteria` returns `PaginatedResult` (bug fixed in PR4) | YES | spec was underspecified; fix is correct |

---

## Issues

### WARNING

**W-01 — GraphQL resolvers missing explicit `@UseGuards(JwtAuthGuard)`**

`planting-spot-mutations.resolver.ts` and `planting-spot-queries.resolver.ts` do not declare `@UseGuards(JwtAuthGuard)`, deviating from the project pattern (plant-species and plants resolvers both declare it explicitly). JWT auth IS enforced globally via `OptionalJwtAuthGuard` registered as `APP_GUARD`, so this is functionally correct and safe. However, it violates the per-resolver convention and the spec text "All resolvers MUST be protected by JwtAuthGuard + SpaceGuard."

Action: Add `@UseGuards(JwtAuthGuard)` to both resolver classes before archive, or document the global-guard approach as the project standard.

**W-02 — SC-08 (409 Conflict) not covered in E2E**

`PlantingSpotInUseStubAdapter` always returns 0, making the 409 path unreachable in E2E tests. The path IS covered by the `delete-planting-spot.handler.spec.ts` unit test (count=1 → throws PlantingSpotInUseException). This is an accepted Phase 1 trade-off. A `// TODO Phase 2: test 409 when real adapter is wired` comment should be added to the E2E spec.

**W-03 — Integration and E2E tests not executed**

SC-15 (write/read tenant isolation), SC-11 (cross-space findById 404), SC-12 (cross-space findByCriteria filtering), and the full REST CRUD flow require a running PostgreSQL instance. These tests exist and are structurally sound, but were not executed during verify. CI must pass these before merging to main.

### SUGGESTION

**S-01 — Spec underspecifies `findByCriteria` return type**

The spec states `findByCriteria` returns `PlantingSpotViewModel[]`. The implementation correctly returns `PlantingSpotCriteriaResult` (`{ items, total }`) and wraps in `PaginatedResult` in the handler. The implementation is correct; the spec should be updated to reflect this.

**S-02 — `AssertPlantingSpotExistsService` does not implement `IBaseService`**

Multi-arg signature `(id, spaceId)` is incompatible with the generic `IBaseService` contract. Not a runtime issue but worth documenting explicitly or resolving in a follow-up.

---

## Verdict

**PASS WITH WARNINGS**

- CRITICAL: 0
- WARNING: 3
- SUGGESTION: 2

All 68 tasks are complete. 618/618 unit tests pass (121 suites). All critical wiring points verified in source. Integration/E2E require a live DB — CI must validate SC-11, SC-12, SC-15 before merge.

Next recommended phase: **sdd-archive** (after W-01 is resolved or explicitly accepted).
