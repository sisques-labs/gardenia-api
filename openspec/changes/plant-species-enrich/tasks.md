# Tasks: feat(plant-species): enrich PlantSpecies catalog from GBIF (#172)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 500–650 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (rename + fields + domain) → PR 2 (GBIF import command + transport + tests) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | DB migration + domain layer (rename + new VOs + events + aggregate + primitives) | PR 1 | Base: `main`. Includes domain tests. No transport changes. |
| 2 | App + infra + transport: update-handler, GBIF port+adapter, importPlantSpeciesFromGbif mutation, all specs | PR 2 | Base: PR 1 branch. Contains all GBIF logic and transport wiring. |

---

## Phase 1: Database Migration

- [x] 1.1 Create `src/database/migrations/1780000000014-AlterPlantSpeciesEnrich.ts` — RENAME COLUMN `name` → `scientific_name`, ALTER varchar(200) → varchar(300), RENAME CONSTRAINT `UQ_plant_species_name` → `UQ_plant_species_scientific_name`, ADD COLUMN `description varchar(2000) NULL`, ADD COLUMN `image_url varchar(500) NULL`. Include `down()` reversal.

## Phase 2: Domain Layer

- [x] 2.1 Rename `src/contexts/plant-species/domain/value-objects/plant-species-name/` folder to `plant-species-scientific-name/` and rename class to `PlantSpeciesScientificNameValueObject` — update `MAX_LENGTH` to 300, keep `allowEmpty: false`.
- [x] 2.2 Create `src/contexts/plant-species/domain/value-objects/plant-species-description/plant-species-description.value-object.ts` — `StringValueObject` subclass, `MAX_LENGTH = 2000`, nullable (`VO | null`).
- [x] 2.3 Create `src/contexts/plant-species/domain/value-objects/plant-species-image-url/plant-species-image-url.value-object.ts` — `StringValueObject` subclass, `MAX_LENGTH = 500`, nullable (`VO | null`).
- [x] 2.4 Rename `plant-species-name-changed.event.ts` → `plant-species-scientific-name-changed.event.ts`, rename class to `PlantSpeciesScientificNameChangedEvent`.
- [x] 2.5 Create `src/contexts/plant-species/domain/events/field-changed/plant-species-description-changed/plant-species-description-changed.event.ts` — same pattern as scientific-name-changed event.
- [x] 2.6 Create `src/contexts/plant-species/domain/events/field-changed/plant-species-image-url-changed/plant-species-image-url-changed.event.ts` — same pattern.
- [x] 2.7 Update `src/contexts/plant-species/domain/primitives/plant-species.primitives.ts` — rename `name: string` → `scientificName: string`, add `description: string | null`, `imageUrl: string | null`.
- [x] 2.8 Update `src/contexts/plant-species/domain/interfaces/plant-species.interface.ts` — rename `name` → `scientificName` (VO type updated), add `description: PlantSpeciesDescriptionValueObject | null`, `imageUrl: PlantSpeciesImageUrlValueObject | null`.
- [x] 2.9 Update `src/contexts/plant-species/domain/aggregates/plant-species.aggregate.ts` — rename `_name` → `_scientificName`, add `_description` and `_imageUrl` private fields; update `update()` to accept and dispatch description/imageUrl changed events; update `toPrimitives()`; update getters.
- [x] 2.10 Update `src/contexts/plant-species/domain/builders/plant-species.builder.ts` — rename `name` → `scientificName`, add `description` and `imageUrl` fields.

## Phase 3: Application Layer

