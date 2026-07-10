# Design: Trim plant-species, add live GBIF search + find-or-create link

**Change**: `gbif-species-search`
**Issue**: GDN-35
**Status**: designed
**Artifact store**: openspec
**Architecture**: DDD + CQRS + Hexagonal (NestJS, `@sisques-labs/nestjs-kit`)

---

## 1. Scope recap (authoritative)

| Context | Change |
|---|---|
| `plant-species` | Trim to `scientificName` + `gbifKey`; drop `description`/`imageUrl` + enrich/import; add `GbifSpeciesSearchQuery` (live, non-persisting) and `FindOrCreatePlantSpeciesByGbifKeyCommand` |
| `plants` | No aggregate/schema change. `CreatePlantCommand`/`UpdatePlantCommand` accept `gbifSpeciesKey`+`speciesScientificName` instead of `plantSpeciesId`; handler resolves via the port's new `findOrCreateByGbifKey`. Resolved `species` field keeps its nested shape, trimmed content. |
| `planting-spots` | No change. |

---

## 2. Architecture approach

### 2.1 Why the search query lives inside `plant-species`, not a new context
The earlier draft split search into its own bounded context because
`plant-species` was being deleted. Since it's being kept, the search query is
just one more query slice inside an existing context that already owns
everything species-related — no reason to fragment it. `GbifSpeciesSearchQuery`
sits alongside `PlantSpeciesFindByIdQuery`/`PlantSpeciesFindByCriteriaQuery` in
`application/queries/`.

### 2.2 Two different "GBIF adapters" with two different jobs
- `GbifSpeciesSuggestAdapter` (new) — `/species/suggest`, read-only, used
  **only** by `GbifSpeciesSearchQuery`. Never writes anything.
- The old `GbifPlantSpeciesImportAdapter`/`GbifPlantSpeciesEnrichmentAdapter`
  are deleted — bulk import and description/image enrichment no longer exist
  as concepts.

There is deliberately no adapter that resolves a `gbifKey` back to
authoritative GBIF data at write time — `FindOrCreatePlantSpeciesByGbifKey`
trusts the `gbifKey`/`scientificName` pair the client already got from a live
search a moment earlier (same "don't re-validate against the source of truth
on the write path" rationale the earlier draft used for `plants`, still
correct here).

### 2.3 Linking flow (the one genuinely new flow)

```
Client (web) already has { gbifSpeciesKey, scientificName } from a live
GbifSpeciesSearchQuery result
        │
        ▼
CreatePlantCommand { name, gbifSpeciesKey?, speciesScientificName?, ... }
        │
        ▼
CreatePlantCommandHandler (plants)
        │  if gbifSpeciesKey present:
        │    IPlantSpeciesPort.findOrCreateByGbifKey(gbifSpeciesKey, speciesScientificName)
        ▼
PlantSpeciesAdapter (plants/infrastructure — existing file, gains one method)
        │  CommandBus.execute(FindOrCreatePlantSpeciesByGbifKeyCommand)
        ▼
FindOrCreatePlantSpeciesByGbifKeyCommandHandler (plant-species)
        │  1. read repo: findByGbifKey(gbifKey)
        │  2. found?  → return { id }
        │     not found? → build + save PlantSpeciesAggregate, emit PlantSpeciesCreated, return { id }
        ▼
back to CreatePlantCommandHandler: plant.plantSpeciesId = returned id
```

This is a **cross-context command dispatch from an adapter**, same hexagonal
shape the codebase already uses for `PlantSpeciesAdapter.findByPlantSpeciesId`
→ `PlantSpeciesFindByIdQuery`. No new architectural pattern, just one more
method on an existing port/adapter pair.

---

## 3. ADR-001 — Keep the FK, upsert-on-link instead of denormalizing onto Plant

**Decision**: `Plant.plantSpeciesId` stays a FK into `plant_species`;
linking a plant to a GBIF pick triggers a find-or-create on the catalog,
not a copy of the species data onto the plant row.

