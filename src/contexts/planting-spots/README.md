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
| `planting_spot_find_by_id` | Get a planting spot by id |
| `planting_spot_find_by_criteria` | Paginated list of planting spots |