- [x] 3.1 Update `src/contexts/plant-species/application/commands/create-plant-species/create-plant-species.command.ts` — rename `name` → `scientificName` in input interface and constructor.
- [x] 3.2 Update `src/contexts/plant-species/application/commands/update-plant-species/update-plant-species.command.ts` — rename `name` → `scientificName`, add optional `description?: string` and `imageUrl?: string`; construct new VOs.
- [x] 3.3 Update `src/contexts/plant-species/application/services/write/assert-plant-species-name-available/assert-plant-species-name-available.service.ts` — update all references from `name`/`PlantSpeciesNameValueObject` to `scientificName`/`PlantSpeciesScientificNameValueObject`.
- [x] 3.4 Create `src/contexts/plant-species/application/ports/plant-species-enrichment.port.ts` — export `PLANT_SPECIES_ENRICHMENT_PORT` Symbol and `IPlantSpeciesEnrichmentPort` interface with `enrich(scientificName: string): Promise<{ description: string | null; imageUrl: string | null } | null>`.
- [x] 3.5 Create `src/contexts/plant-species/application/commands/import-plant-species-from-gbif/import-plant-species-from-gbif.command.ts` — fields `limit: number`, `offset: number`.
- [x] 3.6 Create `src/contexts/plant-species/application/commands/import-plant-species-from-gbif/import-plant-species-from-gbif.handler.ts` — `ImportPlantSpeciesFromGbifCommandHandler` implements `ICommandHandler`; inject `PLANT_SPECIES_ENRICHMENT_PORT`, `PLANT_SPECIES_READ_REPOSITORY`, `PLANT_SPECIES_WRITE_REPOSITORY`; paginate with `limit`/`offset`, call port, upsert by `scientificName`; return `{ imported, skipped, errors }`. Add `// TODO: add admin auth guard` comment.

## Phase 4: Infrastructure Layer

- [x] 4.1 Update `src/contexts/plant-species/infrastructure/persistence/typeorm/entities/plant-species.entity.ts` — rename `name` → `scientificName` (column: `scientific_name`), widen to `varchar(300)`, rename `@Unique`, add nullable `description` (varchar 2000) and `imageUrl` (varchar 500) columns.
- [x] 4.2 Update `src/contexts/plant-species/infrastructure/persistence/typeorm/mappers/plant-species-typeorm.mapper.ts` — update all `name` → `scientificName` field references, add `description` and `imageUrl` mappings.
- [x] 4.3 Create `src/contexts/plant-species/infrastructure/adapters/gbif-plant-species-enrichment.adapter.ts` — implements `IPlantSpeciesEnrichmentPort`; uses `HttpService` from `@nestjs/axios`; calls `GET https://api.gbif.org/v1/species/match?name={scientificName}`; on match calls `/species/{key}` for description and `/species/{key}/media` for imageUrl; returns null on no-match / 4xx / 5xx / timeout (best-effort).
- [x] 4.4 Update `src/contexts/plant-species/infrastructure/persistence/typeorm/repositories/plant-species-typeorm-read.repository.ts` — update field references from `name` → `scientificName`.
- [x] 4.5 Update `src/contexts/plant-species/infrastructure/persistence/typeorm/repositories/plant-species-typeorm-write.repository.ts` — update field references; add `findByScientificName` if missing for upsert lookup.

## Phase 5: Transport Layer

