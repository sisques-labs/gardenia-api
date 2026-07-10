# Tasks: Remove plant-species catalog, add live GBIF species search (GDN-35)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 900–1200 (large: full context deletion + 2 context edits + 1 new context) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (delete plant-species + migrate plants/planting-spots) → PR 2 (new plant-species-search context) |
| Delivery strategy | ask-on-risk |
| Chain strategy | PR 2 branches from PR 1 |

Decision needed before apply: No (proposal already confirms 2-PR split; only
exact PR boundary may shift slightly if line counts differ from forecast)

---

## Phase 1: Database Migration (PR 1)

- [ ] 1.1 Confirm the live FK/constraint name on `plants.plant_species_id`
      against the actual schema (`\d plants` or the `AlterPlantsPlantSpeciesId`
      migration) before writing the `DROP CONSTRAINT` statement.
- [ ] 1.2 Create `src/database/migrations/{next-timestamp}-RemovePlantSpeciesCatalog.ts`:
      - `up()`: add `plants.gbif_species_key integer NULL`, add
        `plants.species_scientific_name character varying(300) NULL`;
        backfill `species_scientific_name` from `plant_species.scientific_name`
        via `UPDATE ... FROM` for every plant with a non-null
        `plant_species_id`; drop the FK constraint; drop
        `plants.plant_species_id`; `DROP TABLE plant_species`.
      - `down()`: recreate an empty `plant_species` table matching its
        pre-drop shape; re-add `plants.plant_species_id uuid NULL` (no FK, no
        data restored); drop `gbif_species_key`/`species_scientific_name`.
        Docstring MUST state this restores schema only, not data.
- [ ] 1.3 Update `test/helpers/test-data-source.ts` and
      `test/helpers/tenant-seed.ts` to drop any `plant_species` seeding and
      seed `plants.gbif_species_key`/`species_scientific_name` where fixtures
      currently seed `plantSpeciesId`.

## Phase 2: Delete the `plant-species` Context (PR 1)

- [ ] 2.1 Delete `src/contexts/plant-species/` entirely (domain, application,
      infrastructure, transport, README, all specs).
- [ ] 2.2 Delete `test/integration/plant-species/` and
      `test/e2e/plant-species/` entirely.
- [ ] 2.3 Remove `PlantSpeciesModule` from `CONTEXT_MODULES` in
      `src/contexts/contexts.module.ts`.
- [ ] 2.4 Remove `@nestjs/axios`/`axios` from `package.json` **only if** no
      other context still uses `HttpModule`/`HttpService` after this change
      (check `plant-species-search` in Phase 4 first — it will still need
      them, so this task is likely a no-op; confirm and skip if so).

## Phase 3: Update `plants` for the Field Swap (PR 1)

- [ ] 3.1 Delete `application/ports/plant-species.port.ts`,
      `infrastructure/adapters/plant-species.adapter.ts` (+ spec),
      `domain/builders/plant-species.builder.ts` (+ spec),
      `domain/view-models/plant-species.view-model.ts`,
      `domain/primitives/plant-species-view-model.primitives.ts`,
      `application/services/read/enrich-plant-with-species/` (+ spec),
      `application/services/write/assert-plant-linked-species-exists/` (+ spec),
      `domain/exceptions/plant-linked-species-not-found.exception.ts`,
      `domain/value-objects/plant-linked-species-id/` (+ spec),
      `domain/events/field-changed/plant-species-id-changed/`,
      `transport/graphql/resolvers/plant/plant-species-resolved-field.resolver.ts` (+ spec).
- [ ] 3.2 Create `domain/value-objects/plant-gbif-species-key/plant-gbif-species-key.value-object.ts`
      (`PlantGbifSpeciesKeyValueObject` extends `NumberValueObject`, nullable,
      integer, positive) + spec.
- [ ] 3.3 Create `domain/value-objects/plant-species-scientific-name/plant-species-scientific-name.value-object.ts`
      (`PlantSpeciesScientificNameValueObject` extends `StringValueObject`,
      nullable, max 300, trimmed) + spec.
- [ ] 3.4 Create `domain/events/field-changed/plant-gbif-species-key-changed/plant-gbif-species-key-changed.event.ts`
      (`PlantGbifSpeciesKeyChangedEvent`) and
      `domain/events/field-changed/plant-species-scientific-name-changed/plant-species-scientific-name-changed.event.ts`
      (`PlantSpeciesScientificNameChangedEvent`).
- [ ] 3.5 Update `domain/interfaces/plant.interface.ts`: remove
      `plantSpeciesId`; add `gbifSpeciesKey`, `speciesScientificName` (VO types).
- [ ] 3.6 Update `domain/primitives/plant.primitives.ts`: remove
      `plantSpeciesId: string | null`; add `gbifSpeciesKey: number | null`,
      `speciesScientificName: string | null`.