**Context**: reconsidered from the earlier draft (which denormalized
`gbifSpeciesKey`/`speciesScientificName` directly onto `Plant` to avoid any
"catalog" existing at all). The user has decided to keep a (trimmed) catalog
table, which removes the motivation for denormalizing — once a catalog row
exists per distinct species, the FK is the natural, already-built mechanism
and requires zero changes to `plants`' schema, aggregate, or migrations.

**Consequence — must be found-or-created, not just found**: unlike the old
`AssertPlantLinkedSpeciesExistsService` (which required the row to already
exist, because the client used to pick from a browsable catalog), the client
now only ever has a raw GBIF pick with no local id. The link step must
therefore create the row on first use. Two plants linking the same species
(same `gbifKey`) converge on the same catalog row after the first is created
— this is the intended, natural deduplication `gbifKey` uniqueness gives us
for free.

**Rejected alternative**: keep `AssertPlantLinkedSpeciesExistsService`
unchanged and require a separate explicit "register this species in the
catalog" step before linking. Rejected — reintroduces exactly the manual
catalog-browsing UX GDN-35 is replacing with live search.

---

## 4. ADR-002 — Uniqueness moves from `scientificName` to `gbifKey`

**Decision**: `plant_species.gbif_key` is unique (partial index, `WHERE
gbif_key IS NOT NULL`, to tolerate legacy `NULL` rows); the old unique
constraint on `scientific_name` is dropped.

**Context**: with find-or-create keyed by `gbifKey`, that's the field whose
uniqueness actually matters for correct deduplication.
`scientificName` becomes purely descriptive.

**Rejected alternative**: keep both unique. Rejected — no real invariant
requires it, and GBIF taxonomy revisions occasionally produce edge cases
where a canonical name could coincide across keys; not worth a hard
constraint for this MVP.

---

## 5. ADR-003 — `gbif_key` is nullable at the DB level

**Decision**: `gbif_key integer NULL`, not `NOT NULL`.

**Context**: existing `plant_species` rows (created before this change, via
the old create/import flow) have no GBIF key and cannot be backfilled — GBIF
keys were never captured before. A `NOT NULL` constraint would require either
a fabricated placeholder value (bad) or a data migration attempting to
re-resolve every legacy row against `/species/match` during the migration
itself (fragile, slow, out of scope).

**Consequence**: application-level validation on `CreatePlantSpeciesCommand`
and `FindOrCreatePlantSpeciesByGbifKeyCommand` still requires `gbifKey` for
any *new* row (the VO itself is non-nullable in those write paths) — only
pre-existing legacy rows can show `gbifKey: null` on read.

---

## 6. Component & file map

### 6.1 `plant-species` — removed

- `domain/value-objects/plant-species-description/` (+ spec)
- `domain/value-objects/plant-species-image-url/` (+ spec)
- `domain/events/field-changed/plant-species-description-changed/`
- `domain/events/field-changed/plant-species-image-url-changed/`
- `application/commands/enrich-plant-species/` (+ spec)
- `application/commands/import-plant-species/` (+ spec)
- `application/ports/plant-species-import.port.ts`
- (the enrichment port, if named separately from the import port — confirm
  exact filename at apply time; both enrichment and import ports/adapters go)
- `infrastructure/adapters/gbif-plant-species-import.adapter.ts` (+ spec, +
  `gbif/types/gbif-api.types.ts` — replaced by a leaner suggest-only types
  file)
- Any enrich/import GraphQL mutations, REST endpoints, MCP tools, and their
  DTOs/schemas.

### 6.2 `plant-species` — modified

**Domain**
- `domain/value-objects/plant-species-scientific-name/`: keep, drop
  uniqueness semantics from its *usage* (uniqueness moves to gbifKey; the VO
  itself stays a simple length-validated string).
