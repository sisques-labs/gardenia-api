# Proposal: Plant QR View Model — Port Decoupling + QR Image

## Intent

`EnrichPlantWithQrService` (plants `application/`) imports directly from `@contexts/qr/`, a cross-context coupling violation in the application layer. It also exposes only QR metadata (`qrId`, `targetUrl`), not the PNG. Clients (mobile/web) need the rendered QR image inline to display it without a second round trip. We fix both: invert the dependency behind a port owned by `plants/`, and enrich the view model with the base64 PNG.

## Scope

### In Scope
- Define `IPlantQrPort` + `PlantQrData` type in `plants/application/ports/` (no `qr/` imports).
- Refactor `EnrichPlantWithQrService` to depend on the port, not `QueryBus` + `qr/` queries.
- Implement `PlantQrAdapter` in `plants/infrastructure/` calling both QR metadata and PNG queries.
- Add `qrImage: string | null` (base64 PNG) to `PlantViewModel` + `PlantBuilder`.
- Expose `qrImage` in REST and GraphQL response DTOs + mappers.
- Write the missing unit spec for `EnrichPlantWithQrService`.

### Out of Scope
- Changing `IPlantPrimitives` or the TypeORM entity — `qrImage` is enrichment-only, not persisted.
- Solving the N+1 / 2N query pattern in `FindPlantsByCriteria` (explicitly accepted).
- QR caching, payload compression, or image-size limits.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `plants`: Plant read responses MUST also include `qrImage` (base64 PNG, null when no QR). QR enrichment MUST flow through a plants-owned port, not a direct `qr/` dependency.

## Approach

Hexagonal dependency inversion (exploration Opción A). `plants/application/` declares `IPlantQrPort` (`findByQrId(qrId): Promise<PlantQrData | null>`) with a `PlantQrData` type local to plants. `EnrichPlantWithQrService` injects the port via DI symbol. `PlantQrAdapter` in `plants/infrastructure/` is the only file that knows about `qr/` — it dispatches `QrFindByIdQuery` (metadata) + `QrFindPngByIdQuery` (Buffer), converts the Buffer with `.toString('base64')`, and returns `PlantQrData`. `plants.module.ts` binds the symbol to the adapter and imports `CqrsModule`. `PlantBuilder.withQrImage()` feeds the new field; transport mappers surface it.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `plants/application/ports/plant-qr.port.ts` | New | `IPlantQrPort`, `PlantQrData`, DI symbol |
| `plants/infrastructure/adapters/plant-qr.adapter.ts` | New | Implements port; only file importing `qr/` |
| `.../enrich-plant-with-qr.service.spec.ts` | New | Unit spec (currently missing) |
| `.../enrich-plant-with-qr.service.ts` | Modified | Inject port, drop `qr/` imports, add image |
| `plants/domain/view-models/plant.view-model.ts` | Modified | Add `qrImage: string \| null` |
| `plants/domain/builders/plant.builder.ts` | Modified | Add `withQrImage()` |
| `plants/plants.module.ts` | Modified | Bind port→adapter, import CqrsModule |
| REST + GraphQL response DTOs & mappers | Modified | Expose `qrImage` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| 2N queries in FindByCriteria (metadata + PNG per plant) | High | Accepted now; future single-JOIN optimization noted |
| Base64 PNG inflates GraphQL/REST list payloads | Med | Field nullable; clients select it explicitly in GraphQL |
| Adapter's cross-module QueryBus needs QR handlers in shared scope | Med | Verify QrModule handlers registered in shared CqrsModule scope |

## Rollback Plan

Revert is isolated: drop the new port/adapter/spec files, restore the previous `EnrichPlantWithQrService` (direct `qr/` import), remove `qrImage` from view model, builder, and DTOs. No DB migration involved — entity and primitives untouched — so rollback is code-only with no data impact.

## Dependencies

- `QrFindByIdQuery` and `QrFindPngByIdQuery` must be reachable via the shared CqrsModule QueryBus from `plants/`.

## Success Criteria

- [ ] No file under `plants/application/` imports from `@contexts/qr/`.
- [ ] `PlantViewModel.qrImage` returns base64 PNG when QR exists, `null` otherwise.
- [ ] REST and GraphQL plant read responses expose `qrImage`.
- [ ] `EnrichPlantWithQrService` has a passing unit spec.
