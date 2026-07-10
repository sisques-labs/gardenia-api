# Design: Remove plant-species catalog, add live GBIF species search

**Change**: `gbif-species-search`
**Issue**: GDN-35
**Status**: designed
**Artifact store**: openspec
**Architecture**: DDD + CQRS + Hexagonal (NestJS, `@sisques-labs/nestjs-kit`)

---

## 1. Scope recap (authoritative)

| Context | Change |
|---|---|
| `plant-species` | **deleted entirely** — domain, application, infrastructure, transport, DB table, migrations' end-state (via a new forward migration; historical migration files are NOT rewritten) |
| `plants` | `plantSpeciesId` (UUID FK VO) → `gbifSpeciesKey` (number, nullable) + `speciesScientificName` (string, nullable, max 300). Cross-context port/adapter/resolver/assert-service to the old catalog removed. |
| `planting-spots` | `PlantingSpotPlant` read-model mirror: same field swap as `plants` |
| `plant-species-search` (new) | One query (`GbifSpeciesSearchQuery`), one port, one GBIF adapter (`/species/suggest`), REST + GraphQL + MCP. No aggregate, no repository, no persistence. |

---

## 2. Architecture approach

### 2.1 Why a new context instead of folding search into `plants`
`plants` already imports zero external HTTP APIs. Bolting a GBIF HTTP adapter
directly into it would mix "persist a plant" concerns with "proxy an external
search API" concerns in one module. The codebase's existing granularity
(`plant-photos`, `planting-spots`, `qr` are all separate single-purpose
contexts) supports splitting this out. `plant-species-search` has no aggregate
and no repository — it is a thin CQRS query slice, which is a deliberate,
documented deviation from the full bounded-context template (see §5).

### 2.2 Layering for the new search query (the only new flow)

```
GraphQL/REST/MCP entry point
        │  QueryBus.execute(new GbifSpeciesSearchQuery({ name, limit }))
        ▼
GbifSpeciesSearchQueryHandler        (application)
        │  port.suggest(name, limit)
        ▼
IGbifSpeciesSearchPort                (application/ports — interface + Symbol)
        ▲ implemented by
GbifSpeciesSuggestAdapter             (infrastructure/adapters)
        │  HttpService (GET api.gbif.org/v1/species/suggest)
        ▼
   GBIF REST API
```

The handler depends on the port Symbol + interface only, never on Axios or
GBIF response shapes — matching the existing `PLANT_SPECIES_ENRICHMENT_PORT` /
`GbifPlantSpeciesEnrichmentAdapter` precedent (that adapter is deleted along
with the rest of `plant-species`, but the pattern it established is reused
here).

### 2.3 Layering for `Plant.gbifSpeciesKey` / `Plant.speciesScientificName`
No new flow — these are two more plain fields on `PlantAggregate`, following
the exact pattern already used for `Plant.imageUrl`: nullable `StringValueObject`
(scientificName) / nullable `NumberValueObject` (gbifSpeciesKey) subclasses,
constructed in `CreatePlantCommand`/`UpdatePlantCommand`, no cross-context call
on write.

---

## 3. ADR-001 — Delete `plant-species` outright (no deprecation window)

**Decision**: Remove `src/contexts/plant-species/` entirely in this change,
not behind a flag, not left-but-unwired.

**Context**: The bounded context is fully merged (CRUD, import, enrich) and
referenced by `plants` (species lookup) and, transitively, by
`planting-spots` (mirrors `plantSpeciesId`). GDN-35's acceptance criteria are
explicit that no species data is persisted locally — a "local species table"
and "no local storage" cannot coexist.

**Rejected alternatives**:
- **Keep the module, stop wiring it**: leaves dead code, a live DB table, and
  three unused transport surfaces (REST/GraphQL/MCP) that would need a comment
  explaining why they're orphaned. Confirmed with the user as explicitly not
  wanted (destructive removal is the chosen option).
