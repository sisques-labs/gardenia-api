# Tasks: Trim plant-species, add live GBIF search + find-or-create link (GDN-35)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 400-600 (much smaller than the earlier full-deletion draft) |
| 400-line budget risk | Medium |
| Chained PRs recommended | No — single PR, split only if implementation reveals otherwise |
| Delivery strategy | ask-on-risk |

---

## Phase 1: Database Migration

- [ ] 1.1 Confirm the live name of the unique constraint on
      `plant_species.scientific_name` (established by earlier migrations)
      before writing `DROP CONSTRAINT`.
- [ ] 1.2 Create `src/database/migrations/{next-timestamp}-TrimPlantSpeciesToGbif.ts`:
      `up()` drops `description`, `image_url`; drops the scientific_name
      unique constraint; adds nullable `gbif_key integer`; creates a partial
      unique index `WHERE gbif_key IS NOT NULL`. `down()` reverses (re-adds
      nullable `description`/`image_url`, drops the partial index + column,
      re-adds the scientific_name unique constraint — document that data in
      dropped columns is not restored).

## Phase 2: Domain Layer (`plant-species`)

- [ ] 2.1 Delete `domain/value-objects/plant-species-description/` (+ spec),
      `domain/value-objects/plant-species-image-url/` (+ spec),
      `domain/events/field-changed/plant-species-description-changed/`,
      `domain/events/field-changed/plant-species-image-url-changed/`.
- [ ] 2.2 Create `domain/value-objects/plant-species-gbif-key/plant-species-gbif-key.value-object.ts`
      (`PlantSpeciesGbifKeyValueObject` extends `NumberValueObject`, positive
      integer) + spec.
- [ ] 2.3 Create `domain/events/field-changed/plant-species-gbif-key-changed/plant-species-gbif-key-changed.event.ts`
      (`PlantSpeciesGbifKeyChangedEvent`).
- [ ] 2.4 Update `domain/interfaces/plant-species.interface.ts`,
      `domain/primitives/plant-species.primitives.ts`: drop
      `description`/`imageUrl`; add `gbifKey: number | null`.
- [ ] 2.5 Update `domain/aggregates/plant-species.aggregate.ts` (+ spec): drop
      `_description`/`_imageUrl` + their change methods; add `_gbifKey` +
      `changeGbifKey()`; update constructor/`update()`/`toPrimitives()`/getters.
- [ ] 2.6 Update `domain/builders/plant-species.builder.ts` (+ spec):
      `withDescription`/`withImageUrl` → `withGbifKey`.
- [ ] 2.7 Update `domain/view-models/plant-species.view-model.ts`: drop
      `description`/`imageUrl`, add `gbifKey`.
- [ ] 2.8 Delete `domain/exceptions/plant-species-name-already-exists.exception.ts`;
      create `domain/exceptions/plant-species-gbif-key-already-exists.exception.ts`
      (`PlantSpeciesGbifKeyAlreadyExistsException`).

## Phase 3: Application Layer (`plant-species`)

- [ ] 3.1 Delete `application/commands/enrich-plant-species/` (+ spec),
      `application/commands/import-plant-species/` (+ spec),
      `application/ports/plant-species-import.port.ts` (and the enrichment
      port file, if separately named — confirm at apply time).
- [ ] 3.2 Delete `application/services/write/assert-plant-species-name-available/`
      (+ spec); create `application/services/write/assert-plant-species-gbif-key-available/`
      (+ spec) — used only by the manual `CreatePlantSpeciesCommand` path.
- [ ] 3.3 Update `application/commands/create-plant-species/` and
      `update-plant-species/` (+ specs): field swap
      (`description`/`imageUrl` → `gbifKey`), wire the new assert service.