- New `domain/value-objects/plant-species-gbif-key/plant-species-gbif-key.value-object.ts`
  (`PlantSpeciesGbifKeyValueObject`, extends `NumberValueObject`, required,
  positive integer, in the aggregate's write paths — nullable only for
  legacy read reconstruction, see ADR-003).
- New `domain/events/field-changed/plant-species-gbif-key-changed/`
  (`PlantSpeciesGbifKeyChangedEvent`).
- `domain/interfaces/plant-species.interface.ts`,
  `domain/primitives/plant-species.primitives.ts`,
  `domain/aggregates/plant-species.aggregate.ts` (+ spec),
  `domain/builders/plant-species.builder.ts` (+ spec),
  `domain/view-models/plant-species.view-model.ts`: drop
  `description`/`imageUrl`; add `gbifKey`.
- `domain/exceptions/`: remove `plant-species-name-already-exists.exception.ts`
  (or repurpose — see below); add
  `plant-species-gbif-key-already-exists.exception.ts`
  (`PlantSpeciesGbifKeyAlreadyExistsException`).

**Application**
- `application/services/write/assert-plant-species-name-available/`: remove
  (name is no longer unique); add
  `application/services/write/assert-plant-species-gbif-key-available/`
  (+ spec) — used only by `CreatePlantSpeciesCommand` (manual create path);
  `FindOrCreatePlantSpeciesByGbifKeyCommand` does NOT use it (a hit on
  `findByGbifKey` there means "reuse," not "conflict").
- `application/commands/create-plant-species/`,
  `update-plant-species/` (+ specs): field swap
  (`description`/`imageUrl` → `gbifKey`).
- New `application/commands/find-or-create-plant-species-by-gbif-key/`:
  `find-or-create-plant-species-by-gbif-key.command.ts` (`{ gbifKey:
  number; scientificName: string }`),
  `.handler.ts` (`FindOrCreatePlantSpeciesByGbifKeyCommandHandler` — inject
  read + write repositories; `findByGbifKey` first, build+save+publish if
  absent, return `{ id }` either way), `.handler.spec.ts` (found path,
  not-found-so-created path, concurrent-creation race — document as a known,
  accepted small race window unless the tasks phase adds a DB-level
  `ON CONFLICT` upsert instead of read-then-write; recommend `ON CONFLICT
  (gbif_key) DO NOTHING RETURNING id` / fallback re-select at the repository
  level to close the race cleanly).
- New `application/ports/gbif-species-search.port.ts`
  (`GBIF_SPECIES_SEARCH_PORT`, `IGbifSpeciesSearchPort.suggest(name, limit)`).
- New `application/queries/gbif-species-search/gbif-species-search.query.ts`
  + `.handler.ts` + `.handler.spec.ts` — same shape as the earlier draft's
  design (unchanged: live passthrough, no persistence, `[]` on failure).
- Read repository: add `findByGbifKey(gbifKey: number): Promise<ViewModel |
  null>` alongside existing `findById`.
- `domain/repositories/write/plant-species-write.repository.ts`: confirm
  `save()` supports the upsert-ish find-or-create flow (likely already
  generic enough via `IBaseWriteRepository`).
- Update `transport/graphql/enums/plant-species-queryable-field.enum.ts` +
  `transport/graphql/registries/plant-species-filterable-fields.registry.ts`
  (+ spec): drop `description`/`imageUrl`, add `gbifKey`.

**Infrastructure**
- `infrastructure/persistence/typeorm/entities/plant-species.entity.ts`: drop
  `description`, `imageUrl` columns; add `gbifKey` (`gbif_key`, `int`,
  nullable, partial unique index); drop `@Unique` on `scientificName`.
- `infrastructure/persistence/typeorm/mappers/plant-species-typeorm.mapper.ts`
  (+ spec): field swap.
- `infrastructure/persistence/typeorm/repositories/plant-species-typeorm-read.repository.ts`:
  add `findByGbifKey`.
