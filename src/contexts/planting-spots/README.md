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

## Public API

### Commands

| Command | Purpose |
|---------|---------|
| `CreatePlantingSpotCommand` | Create a planting spot in the current space |
| `UpdatePlantingSpotCommand` | Update a planting spot (never status) |
| `DeletePlantingSpotCommand` | Delete a planting spot |
| `MarkPlantingSpotFallowCommand` | Mark a spot fallow (sets `fallowSince` to now); owner-only |
| `MarkPlantingSpotActiveCommand` | Reactivate a spot (clears `fallowSince`); owner-only |

### Queries

| Query | Purpose |
|-------|---------|
| `PlantingSpotFindByIdQuery` | Get a planting spot by id |
| `PlantingSpotFindByCriteriaQuery` | Paginated/filtered list |

### Transport

- GraphQL: `planting-spot` resolvers (queries, mutations, resolved plants) —
  mutations include `plantingSpotMarkFallow` / `plantingSpotMarkActive`.
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
| `planting_spot_find_by_id` | Get a planting spot by id |
| `planting_spot_find_by_criteria` | Paginated list of planting spots |
| `planting_spot_mark_fallow` | Mark a planting spot fallow |
| `planting_spot_mark_active` | Mark a planting spot active |
