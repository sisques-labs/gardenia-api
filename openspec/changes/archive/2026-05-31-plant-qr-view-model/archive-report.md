# Archive Report: plant-qr-view-model

**Change**: plant-qr-view-model  
**Archived Date**: 2026-05-31  
**Status**: Completed and Verified  
**Final Commit**: bf274ce

---

## Executive Summary

The `plant-qr-view-model` change introduces port-based decoupling of QR enrichment within the plants bounded context. `PlantViewModel` is enhanced with a nested `qr: PlantQrViewModel | null` (containing base64 PNG), replacing flat `qrId`/`targetUrl` fields. All 15 implementation tasks completed; verification: 544 tests passing with zero CRITICAL issues. Specs merged into canonical `openspec/specs/plants/spec.md`. Change closed and archived.

---

## Change Definition

**Goal**: Invert the `plants/application → qr/` dependency with a plants-owned port. Enrich the view model with the base64 PNG image for single-roundtrip client rendering.

**Approach**: Hexagonal dependency inversion. `EnrichPlantWithQrService` depends on `IPlantQrPort` (declared in `plants/application/ports/`). `PlantQrAdapter` in `plants/infrastructure/` is the only file importing `qr/` — it dispatches both QR queries (metadata + PNG), converts Buffer to base64, and returns `PlantQrViewModel`. `PlantBuilder.withQr()` feeds the nested object; transport mappers surface it.

**Scope**:
- ✅ Define `IPlantQrPort` + `PlantQrViewModel` in plants layer
- ✅ Refactor `EnrichPlantWithQrService` to use the port
- ✅ Implement `PlantQrAdapter` with cross-module QueryBus dispatch
- ✅ Add `qr: PlantQrViewModel | null` to `PlantViewModel` and `PlantBuilder`
- ✅ Expose `qr` object in REST and GraphQL response DTOs + mappers
- ✅ Write missing unit spec for `EnrichPlantWithQrService`

**Out of Scope** (accepted tradeoffs):
- Changing `IPlantPrimitives` or TypeORM entity (enrichment-only, not persisted)
- Solving N+1 / 2N query pattern in `FindPlantsByCriteria`
- QR caching, payload compression, image-size limits

---

## Implementation Summary

### Files Created

1. `src/contexts/plants/application/ports/plant-qr.port.ts`
   - `PLANT_QR_PORT` DI token
   - `IPlantQrPort` interface: `findByQrId(qrId: string): Promise<PlantQrViewModel | null>`
   - Returns `null` when no QR found

2. `src/contexts/plants/infrastructure/adapters/plant-qr.adapter.ts`
   - Implements `IPlantQrPort`
   - Dispatches `QrFindByIdQuery` (metadata) + `QrFindPngByIdQuery` (Buffer)
   - Converts Buffer to base64 via `.toString('base64')`
   - Builds `PlantQrViewModel` via `PlantQrBuilder`

3. `src/contexts/plants/infrastructure/adapters/plant-qr.adapter.spec.ts`
   - 4 unit tests covering metadata retrieval, PNG conversion, null handling, error isolation

4. `src/contexts/plants/application/services/read/enrich-plant-with-qr/enrich-plant-with-qr.service.spec.ts`
   - 3 scenario tests: enrichment when QR found, unchanged when QR absent, isolation from real QR infrastructure

### Files Modified

5. `src/contexts/plants/application/services/read/enrich-plant-with-qr/enrich-plant-with-qr.service.ts`
   - Removed direct `QueryBus` injection + `@contexts/qr/` imports
   - Added `@Inject(PLANT_QR_PORT) port: IPlantQrPort`
   - Changed to: `const qrData = await port.findByQrId(plant.qrId)`
   - Calls `builder.withQr(qrData)` when QR exists

6. `src/contexts/plants/domain/view-models/plant.view-model.ts`
   - Added: `qr: PlantQrViewModel | null` (nested object, replaces flat fields)

7. `src/contexts/plants/domain/builders/plant.builder.ts`
   - Added: `_qr: PlantQrViewModel | null` private field
   - Added: `withQr(qr: PlantQrViewModel | null): this` method
   - Updated: `buildViewModel()` passes `qr` to constructor

8. `src/contexts/plants/plants.module.ts`
   - Added provider: `{ provide: PLANT_QR_PORT, useClass: PlantQrAdapter }`
   - `CqrsModule` already imported (QueryBus available)

9. `src/contexts/plants/transport/rest/dtos/plant-rest-response.dto.ts`
   - Added: `qr: PlantQrRestResponseDto | null` field

10. `src/contexts/plants/transport/rest/mappers/plant/plant.mapper.ts`
    - Maps `vm.qr` to DTO (null-safe)

11. `src/contexts/plants/transport/rest/mappers/plant/plant.mapper.spec.ts`
    - Added test cases for `qr` object mapping and null-safety