- [x] 5.1 Update `src/contexts/plant-species/transport/graphql/dtos/requests/plant-species-create.request.dto.ts` — rename `name` → `scientificName`.
- [x] 5.2 Update `src/contexts/plant-species/transport/graphql/dtos/requests/plant-species-update.request.dto.ts` — rename `name` → `scientificName`, add optional `description` and `imageUrl` fields. Add `// TODO: restrict to admin` comment.
- [x] 5.3 Update `src/contexts/plant-species/transport/graphql/dtos/responses/plant-species.response.dto.ts` — rename `name` → `scientificName`, add `description` and `imageUrl` nullable fields.
- [x] 5.4 Update `src/contexts/plant-species/transport/graphql/mappers/plant-species.mapper.ts` — update `name` → `scientificName`, map `description` and `imageUrl`.
- [x] 5.5 Create `src/contexts/plant-species/transport/graphql/dtos/requests/plant-species-import-from-gbif.request.dto.ts` — `@InputType()` with `limit: Int` and `offset: Int` fields.
- [x] 5.6 Create `src/contexts/plant-species/transport/graphql/dtos/responses/import-plant-species-result.response.dto.ts` — `@ObjectType()` with `imported: Int`, `skipped: Int`, `errors: Int`.
- [x] 5.7 Update `src/contexts/plant-species/transport/graphql/resolvers/plant-species-mutations.resolver.ts` — rename `input.name` → `input.scientificName` in `createPlantSpecies` and `updatePlantSpecies`; add `importPlantSpeciesFromGbif(@Args('input') input)` mutation returning `ImportPlantSpeciesResultResponseDto`; add `// TODO: add admin auth guard` comment on import mutation. Add `// TODO: restrict to admin` on create/update.
- [x] 5.8 Update `src/contexts/plant-species/transport/rest/dtos/create-plant-species.dto.ts` — rename `name` → `scientificName`. Add `// TODO: restrict to admin` comment.
- [x] 5.9 Update `src/contexts/plant-species/transport/rest/dtos/update-plant-species.dto.ts` — rename `name` → `scientificName`, add optional `description` and `imageUrl`. Add `// TODO: restrict to admin` comment.
- [x] 5.10 Update `src/contexts/plant-species/transport/rest/dtos/plant-species-rest-response.dto.ts` — rename `name` → `scientificName`, add `description` and `imageUrl` nullable fields.
- [x] 5.11 Update `src/contexts/plant-species/transport/rest/mappers/plant-species/plant-species.mapper.ts` — update `name` → `scientificName`, add `description` and `imageUrl`.
- [x] 5.12 Update `src/contexts/plant-species/transport/rest/controllers/plant-species.controller.ts` — update DTO field references from `name` → `scientificName`.

## Phase 6: Module Wiring

- [x] 6.1 Update `src/contexts/plant-species/plant-species.module.ts` — import `HttpModule` from `@nestjs/axios`; register `ImportPlantSpeciesFromGbifCommandHandler` in `COMMAND_HANDLERS`; register `GbifPlantSpeciesEnrichmentAdapter` under `PLANT_SPECIES_ENRICHMENT_PORT` token in `INFRASTRUCTURE_ADAPTERS`.
- [x] 6.2 Add `@nestjs/axios` and `axios` to `package.json` dependencies (if not already present as direct deps).

## Phase 7: View Model & Domain Aggregate Spec

- [x] 7.1 Update `src/contexts/plant-species/domain/view-models/plant-species.view-model.ts` — rename `name` → `scientificName`, add `description: string | null`, `imageUrl: string | null`.
- [x] 7.2 Update `src/contexts/plant-species/domain/aggregates/plant-species.aggregate.spec.ts` — replace all `name` references with `scientificName`; add test cases for `update()` with `description` and `imageUrl`; verify `PlantSpeciesDescriptionChangedEvent` and `PlantSpeciesImageUrlChangedEvent` are dispatched; verify events NOT dispatched when value unchanged.

## Phase 8: Handler Unit Tests

- [x] 8.1 Create `src/contexts/plant-species/application/commands/update-plant-species/update-plant-species.handler.spec.ts` — mock `writeRepository`, `assertPlantSpeciesExistsService`, `assertPlantSpeciesNameAvailableService`, `EventBus`; cover: updates scientificName when provided, updates description only, updates imageUrl only, skips name check when scientificName not provided, publishes events.
- [x] 8.2 Create `src/contexts/plant-species/application/commands/import-plant-species-from-gbif/import-plant-species-from-gbif.handler.spec.ts` — mock `enrichmentPort`, `readRepository`, `writeRepository`; cover: returns correct `imported` count, increments `skipped` when port returns null, increments `errors` on port throw, upserts by `scientificName` (creates new vs updates existing).
- [x] 8.3 Update `src/contexts/plant-species/application/commands/create-plant-species/create-plant-species.handler.spec.ts` — rename `name` → `scientificName` in all test inputs and expectations.
