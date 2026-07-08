# Proposal: Planting Spot QR Code

## Intent

GDN-44: gardeners want a QR code on the planting spot detail page, the same
way plants already have one (GDN-40 / `plant-qr-generation`), so they can
print it and stick it on the pot or bed to jump straight back into that spot
from a phone camera.

This change extends the existing `qr` bounded context to a second consumer —
`planting-spots` — mirroring exactly the `plants` ↔ `qr` integration: a QR is
generated automatically at planting-spot creation time, linked via a nullable
`qr_id` FK, and exposed as a resolved GraphQL field (image + metadata) plus a
REST `qrId` (metadata only, per the existing plant pattern).

## Scope

### In Scope

- `planting_spots` table gains a nullable `qr_id` UUID FK → `qrs(id) ON DELETE
  SET NULL`, plus the same `BEFORE DELETE` trigger used for plants
  (`delete_qr_when_planting_spot_deleted`) so removing a spot cleans up its
  QR row.
- `PlantingSpotAggregate` / primitives / view-model / interface gain `qrId`
  (mirrors `plants`); builder gains `withQrId` / `withQr`.
- New `IPlantingSpotQrPort` (application/ports) + `PlantingSpotQrAdapter`
  (infrastructure/adapters) — identical shape to `IPlantQrPort` /
  `PlantQrAdapter`, dispatching `CreateQrCommand` / `DeleteQrCommand` /
  `QrFindByIdQuery` / `QrFindPngByIdQuery` on the `qr` context's
  Command/QueryBus.
- New `PlantingSpotQrTargetUrlBuilderService` building
  `{QR_BASE_URL}/planting-spots/{id}?spaceId={spaceId}`.
- `CreatePlantingSpotCommandHandler` builds the target URL, creates the QR,
  and persists `qrId` on the new spot — same synchronous orchestration as
  `CreatePlantCommandHandler` (see ADR-3 in
  `openspec/changes/archive/2026-05-31-plant-qr-generation/design.md`).
- GraphQL: new `qr` resolved field on `PlantingSpotResponseDto`
  (`PlantingSpotQrResolvedFieldResolver`), returning `null` when unset or when
  the linked QR cannot be found.
- REST: `qrId` on `PlantingSpotRestResponseDto` (metadata only — the PNG is
  only resolvable via GraphQL, matching the plant REST DTO's documented
  pattern).
- `PlantingSpotQrBuilder` extends `BaseBuilder<PlantingSpotQrAggregate,
  PlantingSpotQrViewModel>` — backed by a real `PlantingSpotQrAggregate`
  (read-only projection of QR data resolved via `IPlantingSpotQrPort`, no
  events/lifecycle of its own). This is a deliberate divergence from
  `PlantQrBuilder` in `plants`, which only builds a view-model and doesn't
  extend `BaseBuilder` (raised and resolved during review of gardenia-api
  #325) — `plants`' version is left as-is, out of scope for this change.

### Out of Scope (matches GDN-44 acceptance criteria)

- Backfill for planting spots created before this change — mirrors how
  `plants` shipped (nullable column, no backfill); accepted gap, not
  something this change introduces.
- QR regeneration/deletion endpoints for planting spots — `plants` doesn't
  expose these at MCP/REST/GraphQL either (only an internal, currently
  unused `SetPlantQrIdCommand`); not replicated here to avoid shipping dead
  code.
- Bulk QR download for multiple spots at once.
- Printing directly from the app (download only, handled on the web side).
- Any change to how the `qr` context itself or the plant QR flow works.

## Impacted Bounded Contexts

- **Modified:** `planting-spots` (domain, persistence, application,
  transport).
- **Consumed, not modified:** `qr` — reused exactly as-is via its existing
  public commands/queries (`CreateQrCommand`, `DeleteQrCommand`,
  `QrFindByIdQuery`, `QrFindPngByIdQuery`), the same integration pattern
  `plants` already established.

## Rollback Plan

Additive and backward-compatible: existing planting spots keep `qr_id =
NULL` (nothing reads/writes it before this migration runs). Rollback =
revert the feature commit and run the migration's `down()` (drops the
trigger/function, FK, unique constraint, and column — no data loss outside
the new `qr_id` values themselves; orphaned `qrs` rows are already handled by
the same cascade trigger pattern used for plants).