12. `src/contexts/plants/transport/graphql/dtos/responses/plant/plant.response.dto.ts`
    - Added: `@Field(() => String, { nullable: true }) qr: PlantQrResponseDto | null`

13. `src/contexts/plants/transport/graphql/mappers/plant/plant.mapper.ts`
    - Maps `vm.qr` to DTO

14. `src/contexts/plants/transport/graphql/mappers/plant/plant.mapper.spec.ts`
    - Added test cases for `qr` object mapping and null-safety

---

## Verification Results

**Test Suite Status**: ✅ 544 tests passing  
**Critical Issues**: 0  
**Warnings**: 0  
**Overall**: **PASS WITH NO ISSUES**

| Layer | Test Count | Status |
|-------|-----------|--------|
| EnrichPlantWithQrService spec | 3 | ✅ |
| PlantQrAdapter spec | 4 | ✅ |
| REST mapper spec | 4 | ✅ |
| GraphQL mapper spec | 5 | ✅ |
| Full regression suite | 544 | ✅ |

---

## Specs Merged

**Delta Spec**: `openspec/changes/plant-qr-view-model/specs/plants/spec.md`

**Main Spec Updated**: `openspec/specs/plants/spec.md`

**Changes Merged**:
- ✅ ADDED: `IPlantQrPort Contract` requirement + 2 scenarios
- ✅ ADDED: `EnrichPlantWithQrService Unit Spec` requirement + 2 scenarios
- ✅ MODIFIED: `Plant QR Link Fields` — from flat `qrId`/`targetUrl` to nested `qr: PlantQrViewModel | null`
- ✅ MODIFIED: `REST Transport` — response includes `qr: PlantQrRestResponseDto | null`
- ✅ MODIFIED: `GraphQL Transport` — `PlantType` includes `qr: PlantQrResponseDto`
- ✅ Updated: `Out of Scope` — added N+1 tradeoff acknowledgment

**Lines Changed**: +152 requirements, requirement fields updated to reflect nested object shape and port contract

---

## Architecture Decisions Finalized

1. **PlantQrViewModel in domain, not application port** — domain is self-contained; `PlantViewModel` imports from domain, not application (layer rule preserved).

2. **Port owned by plants, not shared kernel** — single consumer; no coupling to a third module needed.

3. **2N queries accepted** — metadata + PNG via existing handlers; future composite query in `qr/` requires no port interface change.

4. **Inline base64 PNG, not signed URL** — single roundtrip for clients; no new infrastructure.

---

## Rollback Safety

**Code-only rollback** (no DB migration):
1. Drop `plant-qr.port.ts`, `plant-qr.adapter.ts`, adapter spec, service spec
2. Restore `EnrichPlantWithQrService` to previous direct `@contexts/qr/` imports
3. Remove `qr` field from `PlantViewModel`, `PlantBuilder`, REST/GraphQL DTOs and mappers
4. Remove `PLANT_QR_PORT` binding from `plants.module.ts`

No data model changes — `IPlantPrimitives` and TypeORM entity untouched.

---

## Dependency Verification

- ✅ `QrModule` loaded in app graph (`app.module.ts`)
- ✅ `QrFindByIdQuery` and `QrFindPngByIdQuery` handlers discoverable via shared CqrsModule
- ✅ No circular imports introduced
- ✅ No `plants/application/` file imports from `@contexts/qr/` (verified via grep)

---

## Source Artifacts

All SDD artifacts persisted to Engram with observation IDs:

| Artifact | Topic Key | Type |
|----------|-----------|------|
| Proposal | `sdd/plant-qr-view-model/proposal` | proposal |
| Spec | `sdd/plant-qr-view-model/spec` | spec |
| Design | `sdd/plant-qr-view-model/design` | design |
| Tasks | `sdd/plant-qr-view-model/tasks` | tasks |
| Apply Progress | `sdd/plant-qr-view-model/apply-progress` | apply-progress |
| Verify Report | `sdd/plant-qr-view-model/verify-report` | verify-report |

---

## SDD Cycle Complete

- ✅ Proposal: Defined intent, approach, tradeoffs
- ✅ Spec: Documented requirements with scenarios (delta merged to main)
- ✅ Design: Technical approach, architecture decisions, data flows, DI wiring
- ✅ Tasks: Hierarchical breakdown (5 phases, 15 tasks total)
- ✅ Apply: All 15 tasks completed, 17 tests green
- ✅ Verify: 544 tests passing, 0 CRITICAL, PASS with no issues
- ✅ Archive: Specs merged, folder archived, report finalized

---

## Next Steps

The plants bounded context now cleanly decouples QR enrichment via a dedicated port. The nested `qr` object in responses (REST + GraphQL) carries the base64 PNG for single-roundtrip rendering.

**Future Optimizations** (explicitly noted, not in scope):
- Composite `QrFindWithPngByIdQuery` in `qr/` to eliminate 2N queries
- Image compression or payload limiting for large list queries
- QR response caching layer

All change artifacts are fully archived and traceable. Ready for the next change.
