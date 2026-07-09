# Planting Spots Context

Manages planting spots (beds, pots, containers, field sections) within a space,
including their layout (row/column/dimensions), capacity and soil type. Follows
the project's DDD + CQRS + Hexagonal layering.

Every spot also carries a `status` (`active` | `fallow`) and a derived
`fallowSince` timestamp, for gardeners rotating crops who want to mark a spot
as resting between cycles. New spots always start `active`. `fallowSince` is
never client-settable — it is set automatically to "now" when a spot is marked
fallow, and cleared back to `null` when it is reactivated. Status transitions
go exclusively through `MarkPlantingSpotFallowCommand` /
`MarkPlantingSpotActiveCommand`; `UpdatePlantingSpotCommand` never touches
status.

Every spot also carries a `qr` (nullable), auto-generated at creation time via
`IPlantingSpotQrPort` and pointing to that spot's detail page
(`{QR_BASE_URL}/planting-spots/{id}?spaceId={spaceId}`) — mirrors the same
`qr` bounded-context integration `plants` already established
(`plant-qr-generation`). The QR image/metadata are resolved lazily through a
GraphQL field (`PlantingSpotQrResolvedFieldResolver`); REST only exposes
`qrId` (resolve the image via GraphQL). There is no client-facing
regenerate/delete action for a spot's QR, and no MCP tool for it — same as
`plants`.

## Public API

### Commands

| Command | Purpose |
|---------|---------|
| `CreatePlantingSpotCommand` | Create a planting spot in the current space |
| `UpdatePlantingSpotCommand` | Update a planting spot (never status) |
| `DeletePlantingSpotCommand` | Delete a planting spot |
| `WaterPlantingSpotCommand` | Water every plant in the spot in one action (hybrid mechanism, best-effort — see below) |
| `MarkPlantingSpotFallowCommand` | Mark a spot fallow (sets `fallowSince` to now); owner-only |
| `MarkPlantingSpotActiveCommand` | Reactivate a spot (clears `fallowSince`); owner-only |

### Queries

| Query | Purpose |
|-------|---------|
| `PlantingSpotFindByIdQuery` | Get a planting spot by id |
| `PlantingSpotFindByCriteriaQuery` | Paginated/filtered list |

### Transport

- GraphQL: `planting-spot` resolvers (queries, mutations, resolved plants,
  resolved `qr` field) — mutations include `plantingSpotMarkFallow` /
  `plantingSpotMarkActive`.
- REST: `PlantingSpotsController` — `POST :id/mark-fallow` / `POST :id/mark-active`.
- MCP: see below.

## MCP Tools

Exposed under `transport/mcp/` for AI clients (see `src/core/mcp/README.md`).
Each tool dispatches through the Command/Query bus; the acting user and active
space come from the authenticated MCP request context.

| Tool | Action |
|------|--------|
| `planting_spot_create` | Create a planting spot |
| `planting_spot_update` | Update a planting spot |
| `planting_spot_delete` | Delete a planting spot |
| `planting_spot_water` | Water every plant in the spot in one action |
| `planting_spot_find_by_id` | Get a planting spot by id |
| `planting_spot_find_by_criteria` | Paginated list of planting spots |
| `planting_spot_mark_fallow` | Mark a planting spot fallow |
| `planting_spot_mark_active` | Mark a planting spot active |

## Watering a planting spot

`WaterPlantingSpotCommand` (`POST /planting-spots/:id/water`, GraphQL
`plantingSpotWater`, MCP `planting_spot_water`) waters every plant in the spot
in one action:

1. Asserts the planting spot exists (`AssertPlantingSpotExistsService`).
2. Looks up its plants via `IPlantingSpotPlantsPort`.
3. For each plant, dispatches `WaterPlantCommand` (from the `care-schedule`
   context) through `IWaterPlantPort` / `WaterPlantAdapter` — the **hybrid
   mechanism**: it completes the plant's active `WATERING` care schedule if one
   exists, otherwise records an ad-hoc care-log entry.

Watering is **best-effort and partial**: each plant is watered independently
(`Promise.allSettled`), so one plant's failure never blocks the others. The
result reports `wateredPlantIds` and `failedPlants` (with a `reason` per
failure) rather than throwing on partial failure. The command does throw if the
planting spot itself does not exist — no plant is watered in that case.

This is the context's only outward dependency beyond `plants` (see
`planting-spots-no-plants-import.spec.ts`), confined to
`infrastructure/adapters/water-plant.adapter.ts`.
