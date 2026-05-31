# Apply Progress: plant-qr-view-model

**Change**: plant-qr-view-model
**Mode**: Standard (strict_tdd: false)
**Batch**: 1 of 1 (all tasks complete)

## Completed Tasks

- [x] 1.1 Create `plant-qr.port.ts` — `PLANT_QR_PORT`, `PlantQrData`, `IPlantQrPort`
- [x] 1.2 Add `qrImage: string | null` to `PlantViewModel`
- [x] 1.3 Add `_qrImage`, `withQrImage()`, and `qrImage` in `buildViewModel()` to `PlantBuilder`
- [x] 2.1 Write unit spec for `EnrichPlantWithQrService` (3 scenarios, all green)
- [x] 2.2 Refactor `EnrichPlantWithQrService` — drop `QueryBus`+`qr/` imports, inject `IPlantQrPort`
- [x] 2.3 Create `PlantQrAdapter` — dispatches both QR queries, converts Buffer to base64, returns null on failure
- [x] 2.4 Wire `{ provide: PLANT_QR_PORT, useClass: PlantQrAdapter }` in `plants.module.ts`
- [x] 3.1 Add `qrImage?: string | null` to `PlantRestResponseDto`
- [x] 3.2 Map `vm.qrImage` in `PlantRestMapper.toResponse()`
- [x] 3.3 Add `@Field(() => String, { nullable: true }) qrImage: string | null` to `PlantResponseDto` (GraphQL)
- [x] 3.4 Map `vm.qrImage` in `PlantGraphQLMapper.toResponseDtoFromViewModel()`
- [x] 4.1+4.2 Write and verify `plant-qr.adapter.spec.ts` — 4 tests, all green
- [x] 4.3 Add `qrImage` mapping cases to REST mapper spec
- [x] 4.4 Add `qrImage` mapping cases to GraphQL mapper spec
- [x] 4.5 All 3 enrich service spec scenarios pass green
- [x] 5.1 Confirmed `plants/application/services/` has zero `@contexts/qr` imports
- [x] 5.2 Confirmed `QrModule` imported in `app.module.ts` — QueryBus dispatch resolves at runtime

## Files Changed

| File | Action | What Was Done |
|------|--------|---------------|
| `src/contexts/plants/application/ports/plant-qr.port.ts` | Created | Port interface, data type, DI token |
| `src/contexts/plants/infrastructure/adapters/plant-qr.adapter.ts` | Created | Adapter implementing IPlantQrPort via QueryBus |
| `src/contexts/plants/infrastructure/adapters/plant-qr.adapter.spec.ts` | Created | 4 unit tests for adapter |
| `src/contexts/plants/application/services/read/enrich-plant-with-qr/enrich-plant-with-qr.service.ts` | Modified | Replaced QueryBus+qr/ with IPlantQrPort injection |
| `src/contexts/plants/application/services/read/enrich-plant-with-qr/enrich-plant-with-qr.service.spec.ts` | Created | 3 unit tests for enrichment service |
| `src/contexts/plants/domain/view-models/plant.view-model.ts` | Modified | Added `qrImage: string \| null` field |
| `src/contexts/plants/domain/builders/plant.builder.ts` | Modified | Added `_qrImage`, `withQrImage()`, passed to buildViewModel |
| `src/contexts/plants/plants.module.ts` | Modified | Added PLANT_QR_PORT → PlantQrAdapter binding |
| `src/contexts/plants/transport/rest/dtos/plant-rest-response.dto.ts` | Modified | Added `qrImage` optional field |
| `src/contexts/plants/transport/rest/mappers/plant/plant.mapper.ts` | Modified | Map `vm.qrImage` to DTO |
| `src/contexts/plants/transport/rest/mappers/plant/plant.mapper.spec.ts` | Modified | Added qrImage mapping cases |
| `src/contexts/plants/transport/graphql/dtos/responses/plant/plant.response.dto.ts` | Modified | Added nullable `qrImage` @Field |
| `src/contexts/plants/transport/graphql/mappers/plant/plant.mapper.ts` | Modified | Map `vm.qrImage` to DTO |
| `src/contexts/plants/transport/graphql/mappers/plant/plant.mapper.spec.ts` | Modified | Added qrImage mapping cases |

## Test Results

- `enrich-plant-with-qr.service.spec.ts`: 3/3 green
- `plant-qr.adapter.spec.ts`: 4/4 green
- `plant.mapper.spec.ts` (REST): 4/4 green
- `plant.mapper.spec.ts` (GraphQL): 5/5 green
- Total: 17/17 green

## Deviations from Design

None — implementation matches design exactly.

## Workload / PR Boundary

- Mode: single PR
- Current work unit: Unit 1 (Full change)
- Boundary: all 14 files changed in one atomic batch
- Estimated review budget impact: ~300 lines changed (within Medium budget)

## Status

15/15 tasks complete. Ready for sdd-verify.
