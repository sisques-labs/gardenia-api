# Plants Context

Manages plants: their identity, linked species, planting spot, QR code and care
history references. Follows the project's DDD + CQRS + Hexagonal layering
(`domain / application / infrastructure / transport`).

## Public API

### Commands

| Command | Purpose |
|---------|---------|
| `CreatePlantCommand` | Create a plant for the current user/space |
| `UpdatePlantCommand` | Update a plant's name/species/image |
| `DeletePlantCommand` | Delete a plant |
| `SetPlantQrIdCommand` | Link a QR code to a plant (internal) |

### Queries

| Query | Purpose |
|-------|---------|
| `PlantFindByIdQuery` | Get a plant by id |
| `PlantFindByCriteriaQuery` | Paginated/filtered list of plants |

### Transport

- GraphQL: `plant` resolvers (queries, mutations, resolved fields).
- REST: `PlantsController`.
- MCP: see below.

## MCP Tools

Exposed under `transport/mcp/` for AI clients (see `src/core/mcp/README.md`).
Each tool dispatches through the Command/Query bus; the acting user and active
space come from the authenticated MCP request context.

| Tool | Action |
|------|--------|
| `plant_create` | Create a plant |
| `plant_update` | Update a plant |
| `plant_delete` | Delete a plant |
| `plant_find_by_id` | Get a plant by id |
| `plant_find_by_criteria` | Paginated list of plants |