- [ ] 3.7 Update `domain/aggregates/plant.aggregate.ts` (+ spec): remove
      `_plantSpeciesId`/`changePlantSpeciesId()`; add `_gbifSpeciesKey`,
      `_speciesScientificName`, `changeGbifSpeciesKey()`,
      `changeSpeciesScientificName()`; update constructor, `update()`,
      `toPrimitives()`, getters.
- [ ] 3.8 Update `domain/builders/plant.builder.ts` (+ spec):
      `withPlantSpeciesId` → `withGbifSpeciesKey` + `withSpeciesScientificName`.
- [ ] 3.9 Update `domain/view-models/plant.view-model.ts`: remove
      `plantSpeciesId`/`species`; add `gbifSpeciesKey`, `speciesScientificName`.
- [ ] 3.10 Update `application/commands/create-plant/create-plant.command.ts`
      and `application/commands/update-plant/update-plant.command.ts`: replace
      `plantSpeciesId?` with `gbifSpeciesKey?: number | null`,
      `speciesScientificName?: string | null`; construct the two new VOs.
- [ ] 3.11 Update `application/commands/create-plant/create-plant.handler.ts`
      (+ spec): remove `AssertPlantLinkedSpeciesExistsService` injection and
      call; pass the two new VOs to the builder directly.
- [ ] 3.12 Update `application/commands/update-plant/update-plant.handler.ts`
      (+ spec): same shape update as 3.11 (inspect current handler content at
      apply time — same mechanical pattern).
- [ ] 3.13 Update `application/services/read/enrich-plant-with-qr/enrich-plant-with-qr.service.ts`
      (+ spec): replace `withPlantSpeciesId`/`withSpecies` builder calls with
      `withGbifSpeciesKey`/`withSpeciesScientificName`, passed through
      unchanged from the input view model.
- [ ] 3.14 Update `infrastructure/persistence/typeorm/entities/plant.entity.ts`:
      drop `plant_species_id` column; add `gbif_species_key` (int, nullable),
      `species_scientific_name` (varchar 300, nullable).
- [ ] 3.15 Update `infrastructure/persistence/typeorm/mappers/plant-typeorm.mapper.ts`
      (+ spec): field mapping swap both directions.
- [ ] 3.16 Update GraphQL: `transport/graphql/dtos/requests/plant/plant-create.request.dto.ts`,
      `plant-update.request.dto.ts` (field swap);
      `transport/graphql/dtos/responses/plant/plant.response.dto.ts` (remove
      `plantSpeciesId`/`species`/`PlantLinkedSpeciesResponseDto`, add
      `gbifSpeciesKey`, `speciesScientificName` as plain `@Field()`s);
      `transport/graphql/mappers/plant/plant.mapper.ts` (+ spec) field swap.
- [ ] 3.17 Update REST: `transport/rest/dtos/create-plant.dto.ts`,
      `update-plant.dto.ts`, `plant-rest-response.dto.ts`,
      `transport/rest/mappers/plant/plant.mapper.ts` (+ spec) field swap.
- [ ] 3.18 Update MCP: `transport/mcp/schemas/plant-create.schema.ts`,
      `plant-update.schema.ts` field swap.
- [ ] 3.19 Update `transport/graphql/enums/plant/plant-queryable-field.enum.ts`
      and `transport/graphql/registries/plant-filterable-fields.registry.ts`
      (+ spec): remove `plantSpeciesId` from queryable/filterable fields.
- [ ] 3.20 Update `plants.module.ts`: remove
      `PlantSpeciesAdapter`/`PLANT_SPECIES_PORT` binding,
      `AssertPlantLinkedSpeciesExistsService`,
      `EnrichPlantWithSpeciesService`, `PlantSpeciesBuilder`,
      `PlantSpeciesResolvedFieldResolver` from their respective provider
      arrays.
- [ ] 3.21 Update `src/contexts/plants/README.md` to reflect the new fields
      (per `openspec/config.yaml` apply rule: README must reflect current
      state, not just the delta).
- [ ] 3.22 Update `test/integration/plants/*.integration-spec.ts` and
      `test/e2e/plants/plants-rest.e2e-spec.ts` (and the GraphQL e2e
      equivalent, if one exists) for the field swap.

## Phase 4: Update `planting-spots` Mirror (PR 1)

- [ ] 4.1 Update `domain/interfaces/planting-spot-plant.interface.ts`,
      `domain/primitives/planting-spot-plant.primitives.ts`,
      `domain/aggregates/planting-spot-plant.aggregate.ts` (+ spec),
      `domain/builders/planting-spot-plant.builder.ts` (+ spec),
      `domain/view-models/planting-spot-plant.view-model.ts`: replace
      `plantSpeciesId` with `gbifSpeciesKey`/`speciesScientificName` (decide
      VO vs. local-primitive representation consistent with existing style —
      the interface currently uses `UuidValueObject`, so use
      `NumberValueObject`/`StringValueObject` equivalents; primitives/view-model
      stay plain `number | null` / `string | null`).