- New `infrastructure/adapters/gbif-species-suggest.adapter.ts` (+ spec, +
  `gbif/types/gbif-suggest-api.types.ts`): `/species/suggest`, 5s timeout,
  try/catch → `[]` + warn log on failure, drop malformed entries (same
  resilience contract as the earlier draft's design).

**Transport**
- GraphQL: trim `plant-species-create.request.dto.ts` /
  `-update.request.dto.ts` / `plant-species.response.dto.ts` (drop
  description/imageUrl, add gbifKey); remove `plant-species-enrich.request.dto.ts`
  and the import request/response DTOs; remove `enrichPlantSpecies` /
  `importPlantSpeciesFromGbif` mutations from
  `plant-species-mutations.resolver.ts`. New
  `transport/graphql/dtos/requests/gbif-species-search.request.dto.ts` +
  `.../responses/gbif-species-suggestion.response.dto.ts` +
  `transport/graphql/resolvers/gbif-species-search-queries.resolver.ts`
  (sibling to the existing `plant-species-queries.resolver.ts`).
- REST: trim `create-plant-species.dto.ts` / `update-plant-species.dto.ts` /
  `plant-species-rest-response.dto.ts`; add a search endpoint on
  `plant-species.controller.ts` (or a small sibling controller) — `GET
  /plant-species/search?name=&limit=`.
- MCP: trim `plant-species-create.schema.ts` / `-update.schema.ts`; remove
  `plant-species-enrich.schema.ts`/`.tool.ts` and
  `plant-species-import.schema.ts`/`.tool.ts`; add
  `gbif-species-search.schema.ts` + `.tool.ts` (`plant_species_search` or
  `gbif_species_search` — confirm final wire name at apply time, prefer
  entity-prefixed per convention: `plant_species_search`).
- `plant-species.module.ts`: remove enrichment/import port bindings and
  handlers from provider arrays; add the new command handler, query handler,
  adapter binding, and new transport providers.

### 6.3 `plants` — modified (small)

- `application/commands/create-plant/create-plant.command.ts` /
  `update-plant.command.ts`: replace `plantSpeciesId?: string` with
  `gbifSpeciesKey?: number`, `speciesScientificName?: string` (both required
  together — validate pairing in the command constructor or handler).
- `application/ports/plant-species.port.ts`: add
  `findOrCreateByGbifKey(gbifKey: number, scientificName: string):
  Promise<{ id: string }>` to `IPlantSpeciesPort`.
- `infrastructure/adapters/plant-species.adapter.ts` (+ spec): implement the
  new method, dispatching `FindOrCreatePlantSpeciesByGbifKeyCommand` via
  `CommandBus`.
- Remove `application/services/write/assert-plant-linked-species-exists/`
  (+ spec) — no longer "assert exists," now "ensure exists" via the port
  call directly in the handler (or a small new
  `application/services/write/resolve-plant-species-link/` wrapper service if
  the handler would otherwise get cluttered — apply-time call).
- `application/commands/create-plant/create-plant.handler.ts` /
  `update-plant/update-plant.handler.ts`: replace the assert-exists call with
  a call to `plantSpeciesPort.findOrCreateByGbifKey(...)` when both new
  fields are present, then pass the returned `id` to
  `withPlantSpeciesId(...)` exactly as before.
- `domain/builders/plant-species.builder.ts` (plants-local mirror),
  `domain/view-models/plant-species.view-model.ts`,
  `domain/primitives/plant-species-view-model.primitives.ts`: drop
  `description`/`imageUrl`, add `gbifKey`.
- `transport/graphql/dtos/requests/plant/plant-create.request.dto.ts` /
  `plant-update.request.dto.ts`: field swap (`plantSpeciesId` → the two new
  fields). `transport/graphql/dtos/responses/plant/plant.response.dto.ts`'s
  `PlantLinkedSpeciesResponseDto`: drop description/imageUrl, add `gbifKey`.
  `transport/graphql/mappers/plant/plant.mapper.ts` (+ spec): field swap.
- REST/MCP: same input/response field swap
  (`create-plant.dto.ts`/`update-plant.dto.ts`/`plant-rest-response.dto.ts`,
  `plant-create.schema.ts`/`plant-update.schema.ts`).
- **Unchanged, confirm no edit needed**: `PlantAggregate`,
  `plant.entity.ts`, `plant-typeorm.mapper.ts`, `PlantSpeciesResolvedFieldResolver`,
  `EnrichPlantWithSpeciesService` (its shape stays — just carries trimmed
  fields through), `plant.builder.ts`'s `withPlantSpeciesId` (still the
  correct method name — Plant's own field didn't rename).