- **Feature-flag the switch**: unnecessary — there is no rollout population to
  stage for; this is a pre-production catalog with no external consumers found
  in-repo (proposal open question #3).

**Consequence**: every cross-context reference enumerated in §6 must be
removed in the same PR, or the build breaks. This is mechanical but wide.

---

## 4. ADR-002 — `Plant` owns its species as two plain fields, not a re-fetched FK

**Decision**: `Plant.gbifSpeciesKey: number | null` and
`Plant.speciesScientificName: string | null` are stored directly on the
`plants` table. No table joins, no live GBIF call on read.

**Context**: GDN-35 AC2 says "no species name or metadata returned by GBIF is
persisted/stored locally." Read literally, this would mean `Plant` shouldn't
even remember which species it was linked to without re-querying GBIF on every
read (list, detail). That would make every plant list render an N-call
fan-out to a third-party API — fragile (a GBIF outage breaks the plant list)
and slow.

**Decision rationale**:
- `speciesScientificName` is not a **catalog** — it's the plant's own chosen
  label, exactly like `Plant.imageUrl` is the plant's own chosen image (also a
  plain denormalized string, not a row in an `images` table). Nothing here is
  *reusable* or *searchable as a catalog*; it's one plant's attribute.
- `gbifSpeciesKey` is kept alongside the name so a future feature (e.g. "look
  up more detail for this plant's species") has a stable external identifier
  to call GBIF with on demand — again, on demand, not persisted-and-served.
- This interpretation is flagged as an open question in the proposal so the
  user can veto it; it is the recommended reading and the one implemented
  here.

**Rejected alternative**: store only `gbifSpeciesKey`, resolve
`speciesScientificName` live on every read via a `/species/{key}` call.
Rejected — turns every plant-list render into a live external dependency;
violates "reasonable handling of GBIF errors/timeouts" (AC4) far more than
storing a plain string ever could.

---

## 5. ADR-003 — No existence/validation call on `CreatePlant`/`UpdatePlant`

**Decision**: `CreatePlantCommandHandler` and `UpdatePlantCommandHandler` do
**not** call GBIF, and do not call any local "assert species exists" service,
when a `gbifSpeciesKey`/`speciesScientificName` pair is submitted. They are
stored as given.

**Context**: The old flow validated `plantSpeciesId` against the local catalog
before persisting (`AssertPlantLinkedSpeciesExistsService` → cross-context
`IPlantSpeciesPort`). With the catalog gone, the only way to "validate" a
submitted species would be to call GBIF synchronously on every plant write —
reintroducing a mandatory external dependency on the write path.

**Decision rationale**: the client only ever gets a `gbifSpeciesKey` +
`scientificName` pair from the new `plant-species-search` query, which itself
just talked to GBIF. Re-validating it a few seconds later on submit adds
latency and a new failure mode (GBIF down → can't save a plant) without a
correctness benefit worth the coupling. This mirrors how `Plant.imageUrl` is
never validated as "a real reachable image" either.

**Consequence**: `AssertPlantLinkedSpeciesExistsService`,
`PlantLinkedSpeciesNotFoundException`, `IPlantSpeciesPort`,
`PlantSpeciesAdapter`, and `PlantSpeciesResolvedFieldResolver` are all deleted,
not adapted — they existed solely to serve this validation + the read-side
`species` resolved field, both of which no longer apply.

---

## 6. Component & file map

### 6.1 Deleted outright

- `src/contexts/plant-species/` — entire directory (see the earlier repo scan
  for the full ~110-file list; not re-enumerated here).
- `test/integration/plant-species/`, `test/e2e/plant-species/` — entire dirs.
- `src/contexts/plants/application/ports/plant-species.port.ts`
- `src/contexts/plants/infrastructure/adapters/plant-species.adapter.ts` (+ spec)
- `src/contexts/plants/domain/builders/plant-species.builder.ts` (+ spec) — the
  `plants`-local mirror builder for the (now nonexistent) resolved species view.
- `src/contexts/plants/domain/view-models/plant-species.view-model.ts`
- `src/contexts/plants/domain/primitives/plant-species-view-model.primitives.ts`
- `src/contexts/plants/application/services/read/enrich-plant-with-species/` (+ spec)
- `src/contexts/plants/application/services/write/assert-plant-linked-species-exists/` (+ spec)
- `src/contexts/plants/domain/exceptions/plant-linked-species-not-found.exception.ts`
- `src/contexts/plants/domain/value-objects/plant-linked-species-id/` (+ spec)
- `src/contexts/plants/domain/events/field-changed/plant-species-id-changed/`
- `src/contexts/plants/transport/graphql/resolvers/plant/plant-species-resolved-field.resolver.ts` (+ spec)
- `PlantLinkedSpeciesResponseDto` (in `plant.response.dto.ts`)

### 6.2 `plants` context — modified

**Domain**
- New VOs: `domain/value-objects/plant-gbif-species-key/plant-gbif-species-key.value-object.ts`
  (`PlantGbifSpeciesKeyValueObject`, extends `NumberValueObject`, nullable,
  integer, positive) and
  `domain/value-objects/plant-species-scientific-name/plant-species-scientific-name.value-object.ts`
  (`PlantSpeciesScientificNameValueObject`, extends `StringValueObject`,
  nullable, max 300, trimmed).
- New events under `domain/events/field-changed/`:
  `plant-gbif-species-key-changed/plant-gbif-species-key-changed.event.ts`
  (`PlantGbifSpeciesKeyChangedEvent`) and
  `plant-species-scientific-name-changed/plant-species-scientific-name-changed.event.ts`
  (`PlantSpeciesScientificNameChangedEvent`) — replace
  `plant-species-id-changed`.
- `interfaces/plant.interface.ts`: remove `plantSpeciesId`; add
  `gbifSpeciesKey: PlantGbifSpeciesKeyValueObject | null`,
  `speciesScientificName: PlantSpeciesScientificNameValueObject | null`.
- `primitives/plant.primitives.ts`: remove `plantSpeciesId: string | null`; add
  `gbifSpeciesKey: number | null`, `speciesScientificName: string | null`.
- `aggregates/plant.aggregate.ts`: remove `_plantSpeciesId` +
  `changePlantSpeciesId()`; add `_gbifSpeciesKey`, `_speciesScientificName` +
  `changeGbifSpeciesKey()`, `changeSpeciesScientificName()`; update
  constructor, `update()`, `toPrimitives()`, getters.
- `builders/plant.builder.ts`: `withPlantSpeciesId` → `withGbifSpeciesKey` +
  `withSpeciesScientificName`.
- `view-models/plant.view-model.ts`: remove `plantSpeciesId`/`species`; add
  `gbifSpeciesKey: number | null`, `speciesScientificName: string | null`.

**Application**
- `commands/create-plant/create-plant.command.ts` /
  `commands/update-plant/update-plant.command.ts`: replace `plantSpeciesId?`
  with `gbifSpeciesKey?: number | null`, `speciesScientificName?: string | null`.
- `commands/create-plant/create-plant.handler.ts`: remove the
  `assertPlantLinkedSpeciesExistsService` call and DI; construct the two new
  VOs directly onto the builder (per ADR-003).
- `commands/update-plant/update-plant.handler.ts`: same shape update (verify
  current content at apply time — not re-read in this design pass, same
  mechanical pattern as create).
- `services/read/enrich-plant-with-qr/enrich-plant-with-qr.service.ts`: no
  behavior change, but its builder call site drops the
  `withPlantSpeciesId`/`withSpecies` calls it currently makes when
  reconstructing a `PlantViewModel` (replace with the two new `with*` calls,
  passing through unchanged from the input view model).

**Infrastructure**
- `entities/plant.entity.ts`: drop `plant_species_id` column (+ FK/index if
  present); add `gbif_species_key int NULL`,
  `species_scientific_name varchar(300) NULL`.
- `mappers/plant-typeorm.mapper.ts`: field mapping swap, both directions.
- New migration (see §7).

**Transport**
- GraphQL: `plant-create.request.dto.ts` / `plant-update.request.dto.ts`
  replace `plantSpeciesId` with `gbifSpeciesKey?: number`,
  `speciesScientificName?: string`. `plant.response.dto.ts`: remove
  `plantSpeciesId`/`species` (and the now-unused
  `PlantLinkedSpeciesResponseDto`), add `gbifSpeciesKey: number | null`,
  `speciesScientificName: string | null` as plain scalar `@Field()`s (no
  resolver needed — no more resolved/joined field). `plant.mapper.ts`
  (GraphQL) + `plant.mapper.ts` (REST): field swap.
- REST: `create-plant.dto.ts`, `update-plant.dto.ts`,
  `plant-rest-response.dto.ts`: same field swap, `@ApiPropertyOptional`.
- MCP: `plant-create.schema.ts`, `plant-update.schema.ts`: Zod field swap.
- `transport/graphql/enums/plant/plant-queryable-field.enum.ts` +
  `transport/graphql/registries/plant-filterable-fields.registry.ts` (+ spec):
  remove `plantSpeciesId` from the queryable/filterable set. Adding
  `gbifSpeciesKey`/`speciesScientificName` as filterable is **not required**
  by GDN-35 — left out unless the tasks phase finds an existing UI need
  (none identified).

### 6.3 `planting-spots` context — modified

`PlantingSpotPlant` is a read-model built by `PlantingSpotPlantsAdapter` from
`PlantFindByCriteriaQuery` results, mirroring a subset of `Plant`'s fields for
display inside a planting spot. Same field swap, no new concepts:

- `domain/interfaces/planting-spot-plant.interface.ts`: `plantSpeciesId:
  UuidValueObject | null` → `gbifSpeciesKey: NumberValueObject | null`,
  `speciesScientificName: StringValueObject | null` (or reuse `plants`'
  VOs if the cross-context boundary rule allows importing a VO type directly —
  confirm at apply time; if not, define local equivalents, matching the
  existing pattern where `planting-spot-plant` already re-declares plant
  fields locally rather than importing `plants` domain types).
- `domain/primitives/planting-spot-plant.primitives.ts`: same swap (primitive
  types: `number | null`, `string | null`).
- `domain/aggregates/planting-spot-plant.aggregate.ts`: same swap.
- `domain/builders/planting-spot-plant.builder.ts`: `withPlantSpeciesId` →
  `withGbifSpeciesKey` + `withSpeciesScientificName`.
- `domain/view-models/planting-spot-plant.view-model.ts`: same swap.
- `infrastructure/adapters/planting-spot-plants.adapter.ts`: update the
  builder call site to pass `plant.gbifSpeciesKey ?? null` /
  `plant.speciesScientificName ?? null` instead of `plant.plantSpeciesId`.
- `transport/graphql/dtos/responses/planting-spot.response.dto.ts` +
  `transport/graphql/mappers/planting-spot/planting-spot.mapper.ts`: same
  field swap.

### 6.4 `plant-species-search` context — new

```
src/contexts/plant-species-search/
├── application/
│   ├── ports/gbif-species-search.port.ts
│   │     GBIF_SPECIES_SEARCH_PORT (Symbol)
│   │     IGbifSpeciesSearchPort { suggest(name, limit): Promise<GbifSpeciesSuggestion[]> }
│   └── queries/gbif-species-search/
│         gbif-species-search.query.ts   (GbifSpeciesSearchQuery: { name: string; limit?: number })
│         gbif-species-search.handler.ts (GbifSpeciesSearchQueryHandler)
│         gbif-species-search.handler.spec.ts
├── domain/
│   └── view-models/gbif-species-suggestion.view-model.ts
│         GbifSpeciesSuggestionViewModel { gbifKey: number; scientificName: string }
│         (NOT a BaseViewModel subclass — no id/createdAt/updatedAt; this is
│         an external passthrough shape, documented deviation, see §7 below)
├── infrastructure/
│   └── adapters/
│         gbif-species-suggest.adapter.ts   (GbifSpeciesSuggestAdapter, HttpService)
│         gbif-species-suggest.adapter.spec.ts
│         gbif/types/gbif-suggest-api.types.ts  (raw GBIF response shape)
├── transport/
│   ├── graphql/
│   │   ├── dtos/
│   │   │   ├── requests/gbif-species-search.request.dto.ts
│   │   │   └── responses/gbif-species-suggestion.response.dto.ts
│   │   ├── mappers/gbif-species-suggestion.mapper.ts
│   │   └── resolvers/gbif-species-search-queries.resolver.ts
│   ├── rest/
│   │   ├── controllers/gbif-species-search.controller.ts
│   │   └── dtos/gbif-species-suggestion-rest-response.dto.ts
│   └── mcp/
│       ├── schemas/gbif-species-search.schema.ts
│       └── tools/gbif-species-search.tool.ts
├── README.md
└── plant-species-search.module.ts
```

**No repository, no entity, no mapper-to-DB** — nothing here touches
persistence. Registered in `CONTEXT_MODULES`
(`src/contexts/contexts.module.ts`) like every other context.

**Deviation from the standard template, called out explicitly** (per
`architecture` skill's structure, which assumes an aggregate): no
`domain/aggregates/`, no `domain/builders/`, no `domain/repositories/`, no
`infrastructure/persistence/`. This context has no state to own — it is a
stateless CQRS query slice over an external API, same shape as the
enrichment/import adapters that already existed in the (now deleted)
`plant-species` context, minus the write side.

**Auth**: same `JwtAuthGuard` as every other authenticated query in this repo
(confirm at apply time whether `SpaceContext`/`X-Space-ID` is required — this
query is not tenant-scoped, so it should NOT require `X-Space-ID`, matching
how the old `plant-species` catalog also required JWT-only, no space header).

---

## 7. ADR-004 — GBIF endpoint: `/species/suggest`, not `/species/search`

**Decision**: Use `GET https://api.gbif.org/v1/species/suggest?q={name}&limit={limit}`.

**Context**: The already-deleted `plant-species` import adapter used
`/species/search` (heavier — full facet/filter support, pagination, richer
per-result payload) for bulk catalog import. `/species/suggest` is GBIF's
purpose-built lightweight typeahead endpoint: smaller payload, tuned for
low-latency interactive search, and does not require the
`highertaxon_key`/`status` filter dance the old import adapter needed.
Confirmed with the user (recommended and accepted).

**Call shape**:
```
GET /v1/species/suggest?q={name}&limit={limit}&rank=SPECIES
```
Response: `Array<{ key: number; scientificName?: string; canonicalName?: string; rank?: string; status?: string; ... }>`
(unauthenticated array response, not the paginated `{results: [...]}` envelope
`/species/search` uses).

Mapping: `gbifKey = item.key`, `scientificName = (item.canonicalName ??
item.scientificName ?? '').trim()`; drop entries with no name or missing key
(same defensive pattern the deleted import adapter used).

**Error handling (AC4)**: adapter wraps the HTTP call in `try/catch` with a
5s timeout (matching the existing `REQUEST_TIMEOUT_MS` convention from the
deleted adapter); on any failure (timeout, 4xx/5xx, network error), log a
warning and return `[]` — never throw out of the adapter. The query handler
and resolver/controller/tool see an empty array, not an error, on GBIF
failure — the client renders "no results" rather than a crash or 500.

**Limit**: `limit` optional input, default 10, clamped server-side to a max
of 20 (avoid a client asking for an unbounded result set from GBIF).

---

## 8. Data flow summary

**Search (new)**: client keystroke (debounced client-side) →
REST/GraphQL/MCP entry point → `GbifSpeciesSearchQuery({ name, limit })` →
`GbifSpeciesSearchQueryHandler` → `IGbifSpeciesSearchPort.suggest()` →
`GbifSpeciesSuggestAdapter` → GBIF `/species/suggest` → mapped
`GbifSpeciesSuggestionViewModel[]` → response DTOs. Nothing persisted at any
step.

**Create/update plant (modified)**: resolver/controller/tool → command with
`gbifSpeciesKey?`, `speciesScientificName?` → handler constructs the two VOs
directly (no external or cross-context call) → aggregate → save → events →
mapper → DB columns `gbif_species_key`, `species_scientific_name`.

**Planting-spot plant listing (modified)**: `PlantingSpotPlantsAdapter` →
`PlantFindByCriteriaQuery` → maps `plant.gbifSpeciesKey` /
`plant.speciesScientificName` straight through onto
`PlantingSpotPlantViewModel` — no additional lookups (same as before, just
different field names).

---

## 9. Migration strategy

Single new migration, `1780000000015-RemovePlantSpeciesCatalog.ts` (or next
free sequential timestamp — confirm the actual next timestamp at apply time
against `src/database/migrations/`):

```sql
-- 1. Backfill the plant's own scientific-name column from the catalog
--    while both still exist, best-effort (NULL where no link existed).
ALTER TABLE "plants" ADD COLUMN "species_scientific_name" character varying(300);
ALTER TABLE "plants" ADD COLUMN "gbif_species_key" integer;

UPDATE "plants" p
SET "species_scientific_name" = ps."scientific_name"
FROM "plant_species" ps
WHERE p."plant_species_id" = ps."id";

-- 2. Drop the old FK column and the catalog table.
ALTER TABLE "plants" DROP CONSTRAINT IF EXISTS "FK_plants_plant_species_id"; -- confirm real constraint name at apply time
ALTER TABLE "plants" DROP COLUMN "plant_species_id";
DROP TABLE "plant_species";
```

`down()`: re-creates an **empty** `plant_species` table matching its
pre-drop shape (id, scientific_name, description, image_url, timestamps) and
re-adds `plant_species_id uuid NULL` to `plants` (FK not restored — nothing to
point to); drops `gbif_species_key`/`species_scientific_name`. Explicitly
documented in the migration file's `down()` docstring that this restores
**schema only**, not data (see proposal §3 rollback plan).

**Risk carried over from the risk register of the original enrich change**:
verify the actual FK/constraint name on `plants.plant_species_id` in the live
schema before finalizing the `DROP CONSTRAINT` statement (same caution the
`plant-species-enrich` design doc flagged for its own rename).

---

## 10. Risks & assumptions

1. **Data loss on `gbifSpeciesKey`** — cannot be backfilled (old catalog never
   stored a GBIF key); all pre-existing plants start with `gbifSpeciesKey:
   null` even if they had a linked species name. Accepted per proposal §3.
2. **Destructive migration** — `DROP TABLE plant_species` is irreversible;
   mitigated by recommending a backup immediately before running it (proposal
   §3), not by the migration itself.
3. **Wide mechanical blast radius** — three contexts touched
   (`plant-species` deleted, `plants` + `planting-spots` modified) plus one
   new context. Mechanical but not conceptually hard; the tasks phase should
   phase it as two chained PRs (proposal §4) to keep review load sane.
4. **GBIF `/species/suggest` shape** — confirm exact response fields against
   a live call during implementation; the adapter must defensively handle
   missing `canonicalName`/`scientificName`/`key` per §7.
5. **`planting-spots` VO reuse question** (§6.3) — decide at apply time
   whether to import `plants`' new VOs directly or re-declare local
   equivalents; the existing code already re-declares rather than imports
   (no cross-context domain import per the hexagonal boundary rule in
   `openspec/config.yaml`), so re-declaring is the consistent choice unless
   tasks phase finds a reason to deviate.