- [ ] 4.2 Update `infrastructure/adapters/planting-spot-plants.adapter.ts`:
      builder call site sources `plant.gbifSpeciesKey ?? null` /
      `plant.speciesScientificName ?? null`.
- [ ] 4.3 Update `transport/graphql/dtos/responses/planting-spot.response.dto.ts`
      and `transport/graphql/mappers/planting-spot/planting-spot.mapper.ts`
      field swap.
- [ ] 4.4 Update `src/contexts/planting-spots/README.md` if it documents
      this mirrored field.

## Phase 5: New `plant-species-search` Context (PR 2)

- [ ] 5.1 Scaffold `src/contexts/plant-species-search/` per `design.md` §6.4
      file map.
- [ ] 5.2 Create `application/ports/gbif-species-search.port.ts`
      (`GBIF_SPECIES_SEARCH_PORT` Symbol, `IGbifSpeciesSearchPort`).
- [ ] 5.3 Create `application/queries/gbif-species-search/gbif-species-search.query.ts`
      + `.handler.ts` + `.handler.spec.ts` (mock port: happy path, empty
      result, limit clamping).
- [ ] 5.4 Create `domain/view-models/gbif-species-suggestion.view-model.ts`
      (`GbifSpeciesSuggestionViewModel`, plain shape, not `BaseViewModel`).
- [ ] 5.5 Create `infrastructure/adapters/gbif/types/gbif-suggest-api.types.ts`
      (raw GBIF `/species/suggest` response types).
- [ ] 5.6 Create `infrastructure/adapters/gbif-species-suggest.adapter.ts`
      (`GbifSpeciesSuggestAdapter`, `HttpService`, 5s timeout,
      try/catch → `[]` + warn log on any failure, filters malformed entries)
      + `.spec.ts` (happy path, timeout, network error, malformed entry).
- [ ] 5.7 Create GraphQL transport: `transport/graphql/dtos/requests/gbif-species-search.request.dto.ts`,
      `transport/graphql/dtos/responses/gbif-species-suggestion.response.dto.ts`,
      `transport/graphql/mappers/gbif-species-suggestion.mapper.ts` (+ spec),
      `transport/graphql/resolvers/gbif-species-search-queries.resolver.ts`
      (+ spec, `JwtAuthGuard`, `QueryBus` only).
- [ ] 5.8 Create REST transport: `transport/rest/controllers/gbif-species-search.controller.ts`
      (+ spec), `transport/rest/dtos/gbif-species-suggestion-rest-response.dto.ts`.
- [ ] 5.9 Create MCP transport: `transport/mcp/schemas/gbif-species-search.schema.ts`,
      `transport/mcp/tools/gbif-species-search.tool.ts` implementing
      `IMcpTool<IMcpToolContext>`, tool name `gbif_species_search`.
- [ ] 5.10 Create `plant-species-search.module.ts`: import `HttpModule`;
      group providers into `QUERY_HANDLERS`, `INFRASTRUCTURE_ADAPTERS`,
      `TRANSPORT_PROVIDERS`, `MCP_TOOLS` per module-wiring convention; import
      `CqrsModule`.
- [ ] 5.11 Register `PlantSpeciesSearchModule` in `CONTEXT_MODULES`
      (`src/contexts/contexts.module.ts`).
- [ ] 5.12 Create `src/contexts/plant-species-search/README.md` (follow the
      `auth` context README as template, per `openspec/config.yaml`).
- [ ] 5.13 Create `test/e2e/plant-species-search/*.e2e-spec.ts` covering all
      three transports (REST, GraphQL, MCP tool) — happy path, empty result,
      unauthenticated rejection. No integration spec needed (no DB/tenant
      boundary to test — flag in the PR why this layer is skipped, per
      `openspec/config.yaml` apply rule).

## Phase 6: Verification (both PRs)

- [ ] 6.1 `pnpm lint` clean.
- [ ] 6.2 `pnpm tsc --noEmit` (or `pnpm build`) clean — this is the fastest
      way to catch any remaining reference to a deleted `plant-species`
      symbol across the whole repo.
- [ ] 6.3 `pnpm test` — full unit suite green.
- [ ] 6.4 `pnpm test:integration` — where Postgres is available.
- [ ] 6.5 `pnpm test:e2e` — where Postgres is available.
- [ ] 6.6 `pnpm test:cov` — confirm coverage threshold (80%) still met.
- [ ] 6.7 Grep the whole repo for `plant-species` / `PlantSpecies` /
      `PLANT_SPECIES` (excluding `plant-species-search`) to confirm zero
      remaining references outside this change's own artifacts and the
      archived `openspec/changes/archive/` history (which stays as historical
      record, not touched).
