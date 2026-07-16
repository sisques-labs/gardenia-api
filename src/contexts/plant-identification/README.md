# Plant Identification Context

## Purpose

The `plant-identification` context lets a user photograph a plant they don't
recognize — in their own garden, a neighbor's, or out in the wild — and get a
species guess back via [Pl@ntNet](https://my.plantnet.org)'s photo
identification API. Every attempt (photos, PlantNet's ranked candidates,
whether it auto-resolved) is persisted as history. If the top candidate
clears a confidence threshold, the user can turn the result into a tracked
`Plant` in one step.

This is a standalone identification tool — it is **not** a "confirm this
plant's species" action on an already-tracked `Plant`. It owns no byte
storage of its own (delegates to `files`), and does not write to the
`plant_species` catalog at identify time (only when/if the user actually
converts to a `Plant`, reusing `plants`' own existing
`find-or-create-by-gbif-key` machinery).

## ⚠️ Known gap: PlantNet response shape is UNVERIFIED

`openspec/changes/plant-identification/tasks.md` Phase 0 required obtaining a
real `PLANTNET_API_KEY` and making one live manual call to
`POST /v2/identify/all` to confirm PlantNet's exact response field names
before Phase 3 (the adapter) was implemented. **That call was not made** — no
coding agent implementing this change had a real API key or network access
to PlantNet.

`PlantNetIdentificationAdapter`
(`infrastructure/adapters/plantnet-identification.adapter.ts`) and its types
(`infrastructure/adapters/plantnet/types/plantnet-identify-api.types.ts`) are
built against PlantNet's *publicly documented* shape
(`results[].species.scientificNameWithoutAuthor`/`commonNames`/`score`), as
assumed in `proposal.md`/`design.md` — this is a best-effort assumption, not
a verified contract. See the prominent banner comment at the top of the
types file for the exact checklist to run through before this ships to
production (confirm field names, `commonNames: null` vs `[]`, whether
`score` is 0–1 vs a percentage, and PlantNet's actual 429/quota error
shape).

**Do not deploy this context to production against the real PlantNet API
until that verification has been done.**

## Core aggregate

### `PlantIdentificationAggregate`

| Field | Type | Description |
|-------|------|-------------|
| `id` | `PlantIdentificationIdValueObject` | UUID generated on submission |
| `requestedByUserId` | `UuidValueObject` | Owner — used for the 403 ownership check on conversion |
| `spaceId` | `UuidValueObject` | Space owning the attempt (`SpaceContext` ALS) |
| `status` | `PlantIdentificationStatusValueObject` | `resolved` \| `no_match` — **derived** by the builder from whether `resolvedSpeciesKey` is set, never independently settable; a row only ever exists for a *completed* PlantNet call, never a failed one |
| `resolvedSpeciesKey` / `resolvedScientificName` / `resolvedSpeciesProvider` | `PlantIdentificationSpeciesKeyValueObject`/`StringValueObject`/`PlantIdentificationSpeciesProviderValueObject`, nullable | Set only when the top PlantNet candidate cleared `PLANTNET_MIN_CONFIDENCE` **and** a species match was found for its name. Provider-agnostic on purpose — `resolvedSpeciesProvider` records which external catalog resolved it (`"gbif"` today); the aggregate/port never hardcode a provider name, only the `plant-species` adapter knows it's GBIF-backed. |
| `convertedToPlantId` | `UuidValueObject`, nullable | Set once (if) `CreatePlantFromIdentification` succeeds — not FK-enforced (repo convention) |
| `photos` | `IPlantIdentificationPhoto[]` | `{ fileId, url, organ, position }`, fixed at creation |
| `candidates` | `IPlantIdentificationCandidate[]` | `{ scientificName, commonNames, score, rank }`, PlantNet's full ranked list, fixed at creation |
| `createdAt` / `updatedAt` | `Date` | Managed by TypeORM |

Domain methods: `create()` → `PlantIdentificationCreatedEvent`;
`convertToPlant(plantId)` → `PlantIdentificationConvertedToPlantEvent` (guard:
throws `PlantIdentificationAlreadyConvertedException` if already converted).
Aside from conversion, the aggregate is immutable after creation — no
field-level `update()`, and the two child collections (`photos`,
`candidates`) never support independent add/remove.

## Cross-context integration

Four outbound ports, all in `application/ports/` with adapters in
`infrastructure/adapters/` that dispatch through the global
`CommandBus`/`QueryBus` — this context never imports `files`, `plants`, or
`plant-species` domain/application directly (enforced by
`plant-identification-no-cross-context-import.spec.ts`).

### `IFilesPort` → `files`

| Method | Dispatches | Notes |
|--------|-----------|-------|
| `uploadFile(input)` | `UploadFileCommand` | One call per submitted photo, run in parallel (`Promise.all`, no ordering dependency). Mime/size validation happens **inside** `files` — propagates as 400 before any PlantNet call is made. |

### `IPlantSpeciesPort` → `plant-species`

| Method | Dispatches | Notes |
|--------|-----------|-------|
| `search(name, limit)` | `GbifSpeciesSearchQuery` | **Read-only**, provider-agnostic port (`PlantSpeciesMatch { speciesKey, scientificName, provider }`) — the adapter dispatches the existing, live, non-persisting GBIF search and is the ONLY place in this context that knows it's GBIF-backed, stamping `provider: "gbif"` on the way out. Used only to map PlantNet's top scientific name onto a species key for display/conversion. Nothing is written to `plant_species` by this call. |

### `IPlantsPort` → `plants`

| Method | Dispatches | Notes |
|--------|-----------|-------|
| `createPlant(input)` | `CreatePlantCommand` | Dispatches `plants`' own existing command **unchanged**, including its internal `findOrCreateByGbifKey` species-linking. `plants` never knows `plant-identification` exists — the dependency is one-directional. |

### `IPlantNetIdentificationPort` → PlantNet (external HTTP)

| Method | Calls | Notes |
|--------|-------|-------|
| `identify(images, project?)` | `POST https://my-api.plantnet.org/v2/identify/{project}` | ALL submitted photos + organs in **one** request (never one request per photo — see "Why one request" below). 15s timeout (`PLANTNET_TIMEOUT_MS` is not separately configurable; hardcoded via `plantnetConfig`). ⚠️ Response shape unverified — see banner above. |

**Why one PlantNet request, not one per photo:** PlantNet's API is designed
to use multiple images/organs of the *same* plant to improve confidence in
one scored result. Splitting into N requests would produce N unrelated
candidate lists instead of one better one, and would burn N× the daily quota
for no benefit.

## Commands & Queries

| Type | Name | Notes |
|------|------|-------|
| Command | `IdentifyPlant` | Uploads all photos → one PlantNet call → conditional GBIF auto-resolve → persists the full attempt. Returns `{ id, status, resolved, candidates, photos, createdAt }`. Provider failures (`PlantIdentificationProviderUnavailableException` 502, `PlantIdentificationQuotaExceededException` 429) propagate and persist **nothing** — uploaded photos are NOT rolled back. |
| Command | `CreatePlantFromIdentification` | Owner-only (403 otherwise); 409 if unresolved; calls `plants`' `CreatePlantCommand` and stamps `convertedToPlantId`. Returns `{ id: plantId }`. |
| Query | `PlantIdentificationFindById` | Tenant-scoped `PlantIdentificationViewModel` |
| Query | `PlantIdentificationFindByCriteria` | Type-safe `Criteria` pattern — paginated, filterable/sortable on `status`, `requestedByUserId`, `createdAt` (default sort `createdAt` DESC) |

Events: `PlantIdentificationCreated`, `PlantIdentificationConvertedToPlant`.

## Error handling

| Situation | Outcome |
|---|---|
| PlantNet returns candidates, top ≥ `PLANTNET_MIN_CONFIDENCE` and GBIF matches | `status: 'resolved'`, `resolved*` set, 201 |
| PlantNet returns candidates, top < threshold, or GBIF finds no match | `status: 'no_match'`, `resolved*` null, candidates still persisted/shown, 201 |
| PlantNet returns zero candidates | `status: 'no_match'`, empty candidates, 201 |
| PlantNet request times out / network error / non-2xx (not 429) | `PlantIdentificationProviderUnavailableException` — 502, nothing persisted |
| PlantNet returns 429 (quota) | `PlantIdentificationQuotaExceededException` — 429, nothing persisted |
| `files` upload fails (bad mime/size) | Existing `files` exceptions propagate — 400, nothing persisted, no PlantNet call made |
| `CreatePlantFromIdentification` on an unresolved identification | `PlantIdentificationNotResolvedException` — 409 |
| `CreatePlantFromIdentification` by a non-owner | `PlantIdentificationForbiddenException` — 403 |
| `CreatePlantFromIdentification` on an already-converted identification | `PlantIdentificationAlreadyConvertedException` — 409 (defensive aggregate guard; the 409 above already blocks this path in the one documented caller) |
| Identification not found | `PlantIdentificationNotFoundException` — 404 |

Mapped in `transport/exceptions/plant-identification-exception.filter.ts`.

## Transport

### REST (`/api/plant-identifications`, `JwtAuthGuard` + global `SpaceGuard`)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/plant-identifications` | Submit photos (multipart `photos[]` field, multiple files, max 5) + `organs` (JSON-encoded array, index-aligned to `photos`) + optional `project` field. Runs PlantNet identification. |
| GET | `/plant-identifications` | List history (paginated, filter by `status`) |
| GET | `/plant-identifications/:id` | Fetch one identification |

`createPlantFromIdentification` is **not** exposed via REST — GraphQL only
(no binary payload involved, so the REST-only upload constraint doesn't
apply; kept on one transport to avoid duplicating the conversion DTOs).

### GraphQL (code-first, `JwtAuthGuard` + global `SpaceGuard`)

- Queries: `plantIdentificationFindById(input)`,
  `plantIdentificationsFindByCriteria(input)`
- Mutation: `createPlantFromIdentification(input)` →
  `CreatedPlantFromIdentificationObject { id }`

Binary upload is **not** exposed over GraphQL — same convention as
`files`/`plant-photos`; use the REST endpoint.

### MCP tools (`transport/mcp/`)

`plant_identification_find_by_id`, `plant_identification_find_by_criteria`,
`plant_identification_create_plant`. No upload tool (same reasoning as
`files`/`plant-photos`).

## Persistence

Three tables (migration `1780000000025-CreatePlantIdentifications`):

- `plant_identifications` — the attempt: `id`, `requested_by_user_id`,
  `space_id`, `status`, `resolved_species_key`, `resolved_scientific_name`,
  `resolved_species_provider`, `converted_to_plant_id`, `created_at`,
  `updated_at`.
- `plant_identification_photos` — child, `ON DELETE CASCADE` to
  `plant_identifications.id` (real, DB-enforced FK — intra-aggregate, unlike
  `file_id`, which is deliberately NOT FK-enforced since `files` is a
  separate bounded context). `id`, `plant_identification_id`, `file_id`,
  `url`, `organ`, `position`.
- `plant_identification_candidates` — child, `ON DELETE CASCADE`. `id`,
  `plant_identification_id`, `scientific_name`, `common_names` (`text[]`),
  `score` (`numeric(5,4)`), `rank`.

Indexes: `IDX_plant_identifications_space_id`,
`IDX_plant_identifications_space_id_requested_by_user_id_created_at`
(history list), `IDX_plant_identification_photos_plant_identification_id`,
`IDX_plant_identification_candidates_plant_identification_id`.

The write repository persists parent + both child collections in one
transaction (`manager.transaction(...)`) — delete+reinsert children on every
`save()`, which is safe because the aggregate never edits its child
collections after creation. Both read and write repositories are wrapped
with `createTenantRepository`, so an identification is invisible outside its
space.

## Configuration

`infrastructure/config/plantnet.config.ts` (`registerAs('plantnet', ...)`),
validated fail-fast at bootstrap:

| Var | Required | Default | Notes |
|-----|----------|---------|-------|
| `PLANTNET_API_KEY` | **Yes** | — | Boot throws if unset. Never commit the real key. |
| `PLANTNET_PROJECT` | No | `all` | PlantNet dataset/project slug |
| `PLANTNET_MIN_CONFIDENCE` | No | `0.2` | Score threshold (0–1) for auto-resolution — not validated against real PlantNet score distributions, see proposal.md's open questions |

## Tests

- Unit (`src/contexts/plant-identification/**/*.spec.ts`): value objects,
  aggregate, builder, command/query handlers (mocking the 4 ports), the 4
  adapters (mocking `CommandBus`/`QueryBus`/`HttpService`) — including the
  PlantNet adapter's error-mapping (429 → quota, timeout/5xx → provider
  unavailable), TypeORM mapper, REST controller, GraphQL resolvers/mapper,
  filterable-fields registry, config fail-fast behavior, and the
  cross-context-import guard.
- Integration (`test/integration/plant-identification/`): tenant isolation
  on read/write repos, cascade delete of photos/candidates,
  `findByCriteria` filter/sort coverage. **Could not be run in this
  environment** — no live Postgres/Docker daemon available; written but
  unverified.
- E2E (`test/e2e/plant-identification/`): REST multipart identify (mock
  PlantNet adapter — resolved/no_match/quota/provider-failure paths),
  GraphQL history query + `createPlantFromIdentification` mutation (happy
  path, 409 unresolved, 403 non-owner). **Same caveat as integration —
  written but not run in this environment.**

## Out of scope (this change)

Manual override / picking a non-top candidate to resolve against; deleting
an identification record (history is append-only); region/dataset picker UI
for `project` (defaults to PlantNet's `all` world flora dataset); any
`gardenia-web` UI (separate paired change); automatic conversion to `Plant`
without explicit user action; rate-limit/quota UI beyond surfacing PlantNet's
429 as a domain exception.
