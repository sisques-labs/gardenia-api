# Exploration: feat(plant-species) enrich with scientificName, description, imageUrl — #172

## Current State

PlantSpecies is a fully isolated bounded context at `/src/contexts/plant-species/`. Today it has exactly **one** domain field beyond id/timestamps: `name`.

**Domain model** — `domain/aggregates/plant-species.aggregate.ts`:
- `_id: PlantSpeciesIdValueObject`
- `_name: PlantSpeciesNameValueObject`
- `update()` supports only `{ name? }`, emitting `PlantSpeciesNameChangedEvent` + `PlantSpeciesUpdatedEvent`
- `toPrimitives()` → `IPlantSpeciesPrimitives` = `BasePrimitives & { name: string }`

**Persistence** — `infrastructure/.../entities/plant-species.entity.ts`:
- Table `plant_species`: `id`, `name` (varchar 200, NOT NULL, UNIQUE), `created_at`, `updated_at`
- Migration: `1780000000008-CreatePlantSpecies.ts`

**Read model**: No MongoDB/Mongoose. `PlantSpeciesTypeOrmReadRepository` serves both read and write via TypeORM. `PlantSpeciesViewModel` carries: `id`, `name`, `createdAt`, `updatedAt`.

**Application layer**:
- `CreatePlantSpeciesCommand`: `name` only
- `UpdatePlantSpeciesCommand`: `id` + `name?`
- Both handlers use `PlantSpeciesBuilder`

**Transport**:
- GraphQL: `PlantSpeciesResponseDto` (id, name, createdAt, updatedAt); create/update DTOs only have `name`
- REST: `PlantSpeciesRestResponseDto` identical; same DTOs for create/update

**Tests**: Unit tests for aggregate and create handler. No `update-plant-species.handler.spec.ts`.

## Affected Files (~22 files + 1 migration)

| File | Reason |
|------|--------|
| `domain/interfaces/plant-species.interface.ts` | 3 nullable VO fields |
| `domain/primitives/plant-species.primitives.ts` | 3 `string \| null` fields |
| `domain/aggregates/plant-species.aggregate.ts` | Private fields, getters, `update()`, `changeFoo()`, `toPrimitives()` |
| `domain/builders/plant-species.builder.ts` | 3 `withFoo()` + `build()` + `buildViewModel()` |
| `domain/view-models/plant-species.view-model.ts` | 3 nullable string props |
| `domain/value-objects/plant-species-scientific-name/` | New VO |
| `domain/value-objects/plant-species-description/` | New VO |
| `domain/value-objects/plant-species-image-url/` | New VO |
| `domain/events/field-changed/plant-species-scientific-name-changed/` | New event |
| `domain/events/field-changed/plant-species-description-changed/` | New event |
| `domain/events/field-changed/plant-species-image-url-changed/` | New event |
| `infrastructure/.../entities/plant-species.entity.ts` | 3 `@Column({ nullable: true })` |
| `infrastructure/.../mappers/plant-species-typeorm.mapper.ts` | Map new fields |
| `database/migrations/` | New migration: nullable ADD COLUMN |
| `application/commands/create-plant-species/*.command.ts` | Add optional inputs |
| `application/commands/create-plant-species/*.handler.ts` | Pass new fields to builder |
| `application/commands/update-plant-species/*.command.ts` | Add optional inputs |
| `application/commands/update-plant-species/*.handler.ts` | Pass new fields to `update()` |
| `transport/graphql/dtos/requests/*.ts` (create + update) | Nullable GQL fields |
| `transport/graphql/dtos/responses/*.ts` | Nullable GQL fields |
| `transport/graphql/mappers/plant-species.mapper.ts` | Map new fields |
| `transport/rest/dtos/*.ts` (create + update + response) | Optional REST fields |
| `transport/rest/mappers/plant-species/plant-species.mapper.ts` | Map new fields |
| `domain/aggregates/plant-species.aggregate.spec.ts` | Extend for new field events |
| `application/commands/create-plant-species/*.handler.spec.ts` | Extend for new fields |
| *(new)* `application/commands/update-plant-species/*.handler.spec.ts` | Missing, create in this change |

## Reference Pattern

`Plant.imageUrl` in `plants` context: VO extends `StringValueObject`, `| null` in interface/primitives, `@Column({ nullable: true })` in entity, `nullable: true` in GraphQL DTOs, `@ApiPropertyOptional` in REST DTOs.

## Recommendation

All three fields **nullable** (no breaking changes, no backfill, consistent with existing pattern).

Suggested max lengths:
- `scientificName`: 300 chars
- `description`: 2000 chars
- `imageUrl`: 500 chars (matches `PlantImageUrlValueObject.MAX_LENGTH`)

## Risks

- `IPlantSpeciesEventData` is a type alias of `IPlantSpeciesPrimitives` — new fields propagate to event payloads automatically
- Missing `update-plant-species.handler.spec.ts` — create in this change
- Migration must be backward-compatible `ALTER TABLE ADD COLUMN ... DEFAULT NULL`
- No cross-context changes required
