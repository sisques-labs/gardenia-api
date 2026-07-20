# Design: PlantIdentification bounded context (PlantNet integration)

## Technical Approach

Mirror `plant-photos`' module shape (domain → application → infrastructure →
transport, CQRS, dual transport, tenant isolation via
`createTenantRepository`), since it is the closest existing precedent: a new
context that orchestrates `files` for byte storage and calls into `plants`
cross-context. `plant-identification` adds one more cross-context caller
(`plant-species`, read-only) that `plant-photos` didn't need.

`PlantIdentificationAggregate` is created once per `IdentifyPlant` call and
then only ever gains a `convertedToPlantId` (via `convertToPlant()`) — no
other field is ever edited after creation. Its two child collections
(submitted photos, PlantNet candidates) are fixed at creation time; neither
supports independent add/remove after the identification is persisted.

## Architecture Decisions

| Decision | Choice | Alternatives rejected | Rationale |
|----------|--------|------------------------|-----------|
| Search results not persisted to `plant_species` at identify time | `IdentifyPlant` calls `GbifSpeciesSearchQuery` (live, non-persisting) and stores the result **denormalized** on the identification (`resolvedGbifKey`/`resolvedScientificName`), not as a FK | Call `FindOrCreatePlantSpeciesByGbifKeyCommand` immediately, creating a catalog row for every identification | Most identifications will never become a tracked `Plant` (a user snapping a photo of a neighbor's rose is not necessarily building a personal catalog entry). Writing a `plant_species` row per identification would pollute the catalog with entries no `Plant` ever links to. Catalog writes happen exactly once, at the moment a `Plant` is actually created (`CreatePlantFromIdentification` → `plants`' own existing find-or-create), matching `gbif-species-search`'s own established rule: search is free, writes happen on link. |
| One PlantNet request per identification, not per photo | All submitted photos + organs go into a single `POST /v2/identify/{project}` call | One request per photo, merge results client-side | PlantNet's own API is designed to use multiple images/organs of the *same* plant to improve confidence in one scored result — splitting into N requests would produce N unrelated candidate lists instead of one better one, and would burn N times the daily quota for no benefit. |
| Confidence threshold gates auto-resolution | `resolvedGbifKey`/`resolvedScientificName` are only set when the top PlantNet candidate's score ≥ `PLANTNET_MIN_CONFIDENCE` (default `0.2`); below it, `status = 'no_match'`, candidates are still stored and shown, but `CreatePlantFromIdentification` is rejected | Always auto-resolve the top candidate regardless of score | An unconfident top guess (e.g. score `0.04` among 30 near-tied candidates) auto-creating a plant with the wrong species silently is worse than surfacing "we're not sure" and requiring the user to fall back to manual species search on the existing "add plant" flow (already built). |
| `IPlantsPort.createPlant()` reuses `CreatePlantCommand` unchanged | `CreatePlantFromIdentificationCommandHandler` calls the port with `{ name, gbifSpeciesKey, speciesScientificName, imageUrl, userId }` — the exact shape `CreatePlantCommand` already accepts | Duplicate plant-creation logic inside `plant-identification`, or have `plants` learn about identifications | `plants` already has everything needed (species linking via `findOrCreateByGbifKey` runs *inside* the handler this port calls) — no new capability is required on `plants`, only a new caller. Keeps the dependency one-directional: `plant-identification` knows about `plants`, `plants` never knows `plant-identification` exists. |
| Provider failure vs. "no plant recognized" are different outcomes | A PlantNet HTTP/network failure throws `PlantIdentificationProviderUnavailableException` (502) and does **not** persist a completed attempt (see below); a *successful* PlantNet call that returns zero/low-confidence candidates persists normally with `status: 'no_match'` | Treat every PlantNet failure the same as "no match" (swallow + return `[]`), like `GbifSpeciesSuggestAdapter`/`OpenMeteoAdapter` do | Those two existing adapters back *autocomplete/forecast* UX where silently degrading to empty is harmless. Here, a user who just uploaded photos and paid the (small) cost of an API call deserves to know whether PlantNet actually looked and found nothing, vs. the request never completed and should be retried. A `429` from PlantNet's quota is surfaced distinctly as `PlantIdentificationQuotaExceededException`. |
| Photos are uploaded (and kept) even on provider failure | Photos go through `IFilesPort.uploadFile()` *before* the PlantNet call; on provider failure the uploaded `File` rows are **not** rolled back, and no `PlantIdentificationAggregate` row is written for that failed attempt (the exception propagates, nothing to show in history) | Delete the uploaded files on failure | Same "don't do cross-context sagas/distributed rollbac, keep failure handling boring" convention `plant-photos` already established for `imageUrl` sync — file deletion on failure would be a second best-effort cross-context call for a low-value cleanup (an orphaned upload just sits unreferenced in `files`, same as any other failed multi-step flow in this codebase already tolerates). |
| `plantId`-style non-FK convention does **not** apply here | `PlantIdentificationAggregate` has no `plantId` at all pre-conversion; `convertedToPlantId`, once set, is likewise a plain field, not FK-checked | FK-check `convertedToPlantId` against `plants` | Consistent with the repo-wide convention (`care-log`, `plant-photos`) that cross-context references are plain fields, never DB-level FKs across bounded-context tables. |
| REST-only upload, GraphQL for everything else | `POST /api/plant-identifications` (multipart) creates; `GET`/GraphQL for history/detail; `createPlantFromIdentification` is a GraphQL mutation (no binary payload, so no REST-only constraint applies to it) | GraphQL `Upload` scalar | Matches `files`'/`plant-photos`' explicit, established convention. |
| Migration | Three tables in one migration, `1780000000025-CreatePlantIdentifications.ts` | One denormalized JSONB column for photos+candidates | Table-per-child-collection matches this codebase's existing normalized style (no JSONB blobs elsewhere for structured child data); also makes `PlantIdentificationFindByCriteria`'s sorting/filtering straightforward with plain SQL joins. |

