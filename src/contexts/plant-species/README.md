# Plant Species Context

Maintains the shared catalog of plant species (scientific name, description,
image) and imports/enriches species data from external sources. Follows the
project's DDD + CQRS + Hexagonal layering.

## Public API

### Commands

| Command | Purpose |
|---------|---------|
| `CreatePlantSpeciesCommand` | Add a species to the catalog |
| `UpdatePlantSpeciesCommand` | Update a species |
| `DeletePlantSpeciesCommand` | Remove a species |
| `EnrichPlantSpeciesCommand` | Enrich a species from external data |
| `ImportPlantSpeciesCommand` | Import a batch from the external catalog |

### Queries

| Query | Purpose |
|-------|---------|
| `PlantSpeciesFindByIdQuery` | Get a species by id |
| `PlantSpeciesFindByCriteriaQuery` | Paginated/filtered list |

### Transport

- GraphQL: `plant-species` resolvers (queries, mutations).
- REST: `PlantSpeciesController`.
- MCP: see below.

## MCP Tools

Exposed under `transport/mcp/` for AI clients (see `src/core/mcp/README.md`).
Each tool dispatches through the Command/Query bus.

| Tool | Action |
|------|--------|
| `plant_species_create` | Create a species |
| `plant_species_update` | Update a species |
| `plant_species_delete` | Delete a species |
| `plant_species_enrich` | Enrich a species from external data |
| `plant_species_import` | Import a batch of species |
| `plant_species_find_by_id` | Get a species by id |
| `plant_species_find_by_criteria` | Paginated list of species |
