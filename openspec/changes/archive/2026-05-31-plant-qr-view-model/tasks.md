# Tasks: Plant QR View Model — Port Decoupling + QR Image

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 280–360 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Full change — port, adapter, view model, enrichment, mappers, tests | PR 1 | Atomic; all changes are data-flow in one context |

---

## Phase 1: Foundation — Port + Types

- [x] 1.1 Create `src/contexts/plants/application/ports/plant-qr.port.ts` with `PLANT_QR_PORT` symbol, `PlantQrData` type (`qrId`, `targetUrl`, `imageBase64`), and `IPlantQrPort` interface (`findByQrId(qrId: string): Promise<PlantQrData | null>`). Satisfies: *IPlantQrPort Contract*.
- [x] 1.2 Modify `src/contexts/plants/domain/view-models/plant.view-model.ts` — add `qrImage: string | null` field. Satisfies: *Plant QR Link Fields*.
- [x] 1.3 Modify `src/contexts/plants/domain/builders/plant.builder.ts` — add `_qrImage: string | null`, `withQrImage(v: string | null): this`, pass `qrImage` in `buildViewModel()`. Satisfies: *Plant QR Link Fields*.

## Phase 2: Core Implementation — Adapter + Service Refactor

- [x] 2.1 **RED** Write failing unit spec `src/contexts/plants/application/services/read/enrich-plant-with-qr/enrich-plant-with-qr.service.spec.ts` covering: enrichment when port returns `PlantQrData`, `qrImage: null` when port returns `null`, no real QR infrastructure invoked. Uses `jest.Mocked<IPlantQrPort>`. Satisfies: *EnrichPlantWithQrService Unit Spec*.
- [x] 2.2 **GREEN** Modify `src/contexts/plants/application/services/read/enrich-plant-with-qr/enrich-plant-with-qr.service.ts` — replace `QueryBus` + `qr/` imports with `@Inject(PLANT_QR_PORT) port: IPlantQrPort`; call `port.findByQrId(plant.qrId)`; set `withQrImage(data.imageBase64)`. Satisfies: *EnrichPlantWithQrService Unit Spec*, *Plant QR Link Fields*.
- [x] 2.3 Create `src/contexts/plants/infrastructure/adapters/plant-qr.adapter.ts` — implements `IPlantQrPort`; dispatches `QrFindByIdQuery` for metadata and `QrFindPngByIdQuery` for Buffer; converts `Buffer.toString('base64')` for `imageBase64`; returns `null` when either query yields no result. Satisfies: *IPlantQrPort Contract*, *Plant QR Link Fields*.
- [x] 2.4 Modify `src/contexts/plants/plants.module.ts` — add `{ provide: PLANT_QR_PORT, useClass: PlantQrAdapter }` to providers. Satisfies: DI wiring from design.

## Phase 3: Integration — Transport Layer

- [x] 3.1 Modify `src/contexts/plants/transport/rest/dtos/plant-rest-response.dto.ts` — add `qrImage: string | null` field. Satisfies: *REST Transport*.
- [x] 3.2 Modify `src/contexts/plants/transport/rest/mappers/plant/plant.mapper.ts` — map `viewModel.qrImage` to DTO. Satisfies: *REST Transport*.
- [x] 3.3 Modify `src/contexts/plants/transport/graphql/dtos/responses/plant/plant.response.dto.ts` — add `@Field(() => String, { nullable: true }) qrImage: string | null`. Satisfies: *GraphQL Transport*.
- [x] 3.4 Modify `src/contexts/plants/transport/graphql/mappers/plant/plant.mapper.ts` — map `viewModel.qrImage`. Satisfies: *GraphQL Transport*.

## Phase 4: Testing — Adapter + Mapper Specs

- [x] 4.1 **RED** Add unit spec for `PlantQrAdapter` (co-located or in `adapters/`) — mock `QueryBus`; assert both queries dispatched; assert Buffer converted to base64; assert `null` returned when first query resolves null. Satisfies: Testing Strategy (design).
- [x] 4.2 **GREEN** Verify `PlantQrAdapter` passes spec from 4.1 (no extra code needed if 2.3 is correct; adjust if needed).
- [x] 4.3 Update `src/contexts/plants/transport/rest/mappers/plant/plant.mapper.spec.ts` — add case asserting `qrImage` mapped and null-safe. Satisfies: *REST Transport*.
- [x] 4.4 Update `src/contexts/plants/transport/graphql/mappers/plant/plant.mapper.spec.ts` — add case asserting `qrImage` mapped and null-safe. Satisfies: *GraphQL Transport*.
- [x] 4.5 Verify all three spec scenarios in `enrich-plant-with-qr.service.spec.ts` pass green: QR found, QR absent, isolation. Satisfies: *EnrichPlantWithQrService Unit Spec*.

## Phase 5: Cleanup

- [x] 5.1 Confirm no `plants/application/` file imports from `@contexts/qr/` (grep for `@contexts/qr` under `plants/application/`). Satisfies: *IPlantQrPort Contract* isolation rule.
- [x] 5.2 Confirm `QrModule` is loaded in the app graph (open question from design); add a comment in `plants.module.ts` if a runtime guard is needed.
