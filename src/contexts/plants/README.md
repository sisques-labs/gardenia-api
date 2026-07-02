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

#### `plantsFindByCriteria` filters and sorts

`filters`/`sorts` still use the generic `Criteria` shape (`{ field, operator,
value }` / `{ field, direction }`), but `field` is restricted to
`PlantQueryableFieldEnum` (via `@sisques-labs/nestjs-kit`'s
`createFilterInput`/`createSortInput`) instead of a free string, and `value`
is validated against `plantFilterableFields`
(`transport/graphql/registries/plant-filterable-fields.registry.ts`) by
`FilterValidationPipe` before the query runs.

| Field | Value type | Notes |
|-------|-----------|-------|
| `NAME` | string | supports `LIKE` |
| `PLANT_SPECIES_ID` | uuid | |
| `PLANTING_SPOT_ID` | uuid | supports `IN` with an array |
| `CREATED_AT` | date (ISO string) | |
| `UPDATED_AT` | date (ISO string) | |

No enum-valued field exists yet (`plant-registered-enums.graphql.ts` is an
empty scaffold). Adding one (e.g. a future plant status) is a two-line change:
add the value to `PlantQueryableField` and an `{ type: 'enum', enum: ... }`
entry in the registry — no schema-breaking change.

`PlantTypeOrmReadRepository.findByCriteria` builds the query with a
`QueryBuilder` (translating every `FilterOperator`), and explicitly scopes
results to `spaceContext.require()` since `createQueryBuilder` bypasses the
tenant-scoping proxy that `find`/`findOne`/`findAndCount` go through.

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