## Data Flow

```
POST /api/plant-identifications (multipart: photos[] + organs[] + project?)
  │ (JwtAuthGuard + SpaceGuard, ALS SpaceContext set for the request)
  ▼
IdentifyPlantCommand ──CommandBus──> IdentifyPlantCommandHandler
  │
  ├─1─> for each photo: IFilesPort.uploadFile({filename, mimeType, size,
  │        content, userId, spaceId})  →  { id: fileId, url }
  │        (sequential or Promise.all — no ordering dependency between
  │         uploads; confirm at apply time)
  │
  ├─2─> IPlantNetIdentificationPort.identify(
  │        images: [{ content, mimeType, organ }], project
  │      )
  │        └─> PlantNetIdentificationAdapter ──HTTP──> PlantNet
  │              POST /v2/identify/{project}?api-key=...
  │        <── candidates: [{ scientificName, commonNames, score }, ...]
  │              (PlantNet already returns these sorted desc by score)
  │
  │        On HTTP failure/timeout → throw
  │        PlantIdentificationProviderUnavailableException (502); on 429 →
  │        PlantIdentificationQuotaExceededException (429). Neither persists
  │        an attempt — handler rethrows after logging, nothing is saved.
  │
  ├─3─> if candidates non-empty AND top.score >= PLANTNET_MIN_CONFIDENCE:
  │        IPlantSpeciesPort.search(top.scientificName, limit: 1)
  │          └─> PlantSpeciesAdapter ──QueryBus──> GbifSpeciesSearchQuery
  │                                                  (plant-species context)
  │        <── best GBIF match { gbifKey, scientificName } | []
  │        if a match came back: resolvedGbifKey/resolvedScientificName set
  │        from the GBIF match (not PlantNet's raw string — GBIF's canonical
  │        name is the one `plants`/`plant-species` understand)
  │        if GBIF search returns nothing for that name: resolved stays
  │        null, status falls back to 'no_match' even though PlantNet itself
  │        was confident (rare — flagged as an assumption)
  │     else: resolved stays null, status = 'no_match'
  │
  └─4─> build PlantIdentificationAggregate (photos, candidates, resolved,
           status), identification.create() → PlantIdentificationCreatedEvent
           └─> PlantIdentificationWriteRepository.save() (tenant-scoped)

Response: 201 { id, status, resolved: { gbifKey, scientificName } | null,
                candidates: [...], photos: [{ url, organ }] }

POST /graphql: createPlantFromIdentification(input: { identificationId, name,
                                                        imageUrl? })
  ──CommandBus──> CreatePlantFromIdentificationCommandHandler
  │  AssertPlantIdentificationExistsService (404)
  │  ownership check: requestingUserId === identification.requestedByUserId (403)
  │  409 PlantIdentificationNotResolvedException if identification.resolved is null
  ├─1─> IPlantsPort.createPlant({ name, gbifSpeciesKey: resolved.gbifKey,
  │        speciesScientificName: resolved.scientificName, imageUrl, userId })
  │        └─> PlantsAdapter ──CommandBus──> CreatePlantCommand ──> plants
  │              (runs its own existing findOrCreateByGbifKey internally —
  │               unchanged, this context does not touch plant_species)
  │        <── { id: plantId }
  └─2─> identification.convertToPlant(plantId) →
           PlantIdentificationConvertedToPlantEvent; writeRepository.save()

Response: { id: plantId } (CreatedEntity shape — caller only needs the id)

GET /api/plant-identifications?page&limit / GraphQL plantIdentifications(criteria)
  ──QueryBus──> PlantIdentificationFindByCriteriaQuery ──>
  PlantIdentificationReadRepository.findByCriteria() (tenant-scoped, standard
  Criteria pattern) ──> PaginatedResult<PlantIdentificationViewModel>
```

