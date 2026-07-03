# Planting Spots Context

Manages planting spots (beds, pots, containers, field sections) within a space,
including their layout (row/column/dimensions), capacity and soil type. Follows
the project's DDD + CQRS + Hexagonal layering.

## Public API

### Commands

| Command | Purpose |
|---------|---------|
| `CreatePlantingSpotCommand` | Create a planting spot in the current space |
| `UpdatePlantingSpotCommand` | Update a planting spot |
| `DeletePlantingSpotCommand` | Delete a planting spot |
| `WaterPlantingSpotCommand` | Water every plant in the spot in one action (hybrid mechanism, best-effort — see below) |

### Queries

| Query | Purpose |
|-------|---------|
| `PlantingSpotFindByIdQuery` | Get a planting spot by id |
| `PlantingSpotFindByCriteriaQuery` | Paginated/filtered list |

### Transport

- GraphQL: `planting-spot` resolvers (queries, mutations, resolved plants).
- REST: `PlantingSpotsController`.
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