- [ ] 3.4 Create `application/commands/find-or-create-plant-species-by-gbif-key/`:
      `.command.ts` (`{ gbifKey, scientificName }`), `.handler.ts`
      (`findByGbifKey` → return `{id}` if found; else build+save+publish,
      return new `{id}`), `.handler.spec.ts` (found path, create path; note
      the read-then-write race — see design.md §9.3 for the accepted-risk
      vs. `ON CONFLICT` decision, make the call here).
- [ ] 3.5 Create `application/ports/gbif-species-search.port.ts`
      (`GBIF_SPECIES_SEARCH_PORT`, `IGbifSpeciesSearchPort.suggest(name,
      limit)`).
- [ ] 3.6 Create `application/queries/gbif-species-search/gbif-species-search.query.ts`
      + `.handler.ts` + `.handler.spec.ts` (mock port: happy path, empty
      result, limit clamping).
- [ ] 3.7 Update `domain/repositories/read/plant-species-read.repository.ts` +
      TypeORM implementation: add `findByGbifKey(gbifKey: number)`.
- [ ] 3.8 Update `transport/graphql/enums/plant-species-queryable-field.enum.ts`
      + `transport/graphql/registries/plant-species-filterable-fields.registry.ts`
      (+ spec): drop `description`/`imageUrl`, add `gbifKey`.

## Phase 4: Infrastructure Layer (`plant-species`)

- [ ] 4.1 Update `infrastructure/persistence/typeorm/entities/plant-species.entity.ts`:
      drop `description`/`imageUrl` columns; add nullable `gbifKey` (`gbif_key`
      int); drop the `@Unique` on `scientificName`; add the partial unique
      index (via migration, entity decorator as applicable).
- [ ] 4.2 Update `infrastructure/persistence/typeorm/mappers/plant-species-typeorm.mapper.ts`
      (+ spec): field swap.
- [ ] 4.3 Update `infrastructure/persistence/typeorm/repositories/plant-species-typeorm-read.repository.ts`
      (+ write repo if needed): implement `findByGbifKey`.
- [ ] 4.4 Delete `infrastructure/adapters/gbif-plant-species-import.adapter.ts`
      (+ spec) and its enrichment counterpart; delete/replace
      `infrastructure/adapters/gbif/types/gbif-api.types.ts` with a leaner
      suggest-only types file.
- [ ] 4.5 Create `infrastructure/adapters/gbif-species-suggest.adapter.ts`
      (+ spec, + `gbif/types/gbif-suggest-api.types.ts`): `/species/suggest`,
      5s timeout, try/catch → `[]` + warn log, drop malformed entries.

## Phase 5: Transport (`plant-species`)

- [ ] 5.1 Trim GraphQL create/update DTOs + response DTO (drop
      description/imageUrl, add gbifKey); remove `plant-species-enrich.request.dto.ts`
      and import request/response DTOs; remove `enrichPlantSpecies` /
      `importPlantSpeciesFromGbif` from `plant-species-mutations.resolver.ts`
      (+ spec).
- [ ] 5.2 Create `transport/graphql/dtos/requests/gbif-species-search.request.dto.ts`
      + `transport/graphql/dtos/responses/gbif-species-suggestion.response.dto.ts`
      + `transport/graphql/mappers/gbif-species-suggestion.mapper.ts` (+ spec)
      + `transport/graphql/resolvers/gbif-species-search-queries.resolver.ts`
      (+ spec).
- [ ] 5.3 Trim REST create/update/response DTOs; add `GET
      /plant-species/search` to `plant-species.controller.ts` (+ spec).
- [ ] 5.4 Trim MCP `plant-species-create.schema.ts`/`-update.schema.ts`;
      delete `plant-species-enrich.schema.ts`/`.tool.ts` and
      `plant-species-import.schema.ts`/`.tool.ts`; create
      `gbif-species-search.schema.ts` + `plant_species_search.tool.ts`.
- [ ] 5.5 Update `plant-species.module.ts`: remove enrich/import handler +
      port bindings; add the new command handler, query handler, adapter
      binding, resolver, controller method (if separate), MCP tool to their
      provider arrays.

