# Plant Species Context

Maintains a lightweight catalog of plant species identified by GBIF's
numeric `usageKey` plus a scientific name, and proxies GBIF's live
`/species/suggest` endpoint for autocomplete. Follows the project's
DDD + CQRS + Hexagonal layering.

The catalog entry itself carries only `scientificName` and `gbifKey` — no
description, image, or other enrichment data. Live search results are never
persisted; only a species actually linked to a `Plant` gets a catalog row,
created on demand (see `FindOrCreatePlantSpeciesByGbifKeyCommand`).

## Public API

### Commands

| Command | Purpose |
|---------|---------|
| `CreatePlantSpeciesCommand` | Add a species to the catalog directly (manual path) |
| `UpdatePlantSpeciesCommand` | Update a species' scientificName/gbifKey |
| `DeletePlantSpeciesCommand` | Remove a species (blocked while any plant references it) |
| `FindOrCreatePlantSpeciesByGbifKeyCommand` | Resolve a `gbifKey`+`scientificName` pair (from a live search pick) to a catalog id — creates the row on first use, reuses it otherwise. Used by `plants` via `IPlantSpeciesPort.findOrCreateByGbifKey`. |

### Queries

| Query | Purpose |
|-------|---------|
| `PlantSpeciesFindByIdQuery` | Get a species by id |
| `PlantSpeciesFindByCriteriaQuery` | Paginated/filtered list |
| `GbifSpeciesSearchQuery` | Live, non-persisting GBIF species search (autocomplete) — proxies `GET /species/suggest`. Never writes to the database. |

### Transport

- GraphQL: `plant-species` resolvers (queries, mutations) + `gbifSpeciesSearch` query.
- REST: `PlantSpeciesController` (`/plant-species`, including `/plant-species/search`).
- MCP: see below.

## MCP Tools

Exposed under `transport/mcp/` for AI clients (see the `@sisques-labs/nestjs-kit/mcp` module docs).
Each tool dispatches through the Command/Query bus.

| Tool | Action |
|------|--------|
| `plant_species_create` | Create a species |
| `plant_species_update` | Update a species |
| `plant_species_delete` | Delete a species |
| `plant_species_search` | Live GBIF species search (autocomplete), no persistence |
| `plant_species_find_by_id` | Get a species by id |
| `plant_species_find_by_criteria` | Paginated list of species |
