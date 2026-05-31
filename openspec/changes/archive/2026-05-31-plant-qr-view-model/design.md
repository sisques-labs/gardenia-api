# Design: Plant QR View Model — Port Decoupling + QR Image

## Technical Approach

Invert the `plants/application → qr/` dependency with a plants-owned port (Opción A
from the proposal). `EnrichPlantWithQrService` stops injecting `QueryBus` + `qr/`
queries and instead depends on `IPlantQrPort`. The only file in `plants/` that knows
`qr/` exists is `PlantQrAdapter` in `plants/infrastructure/`. The adapter dispatches
two existing QR queries (`QrFindByIdQuery` for metadata, `QrFindPngByIdQuery` for the
Buffer), converts the PNG with `Buffer.toString('base64')`, builds a `PlantQrViewModel`
via `PlantQrBuilder`, and returns it. The view model gains `qr: PlantQrViewModel | null`,
surfaced as a nested object in both REST and GraphQL responses. Applies to both read
paths (find-by-id and find-by-criteria, the latter enriching per item in its existing
`Promise.all` loop).

## Architecture Decisions

### Decision: PlantQrViewModel in domain, not a PlantQrData DTO in application

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `PlantQrViewModel` in `plants/domain/view-models/` | Domain is self-contained; `PlantViewModel` can import it without layer violation | CHOSEN |
| `PlantQrData` interface in `plants/application/ports/` | Would force `PlantViewModel` (domain) to import from application — layer violation | Rejected |

**Rationale**: `PlantViewModel` lives in domain and cannot import from application.
The QR data shape belongs in domain as a proper view model. `IPlantQrPort` in application
imports `PlantQrViewModel` from domain (valid direction). `PlantQrData` was eliminated.

### Decision: Port in `plants/application/ports`, not a shared kernel

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Port owned by `plants/application` | Plants owns the contract it needs; no new cross-cutting module | CHOSEN |
| Shared kernel module | Adds a third owner; couples both contexts to shared abstraction | Rejected — premature; only plants consumes it |

**Rationale**: In hexagonal architecture the driven port belongs to the consumer
that defines the need. A shared kernel would invert ownership and create coupling
we do not need with a single consumer.

### Decision: Adapter issues 2N queries (metadata + PNG separately)

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Two queries via existing `QrFindByIdQuery` + `QrFindPngByIdQuery` | Reuses shipped handlers; zero new `qr/` surface | CHOSEN |
| New composite `QrFindWithPngByIdQuery` in `qr/` | One round trip but new public query + handler in `qr/` | Rejected now |

**Rationale**: Both QR handlers already exist and `IQrReadRepository` already splits
`findById` / `findPngById`. Reusing them keeps this change additive and avoids
touching `qr/`. 2N queries in find-by-criteria is explicitly accepted. The future
optimization is a single composite read at the `qr/` repository level — the adapter
swaps its two calls for one without any change to `plants/application`, since the port
contract is coarse-grained (`findByQrId → PlantQrViewModel`).

### Decision: Inline base64 PNG, not signed URL or streaming

| Option | Tradeoff | Decision |
|--------|----------|----------|
| base64 PNG inline in view model | One round trip for clients; no extra infra | CHOSEN |
| Signed URL to a PNG endpoint | Smaller payload but needs object storage + signing + a second fetch | Rejected |
| Streaming/binary endpoint | Efficient for single image, breaks JSON/GraphQL read shape | Rejected |

**Rationale**: The driving need is rendering the QR without a second round trip.
base64 fits the existing JSON/GraphQL read model with no new infrastructure. The
field is nullable and (in GraphQL) explicitly selected, so list payload inflation is
opt-in.

## Data Flow

    PlantFindByIdQueryHandler ─┐
    PlantFindByCriteriaHandler ┘─→ EnrichPlantWithQrService.execute(plant)
                                        │ injects IPlantQrPort (DI: PLANT_QR_PORT)
                                        ▼
                                  PlantQrAdapter.findByQrId(qrId)
                                        │ (plants/infrastructure — only qr/ importer)
                          ┌─────────────┴──────────────┐
                          ▼                             ▼
              QueryBus → QrFindByIdQuery     QueryBus → QrFindPngByIdQuery
                  (QrViewModel: metadata)        (Buffer)
                          └─────────────┬──────────────┘
                                        ▼
                         PlantQrBuilder.buildViewModel()
                                        ▼
                         PlantQrViewModel { id, spaceId, targetUrl, generation, image, ... }
                                        ▼
                         PlantBuilder.withQr(plantQrViewModel) → PlantViewModel.qr
                                        ▼
                         REST mapper / GraphQL mapper → qr object in response