## Phase 6: `plants` — small edit

- [ ] 6.1 Update `application/commands/create-plant/create-plant.command.ts`
      and `update-plant/update-plant.command.ts`: `plantSpeciesId?` →
      `gbifSpeciesKey?: number`, `speciesScientificName?: string` (paired).
- [ ] 6.2 Update `application/ports/plant-species.port.ts`: add
      `findOrCreateByGbifKey`.
- [ ] 6.3 Update `infrastructure/adapters/plant-species.adapter.ts` (+ spec):
      implement `findOrCreateByGbifKey` (dispatch
      `FindOrCreatePlantSpeciesByGbifKeyCommand` via `CommandBus`).
- [ ] 6.4 Delete `application/services/write/assert-plant-linked-species-exists/`
      (+ spec) and `domain/exceptions/plant-linked-species-not-found.exception.ts`.
- [ ] 6.5 Update `application/commands/create-plant/create-plant.handler.ts`
      (+ spec) and `update-plant/update-plant.handler.ts` (+ spec): replace
      the assert-exists call with `plantSpeciesPort.findOrCreateByGbifKey(...)`
      when both new fields are present; pass the returned id to
      `withPlantSpeciesId(...)` unchanged.
- [ ] 6.6 Update `domain/builders/plant-species.builder.ts` (plants-local
      mirror), `domain/view-models/plant-species.view-model.ts`,
      `domain/primitives/plant-species-view-model.primitives.ts`: drop
      `description`/`imageUrl`, add `gbifKey`.
- [ ] 6.7 Update GraphQL: `plant-create.request.dto.ts` /
      `plant-update.request.dto.ts` (field swap);
      `plant.response.dto.ts`'s `PlantLinkedSpeciesResponseDto` (drop
      description/imageUrl, add gbifKey); `plant.mapper.ts` (+ spec).
- [ ] 6.8 Update REST/MCP equivalents (`create-plant.dto.ts`,
      `update-plant.dto.ts`, `plant-rest-response.dto.ts`,
      `plant-create.schema.ts`, `plant-update.schema.ts`).
- [ ] 6.9 Confirm no change needed to `PlantAggregate`, `plant.entity.ts`,
      `plant-typeorm.mapper.ts`, `PlantSpeciesResolvedFieldResolver`,
      `EnrichPlantWithSpeciesService` — verify at apply time and leave
      untouched if confirmed.

## Phase 7: Tests & READMEs

- [ ] 7.1 Update `test/integration/plant-species/*.integration-spec.ts` for
      the trimmed schema + `findByGbifKey`.
- [ ] 7.2 Update `test/e2e/plant-species/*.e2e-spec.ts` (REST + GraphQL) for
      trimmed fields, removed enrich/import endpoints, new search endpoint.
- [ ] 7.3 Update `test/integration/plants/*.integration-spec.ts` and
      `test/e2e/plants/plants-rest.e2e-spec.ts` for the command input field
      swap and find-or-create behavior.
- [ ] 7.4 Update `src/contexts/plant-species/README.md` and
      `src/contexts/plants/README.md` to reflect current state (per
      `openspec/config.yaml` apply rule).

## Phase 8: Verification

- [ ] 8.1 `pnpm lint` clean.
- [ ] 8.2 `pnpm tsc --noEmit` clean.
- [ ] 8.3 `pnpm test` — full unit suite green.
- [ ] 8.4 `pnpm test:integration` — where Postgres is available.
- [ ] 8.5 `pnpm test:e2e` — where Postgres is available.
- [ ] 8.6 `pnpm test:cov` — confirm coverage threshold (80%) still met.
- [ ] 8.7 Grep the repo for `description`/`imageUrl` references still tied to
      `plant-species` (both the context itself and its `plants`-local
      mirror) to confirm none remain.
