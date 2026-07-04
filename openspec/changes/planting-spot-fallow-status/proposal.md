# Proposal: Planting Spot Fallow Status

## Intent

A `PlantingSpot` today has no notion of rest. Gardeners who rotate crops need to
mark a bed, pot, or field section as resting between cycles — deliberately not
planting there for a season — but there is no way to record that in Gardenia.
The spot just looks empty, indistinguishable from "nobody has gotten around to
planting here yet."

This change adds a minimal `status` field (`active` | `fallow`) to
`PlantingSpotAggregate`, plus an automatically derived `fallowSince` timestamp
that records when the spot entered fallow. Rather than folding `status` into
the generic `UpdatePlantingSpotCommand`, the transition is exposed through two
small, dedicated commands — `MarkPlantingSpotFallow` and
`MarkPlantingSpotActive` — mirroring how `care-schedule`'s `complete()` is a
dedicated domain action rather than a generic field update. This keeps
`fallowSince` fully internal: no command, DTO, or MCP schema ever accepts it as
input: it is derived entirely inside the aggregate whenever one of these two
actions runs.

## Scope

### In Scope
- `PlantingSpotStatusEnum`: `ACTIVE` | `FALLOW`. New spots default to `ACTIVE`.
- `status` and `fallowSince` (nullable timestamp) fields on
  `PlantingSpotAggregate`.
- Two new public aggregate actions: `markFallow()` (sets `status = FALLOW`,
  `fallowSince = now`) and `markActive()` (sets `status = ACTIVE`,
  `fallowSince = null`). Both are no-ops (no state change, no event) when the
  spot is already in the target status.
- Two new dedicated commands: `MarkPlantingSpotFallowCommand` and
  `MarkPlantingSpotActiveCommand`, each taking only `{ id, spaceId,
  requestingUserId }` — same shape as `DeletePlantingSpotCommand`. Same
  owner-only authorization as `UpdatePlantingSpotCommand`/
  `DeletePlantingSpotCommand` (only the spot's owner may change its status).
- `planting_spots` table gains `status` (NOT NULL, default `'active'`) and
  `fallow_since` (nullable) columns via migration.
- REST endpoints `POST /planting-spots/:id/mark-fallow` and
  `POST /planting-spots/:id/mark-active`; GraphQL mutations
  `plantingSpotMarkFallow` / `plantingSpotMarkActive`; MCP tools
  `planting_spot_mark_fallow` / `planting_spot_mark_active`. All three follow
  the same shape as the existing `delete`/`update` operations in this context.
- Read surfaces (`PlantingSpotViewModel`, GraphQL/REST response DTOs) expose
  both `status` and `fallowSince`.
- `UpdatePlantingSpotCommand` is **not** modified — status is exclusively
  managed by the two new dedicated commands.

### Out of Scope
- Crop rotation history / "what was planted here before" tracking.
- Blocking or warning when creating/assigning a plant to a `FALLOW` spot (no
  behavioural coupling with the `plants` context in this change).
- Any notification/reminder tied to how long a spot has been fallow.
- The separate "Soil" module explored alongside this idea — deferred as too
  complex for this iteration.
- Web (`gardenia-web`) use cases/UI — tracked as a follow-up change once the
  API surface here lands.

## Impacted Bounded Contexts
- **Modified:** `planting-spots` only (domain, persistence, transport). No
  other bounded context is touched; `status`/`fallowSince` are not referenced
  by `plants` or any other context in this change.

## Rollback Plan
Additive and backward-compatible: existing spots default to `status = 'active'`,
`fallow_since = null`, so no existing behaviour changes for spots that never
call the new actions. Rollback = revert the feature commit and run the
migration's `down()` (drops both columns). No existing columns, commands, or
contexts are altered.