## File Changes

All new files under `src/contexts/plant-identification/`. Tree (~60 files,
mirroring `plant-photos`' shape plus one extra cross-context port):

```
domain/
  aggregates/plant-identification.aggregate.ts (+ .spec.ts)
  builders/plant-identification.builder.ts (+ .spec.ts)
  enums/plant-identification-organ.enum.ts
  enums/plant-identification-status.enum.ts
  events/interfaces/plant-identification-event-data.interface.ts
  events/plant-identification-created/plant-identification-created.event.ts
  events/plant-identification-converted-to-plant/plant-identification-converted-to-plant.event.ts
  exceptions/plant-identification-not-found.exception.ts        # 404
  exceptions/plant-identification-forbidden.exception.ts         # 403
  exceptions/plant-identification-not-resolved.exception.ts      # 409
  exceptions/plant-identification-provider-unavailable.exception.ts  # 502
  exceptions/plant-identification-quota-exceeded.exception.ts    # 429
  interfaces/plant-identification.interface.ts
  interfaces/plant-identification-photo.interface.ts
  interfaces/plant-identification-candidate.interface.ts
  primitives/plant-identification.primitives.ts
  repositories/read/plant-identification-read.repository.ts
  repositories/write/plant-identification-write.repository.ts
  value-objects/plant-identification-id/plant-identification-id.value-object.ts (+ .spec.ts)
  value-objects/plant-identification-status/plant-identification-status.value-object.ts (+ .spec.ts)
  value-objects/plant-identification-organ/plant-identification-organ.value-object.ts (+ .spec.ts)
  value-objects/plant-identification-score/plant-identification-score.value-object.ts (+ .spec.ts)
  view-models/plant-identification.view-model.ts
application/
  ports/files.port.ts
  ports/plants.port.ts
  ports/plant-species.port.ts
  ports/plantnet-identification.port.ts
  commands/identify-plant/identify-plant.command.ts + .handler.ts (+ .spec.ts) + .result.ts
  commands/create-plant-from-identification/create-plant-from-identification.command.ts + .handler.ts (+ .spec.ts)
  queries/plant-identification-find-by-criteria/plant-identification-find-by-criteria.query.ts + .handler.ts (+ .spec.ts)
  queries/plant-identification-find-by-id/plant-identification-find-by-id.query.ts + .handler.ts (+ .spec.ts)
  services/write/assert-plant-identification-exists/assert-plant-identification-exists.service.ts (+ .spec.ts)
  services/write/assert-plant-identification-ownership/assert-plant-identification-ownership.service.ts (+ .spec.ts)
infrastructure/
  adapters/files.adapter.ts (+ .spec.ts)
  adapters/plants.adapter.ts (+ .spec.ts)
  adapters/plant-species.adapter.ts (+ .spec.ts)
  adapters/plantnet-identification.adapter.ts (+ .spec.ts, + plantnet/types/plantnet-identify-api.types.ts)
  persistence/typeorm/entities/plant-identification.entity.ts
  persistence/typeorm/entities/plant-identification-photo.entity.ts
  persistence/typeorm/entities/plant-identification-candidate.entity.ts
  persistence/typeorm/mappers/plant-identification-typeorm.mapper.ts (+ .spec.ts)
  persistence/typeorm/repositories/plant-identification-typeorm-read.repository.ts
  persistence/typeorm/repositories/plant-identification-typeorm-write.repository.ts
transport/
  exceptions/plant-identification-exception.filter.ts
  rest/controllers/plant-identifications.controller.ts (+ .spec.ts)
  rest/dtos/identify-plant-response.dto.ts
  rest/dtos/plant-identification-rest-response.dto.ts
  rest/dtos/plant-identification-criteria.dto.ts
  rest/mappers/plant-identification/plant-identification.mapper.ts (+ .spec.ts)
  graphql/enums/plant-identification-queryable-field.enum.ts
  graphql/enums/plant-identification-registered-enums.graphql.ts
  graphql/registries/plant-identification-filterable-fields.registry.ts (+ .spec.ts)
  graphql/dtos/requests/plant-identification-filter.input.ts
  graphql/dtos/requests/plant-identification-sort.input.ts
  graphql/dtos/requests/plant-identification-find-by-criteria.request.dto.ts
  graphql/dtos/requests/create-plant-from-identification.request.dto.ts
  graphql/dtos/responses/plant-identification.response.dto.ts
  graphql/mappers/plant-identification/plant-identification.mapper.ts (+ .spec.ts)
  graphql/resolvers/plant-identification/queries/plant-identification-queries.resolver.ts (+ .spec.ts)
  graphql/resolvers/plant-identification/mutations/plant-identification-mutations.resolver.ts (+ .spec.ts)
  mcp/schemas/plant-identification-find-by-criteria.schema.ts
  mcp/schemas/plant-identification-find-by-id.schema.ts
  mcp/schemas/create-plant-from-identification.schema.ts
  mcp/tools/plant-identification-find-by-criteria.tool.ts
  mcp/tools/plant-identification-find-by-id.tool.ts
  mcp/tools/create-plant-from-identification.tool.ts
plant-identification.module.ts
plant-identification-no-cross-context-import.spec.ts
README.md
```

Plus:
- `src/database/migrations/1780000000025-CreatePlantIdentifications.ts`
- `src/app.module.ts` — register `PlantIdentificationModule`
- `.env.example` — `PLANTNET_API_KEY`, `PLANTNET_PROJECT`,
  `PLANTNET_MIN_CONFIDENCE`
- `test/integration/plant-identification/*.integration-spec.ts`
- `test/e2e/plant-identification/*.e2e-spec.ts`

## Database

### `plant_identifications`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `requested_by_user_id` | `uuid` | Owner — used for the 403 ownership check on conversion |
| `space_id` | `uuid` | Tenant column |
| `status` | `varchar` | `resolved` \| `no_match` (a row is only ever written on a *completed* PlantNet call — provider failures never reach this table, see design decisions) |
| `resolved_gbif_key` | `integer` NULL | Denormalized GBIF match, not a FK — see "search results not persisted" decision |
| `resolved_scientific_name` | `varchar(300)` NULL | |
| `converted_to_plant_id` | `uuid` NULL | Not FK-enforced (repo convention) |
| `created_at` / `updated_at` | `TIMESTAMPTZ` | |

### `plant_identification_photos`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `plant_identification_id` | `uuid` | FK → `plant_identifications.id`, `ON DELETE CASCADE` (child of the aggregate — this one IS a real FK, unlike cross-context references, since it's intra-aggregate) |
| `file_id` | `uuid` | Not FK-enforced — `files` is a separate bounded context |
| `url` | `varchar(1024)` | Denormalized from `files.url` at upload time |
| `organ` | `varchar` | `leaf` \| `flower` \| `fruit` \| `bark` \| `habit` \| `other` |
| `position` | `smallint` | Preserves submitted order for display |

### `plant_identification_candidates`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `plant_identification_id` | `uuid` | FK → `plant_identifications.id`, `ON DELETE CASCADE` |
| `scientific_name` | `varchar(300)` | PlantNet's raw scientific name (not GBIF-normalized — only the top-ranked, auto-resolved one is) |
| `common_names` | `text[]` | |
| `score` | `numeric(5,4)` | 0–1 |
| `rank` | `smallint` | Preserves PlantNet's own ranking order |

Indexes: `IDX_plant_identifications_space_id` (space_id),
`IDX_plant_identifications_space_id_requested_by_user_id_created_at`
(space_id, requested_by_user_id, created_at DESC — history list),
`IDX_plant_identification_photos_plant_identification_id`,
`IDX_plant_identification_candidates_plant_identification_id`.

## Error handling summary

| Situation | Outcome |
|---|---|
| PlantNet returns candidates, top ≥ threshold | `status: 'resolved'`, `resolved*` set, row persisted, 201 |
| PlantNet returns candidates, top < threshold | `status: 'no_match'`, `resolved*` null, candidates still persisted/shown, 201 |
| PlantNet returns zero candidates | `status: 'no_match'`, empty candidates, 201 |
| PlantNet request times out / network error / 5xx | `PlantIdentificationProviderUnavailableException` (502), nothing persisted |
| PlantNet returns 429 (quota) | `PlantIdentificationQuotaExceededException` (429), nothing persisted |
| `files` upload fails (bad mime/size) | Existing `UnsupportedFileTypeException`/`FileTooLargeException` propagate (400), nothing persisted, no PlantNet call made |
| `CreatePlantFromIdentification` on an unresolved identification | `PlantIdentificationNotResolvedException` (409) |
| `CreatePlantFromIdentification` by a non-owner | 403 |