## Cross-Module QueryBus

The adapter dispatches `qr/` queries through the framework `QueryBus`. This works
because `@nestjs/cqrs` `CqrsModule` registers a single application-wide bus: handlers
declared with `@QueryHandler` in `QrModule` are discovered into the global registry,
so any module importing `CqrsModule` (which `PlantsModule` already does) can dispatch
them by query class. No direct `QrModule` import is required.

## DI Wiring

- Token `PLANT_QR_PORT = Symbol('PLANT_QR_PORT')` in `plant-qr.port.ts`.
- `plants.module.ts` adds `{ provide: PLANT_QR_PORT, useClass: PlantQrAdapter }`
  and `PlantQrBuilder` to providers.
- `PlantQrAdapter` constructor: `QueryBus` + `PlantQrBuilder`.
- `EnrichPlantWithQrService` constructor: `PlantBuilder` + `@Inject(PLANT_QR_PORT) IPlantQrPort`.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `plants/domain/view-models/plant-qr.view-model.ts` | Create | `PlantQrViewModel` class with all QR fields |
| `plants/domain/builders/plant-qr.builder.ts` | Create | `PlantQrBuilder` — fluent builder for `PlantQrViewModel` |
| `plants/application/ports/plant-qr.port.ts` | Create | `IPlantQrPort`, `PLANT_QR_PORT` token (no `PlantQrData`) |
| `plants/infrastructure/adapters/plant-qr.adapter.ts` | Create | Implements port; dispatches both QR queries; builds `PlantQrViewModel` via builder |
| `.../enrich-plant-with-qr/enrich-plant-with-qr.service.spec.ts` | Create | Unit spec with mocked port |
| `.../enrich-plant-with-qr/enrich-plant-with-qr.service.ts` | Modify | Inject port; call `withQr()`; drop `qr/` imports |
| `plants/domain/view-models/plant.view-model.ts` | Modify | Add `qr: PlantQrViewModel \| null` (replaces flat fields) |
| `plants/domain/builders/plant.builder.ts` | Modify | Add `_qr` + `withQr()`; pass to `buildViewModel` |
| `plants/plants.module.ts` | Modify | Bind `PLANT_QR_PORT → PlantQrAdapter`; add `PlantQrBuilder` |
| `plants/transport/rest/dtos/plant-rest-response.dto.ts` + REST mapper | Modify | Expose `qr: PlantQrRestResponseDto \| null` |
| `plants/transport/graphql/dtos/.../plant.response.dto.ts` + GraphQL mapper | Modify | Expose `qr: PlantQrResponseDto \| null` |

## Interfaces / Contracts

```ts
// plants/domain/view-models/plant-qr.view-model.ts
export class PlantQrViewModel {
  id: string; spaceId: string; targetUrl: string;
  generation: number; image: string; createdAt: Date; updatedAt: Date;
}

// plants/application/ports/plant-qr.port.ts
export const PLANT_QR_PORT = Symbol('PLANT_QR_PORT');
export interface IPlantQrPort {
  findByQrId(qrId: string): Promise<PlantQrViewModel | null>;
}
```

The port returns `null` when no QR resolves; `EnrichPlantWithQrService` returns the
plant unchanged when `plant.qrId` is absent or port returns `null`.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `EnrichPlantWithQrService` | Mock `IPlantQrPort`; assert `qr` populated when port returns data, plant unchanged when null |
| Unit | `PlantQrAdapter` | Mock `QueryBus` + real `PlantQrBuilder`; assert both queries dispatched, Buffer → base64 |
| Unit | REST + GraphQL mappers | Assert `qr` object mapped, null-safe |

## Migration / Rollout

No migration required. `qr` is enrichment-only — `IPlantPrimitives` and the
TypeORM entity are untouched. Rollback is code-only: remove port/adapter/view-model/builder/spec,
restore the prior direct-`qr/` service, drop `qr` from view model/builder/DTOs.

## Open Questions

- [x] Confirmed `QrModule` is loaded in the app graph — QR REST already dispatches these queries.
