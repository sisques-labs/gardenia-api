# Tasks: Planting Spot QR Code

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~830 |
| 400-line budget risk | High (single-branch delivery constraint) |
| Chained PRs recommended | Yes in principle; not feasible here — the harness's designated feature branch is a single branch per repo, so chaining into separate stacked branches wasn't an option. Shipped as one PR with the overage flagged in the description. |
| Suggested split | Domain+migration · Application · Infrastructure adapter · Transport |
| Delivery strategy | single-PR (documented exception) |

---

## Phase 1: Migration

- [x] T1 — Create `src/database/migrations/1780000000023-LinkPlantingSpotsToQrs.ts`:
  `up`: `ALTER TABLE "planting_spots" ADD COLUMN "qr_id" uuid`, `UNIQUE` constraint, FK → `qrs(id) ON DELETE SET NULL`, `delete_qr_when_planting_spot_deleted()` trigger function, `TRG_planting_spots_delete_linked_qr` `BEFORE DELETE` trigger (mirrors `1780000000007-LinkPlantsToQrs.ts`). `down`: drops trigger, function, FK, unique constraint, column.

## Phase 2: Domain

- [x] T2 — Create `domain/primitives/planting-spot-qr.primitives.ts`, `domain/view-models/planting-spot-qr.view-model.ts`, `domain/builders/planting-spot-qr.builder.ts` (+ `.spec.ts`) — initially mirrored `plant-qr.{primitives,view-model,builder}.ts` exactly (no `PlantingSpotQrAggregate`, builder not extending `BaseBuilder`). Per PR review (gardenia-api#325), reworked to add a real `PlantingSpotQrAggregate` (+ `.spec.ts`) and `IPlantingSpotQr` interface, so `PlantingSpotQrBuilder` now `extends BaseBuilder<PlantingSpotQrAggregate, PlantingSpotQrViewModel>` and implements both `build()`/`buildViewModel()`, using real value objects (`UuidValueObject`, `UrlValueObject`, `NumberValueObject`, `StringValueObject`) instead of raw primitives. This intentionally diverges from `PlantQrBuilder` in `plants` (left as-is, out of scope for this change) — see `proposal.md` for why.
- [x] T3 — Add `qrId: string | null` to `IPlantingSpotPrimitives`; add `qrId`/`qr` to `PlantingSpotViewModel`.
- [x] T4 — Add `qrId: UuidValueObject | null` to `IPlantingSpot`; add `_qrId` field + `linkQr()` method + getter + `toPrimitives()` entry to `PlantingSpotAggregate`.
- [x] T5 — Add `withQrId`/`withQr` to `PlantingSpotBuilder`, wired into `build()`/`buildViewModel()`.
- [x] T6 — Add `qr_id` column to `PlantingSpotTypeOrmEntity`; map it in `PlantingSpotTypeOrmMapper` (`toDomain`, `toPersistence`, `toViewModel`).
- [x] T7 — Update every spec that constructs `PlantingSpotAggregate`/`PlantingSpotViewModel` directly to include `qrId: null` (aggregate spec, builder spec, assert-exists spec, mark-fallow/mark-active/update/delete handler specs, find-by-id/find-by-criteria handler specs, REST/GraphQL mapper specs, controller spec, resolver spec, `plants` context's `planting-spot.adapter.spec.ts`).

## Phase 3: Application

- [x] T8 — Create `application/ports/create-planting-spot-qr.input.ts`, `application/ports/planting-spot-qr.port.ts` (`IPlantingSpotQrPort` + `PLANTING_SPOT_QR_PORT` token) — mirror `plant-qr.port.ts`.
- [x] T9 — Create `application/services/read/planting-spot-qr-target-url-builder/planting-spot-qr-target-url-builder.service.ts` (+ spec) building `{QR_BASE_URL}/planting-spots/{id}?spaceId={spaceId}`.
- [x] T10 — Update `create-planting-spot.command.ts` — exclude `qrId` from `CreatePlantingSpotCommandInput`'s `Omit<IPlantingSpotPrimitives, ...>`.
- [x] T11 — Update `CreatePlantingSpotCommandHandler` — inject `IPlantingSpotQrPort` + `PlantingSpotQrTargetUrlBuilderService`, build target URL, create QR, `.withQrId(qrId)` on the builder chain before `build()`.
- [x] T12 — Update `create-planting-spot.handler.spec.ts` with QR port/target-url-builder mocks and a new assertion covering QR creation + `qrId` persistence.
- [x] T13 — Deliberately NOT added: a `SetPlantingSpotQrIdCommand` mirroring `SetPlantQrIdCommand` — that command is unused dead code even in `plants` (registered but never dispatched), so it wasn't replicated (see proposal's Out of Scope).
- [x] T14 — Deliberately NOT added: an `EnrichPlantingSpotWithQrService` mirroring `EnrichPlantWithQrService` — that service is unused in `plants` too (the actual read path is the GraphQL resolved field, not this service); not replicated to avoid shipping unused code.

## Phase 4: Infrastructure adapter

- [x] T15 — Create `infrastructure/adapters/planting-spot-qr.adapter.ts` (+ spec) implementing `IPlantingSpotQrPort` via `CommandBus`/`QueryBus` against the `qr` context's `CreateQrCommand`/`DeleteQrCommand`/`QrFindByIdQuery`/`QrFindPngByIdQuery` — mirror `plant-qr.adapter.ts`.

## Phase 5: Transport

- [x] T16 — Add `PlantingSpotQrResponseDto` + `qrId`/`qr` fields to `PlantingSpotResponseDto` (GraphQL).
- [x] T17 — Add `toQrResponseDto` to `PlantingSpotGraphQLMapper`; map `qrId`/`qr` in `toResponseDtoFromViewModel`.
- [x] T18 — Create `PlantingSpotQrResolvedFieldResolver` (+ spec) — `@ResolveField('qr', ...)` on `PlantingSpotResponseDto`, mirrors `PlantQrResolvedFieldResolver`.
- [x] T19 — Add `qrId` to `PlantingSpotRestResponseDto` and map it in `PlantingSpotRestMapper` (metadata only, matching the plant REST DTO's "resolve via GraphQL qr field" documented pattern).
- [x] T20 — Register `PlantingSpotQrBuilder`, `PlantingSpotQrTargetUrlBuilderService`, `PLANTING_SPOT_QR_PORT` → `PlantingSpotQrAdapter`, and `PlantingSpotQrResolvedFieldResolver` in `planting-spots.module.ts`'s provider arrays.

## Phase 6: Docs & verification

- [x] T21 — Update `src/contexts/planting-spots/README.md` (per `openspec/config.yaml` apply rule: reflect current state, not just the delta) to document the new `qr` field and its internal-orchestration/no-MCP-surface caveats.
- [x] T22 — Ran `pnpm test` (408/408 suites, 1728/1728 tests), `pnpm lint` (clean on touched files), `pnpm tsc --noEmit` (clean). Integration/E2E (`pnpm test:integration` / `pnpm test:e2e`) were **not** run — no Docker/Postgres available in this sandbox; run both against a real Postgres before merging.
- [x] T23 — PR opened against `develop` (gardenia-api#325); diff (~830 lines) exceeds the 400-line budget — flagged in the PR description since chaining wasn't feasible under the single designated feature branch.

---

## Post-MVP (not in this change)

- [ ] Backfill script for existing planting spots without QR
- [ ] Integration + E2E tests for the migration/trigger and the resolved-field/REST flows (requires Postgres)