### 6.4 `planting-spots` — no change.

---

## 7. Data flow summary

**Search (unchanged from earlier draft's design)**: client keystroke
(debounced) → REST/GraphQL/MCP → `GbifSpeciesSearchQuery` →
`IGbifSpeciesSearchPort.suggest()` → `GbifSpeciesSuggestAdapter` → GBIF
`/species/suggest` → mapped suggestions. Nothing persisted.

**Create/update plant with a species (new)**: resolver/controller/tool →
command with `gbifSpeciesKey?`, `speciesScientificName?` → handler → (if
present) `plantSpeciesPort.findOrCreateByGbifKey()` → cross-context command
dispatch → `plant_species` upsert-by-gbifKey → returned `id` → `Plant.plantSpeciesId`
set exactly as the pre-existing FK mechanism already does → save → events.

**Read a plant (unchanged mechanism, trimmed content)**:
`PlantSpeciesResolvedFieldResolver` → `IPlantSpeciesPort.findByPlantSpeciesId`
→ `PlantSpeciesFindByIdQuery` → mapped into the plants-local
`PlantSpeciesViewModel` (now just `{ gbifKey, scientificName }` plus
timestamps/id) → `PlantLinkedSpeciesResponseDto`.

---

## 8. Migration strategy

Single migration, `{next-timestamp}-TrimPlantSpeciesToGbif.ts`:

```sql
ALTER TABLE "plant_species" DROP COLUMN "description";
ALTER TABLE "plant_species" DROP COLUMN "image_url";
ALTER TABLE "plant_species" DROP CONSTRAINT "UQ_plant_species_scientific_name";
ALTER TABLE "plant_species" ADD COLUMN "gbif_key" integer;
CREATE UNIQUE INDEX "UQ_plant_species_gbif_key" ON "plant_species" ("gbif_key") WHERE "gbif_key" IS NOT NULL;
```

`down()`: drops the partial index and `gbif_key`; re-adds
`description`/`image_url` as nullable (data not restored — dropped columns
are gone); re-adds the `scientific_name` unique constraint (may fail if
duplicates accumulated in the meantime — documented risk, see proposal §3).

**Confirm at apply time**: the live name of the existing unique constraint on
`scientific_name` (established across the earlier `plant-species-module` and
`plant-species-enrich` migrations) before writing the `DROP CONSTRAINT`
statement — same caution flagged in prior migrations touching this table.

---

## 9. Risks & assumptions

1. **`description`/`imageUrl` data loss** — real data on any enriched catalog
   row is gone once this migration runs. Accepted per proposal §3.
2. **`gbif_key` can't be backfilled for legacy rows** — same category of gap
   as the earlier draft, now scoped to one nullable column instead of an
   entire dropped table.
3. **Find-or-create race** — two concurrent plant creations picking the same
   never-before-seen species could both miss on `findByGbifKey` and attempt
   to create — mitigate with `ON CONFLICT (gbif_key) DO NOTHING` + re-select,
   or accept the (rare, low-stakes) duplicate-row risk for the MVP; decide at
   tasks/apply time.
4. **`CreatePlantSpecies`/`UpdatePlantSpecies`/`DeletePlantSpecies` mutations'
   continued relevance** — kept per proposal's open question #1; revisit if
   product decides the manual path is dead weight.
5. **GBIF `/species/suggest` response shape** — verify against a live call
   during implementation, same as the earlier draft.
