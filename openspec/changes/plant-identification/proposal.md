# Proposal: PlantIdentification bounded context (PlantNet integration)

> No Jira ticket — proposed directly with the product owner in an agent
> session exploring new (non-notification) features. Design decisions below
> reflect explicit choices made in that conversation (see "Decisions locked
> in conversation").

## Why

A Gardenia user who sees an interesting plant — in their own garden, a
neighbor's, or out in the wild — has no way to find out what it is without
leaving the app. `plant-species` already models a scientific-name+`gbifKey`
catalog (fed by live GBIF search), and `files`/`plant-photos` already
implement generic photo upload — but nothing turns "a photo of an unknown
plant" into "a species". [Pl@ntNet](https://my.plantnet.org) is a
photo-based plant identification API; wiring it in as a new adapter lets
Gardenia answer "what is this?" and, if the user wants, turn the answer
straight into a tracked `Plant` in their space.

## What Changes

- New tenant-scoped **`plant-identification`** bounded context with a
  `PlantIdentificationAggregate` — an identification attempt: one or more
  submitted photos (each tagged with a plant `organ`: leaf/flower/fruit/
  bark/habit/other), the ranked list of candidate species PlantNet returned
  (`scientificName`, `commonNames`, `score`), a `resolved` best pick
  (`gbifKey`+`scientificName`, nullable — only set when the top candidate
  clears a minimum confidence threshold), a `status`
  (`resolved` / `no_match` / `failed`), and a nullable `convertedToPlantId`
  once (if) the user turns it into a tracked plant.
- Command `IdentifyPlant` (multipart: 1..N photos + parallel `organ` array +
  optional `project`): uploads each photo via the existing `files` context,
  sends the full set to PlantNet in **one** identification request (PlantNet
  natively supports multi-image, multi-organ requests and uses the extra
  images to improve accuracy), resolves the top candidate's scientific name
  against GBIF via `plant-species`' existing live `GbifSpeciesSearchQuery`
  (read-only — nothing is written to the `plant_species` catalog at this
  step), and persists the attempt with its full result.
- Command `CreatePlantFromIdentification` (identification id + a name for
  the new plant + optional planting details): only allowed when the
  identification has a `resolved` pick; calls `plants`' own existing
  `CreatePlantCommand` (via a new cross-context port) with the resolved
  `gbifSpeciesKey`/`speciesScientificName` — reusing `plants`' own
  `find-or-create-by-gbif-key` species-linking machinery unchanged. Stamps
  `convertedToPlantId` back onto the identification.
- Queries: `PlantIdentificationFindByCriteria` (space-scoped history,
  standard `Criteria` pattern), `PlantIdentificationFindById`.
- Dual transport: REST (`/api/plant-identifications`, multipart upload,
  matching `plant-photos`' precedent for binary upload) + GraphQL (history
  query, `createPlantFromIdentification` mutation — no GraphQL upload, same
  convention as `files`/`plant-photos`). MCP tools for read + conversion (no
  upload tool, same reasoning).
- Cross-context, via the established port-in-application/adapter-in-
  infrastructure + Command/QueryBus pattern (see `plant-photos` →
  `files`/`plants`):
  - `plant-identification` → `files`: `IFilesPort.uploadFile()` — one call
    per submitted photo, no new byte-storage code.
  - `plant-identification` → `plant-species`: `IPlantSpeciesPort.search()`
    dispatches the existing `GbifSpeciesSearchQuery` — **read-only**, used
    only to map PlantNet's scientific name onto a `gbifKey` for display and
    for the eventual `CreatePlant` call. This context never writes to
    `plant_species` directly.
  - `plant-identification` → `plants`: `IPlantsPort.createPlant()`
    dispatches the existing `CreatePlantCommand` unchanged.
- New external adapter: `PlantNetIdentificationAdapter` — PlantNet's
  `POST /v2/identify/{project}` (multi-image + organ array in one request).
  Config: `PLANTNET_API_KEY` (secret, required), `PLANTNET_PROJECT`
  (optional, default `all`), `PLANTNET_MIN_CONFIDENCE` (optional, default
  `0.2` — the score threshold above which a top candidate auto-resolves).

### Decisions locked in conversation (do not revisit without re-confirming)

1. **Not tied to an existing `Plant`** — this is a standalone identification
   tool ("what is this plant I'm looking at"), not a "confirm this plant's
   species" action on an already-tracked `Plant`.
2. **Auto-map the best candidate** — the top-scoring PlantNet result is
   resolved against GBIF automatically; the user confirms/overrides rather
   than picking from a raw, unmapped list.
3. **Multi-photo + organ selection in v1** — full PlantNet accuracy features
   ship from the start, not a cut-down single-photo v1.
4. **Persist history** — every identification attempt (photos, candidates,
   score, timestamp) is kept, not discarded after the response.
5. **Space-scoped** — identifications belong to a `Space`, like every other
   domain concept in this app (tenancy via `SpaceContext`/`X-Space-ID`).
6. **"Create Plant from this" ships in v1** — the bridge into `plants` is
   part of this change, not deferred.

## Capabilities

### New Capabilities

- `plant-identification`: tenant-scoped photo-based species identification
  (PlantNet), history, and a one-click bridge into creating a tracked
  `Plant`. Dual transport (REST + GraphQL), MCP read/convert tools.

### Modified Capabilities

- `plants`: no aggregate/schema change — `CreatePlantCommand` already
  accepts `gbifSpeciesKey`/`speciesScientificName` (from the
  `gbif-species-search` change). Gains a new inbound cross-context caller
  (`plant-identification` → `IPlantsPort` → `CreatePlantCommand`). No new
  port on `plants` itself.
- `plant-species`: no aggregate/schema change — `GbifSpeciesSearchQuery`
  already exists and is reused as-is. Gains a new inbound cross-context
  caller (read-only).
- `files`: no change. Consumed as-is via a new `IFilesPort.uploadFile()`
  caller, same integration shape `plant-photos` already established.

**Deferred to future changes:**
- Manual override / picking a non-top candidate to resolve against (v1 only
  auto-resolves the top scorer above the confidence threshold; below it, the
  identification stays `no_match` and cannot yet be converted — the user
  sees the raw candidate list but there's no "pick #3" UI/command yet).
- Deleting an identification record (history is append-only in v1, matching
  MVP scope; add if users ask for it).
- Region/dataset picker for `project` (defaults to PlantNet's "all" world
  flora dataset; per-region datasets like `weurope` exist but aren't
  surfaced yet).
- Any `gardenia-web` UI — separate paired change.

**Out of scope:**
- Any change to `files`' storage backend.
- Automatic conversion to `Plant` without explicit user action.
- Rate-limiting/quota UI beyond surfacing PlantNet's own 429 as a domain
  exception (see design.md's error-handling section).

## Impact

| Area | Impact |
|------|--------|
| `src/contexts/plant-identification/` | New — full bounded context (~60 files) |
| `src/contexts/plants/` | No file changes — only receives `CreatePlantCommand` dispatches from a new caller |
| `src/contexts/plant-species/` | No file changes — only receives `GbifSpeciesSearchQuery` dispatches from a new caller |
| `src/database/migrations/` | New migration `1780000000025-CreatePlantIdentifications.ts` (3 tables: attempt, photos, candidates) |
| `src/app.module.ts` | Register `PlantIdentificationModule` |
| `.env.example` | Add `PLANTNET_API_KEY`, `PLANTNET_PROJECT`, `PLANTNET_MIN_CONFIDENCE` |
| Web (gardenia-web) | Separate change — identify screen + history + "create plant" CTA, out of scope here |

## Rollback Plan

Purely additive: three new tables + a new module + one new external adapter.
Rollback = revert the migration (`down()` drops all three
`plant_identification*` tables) and unregister `PlantIdentificationModule`.
No existing table, column, or public API on `plants`/`plant-species`/`files`
is altered — those contexts only receive new inbound calls, which simply
stop happening once `plant-identification` is unregistered. The only
externally visible side effect is any `Plant` already created via
`CreatePlantFromIdentification` — those rows are normal `plants` rows
created through the existing, unchanged `CreatePlantCommand` path and are
unaffected by rolling this change back.

## Open questions

1. **`PLANTNET_MIN_CONFIDENCE` default (`0.2`)** — a starting assumption,
   not validated against real PlantNet score distributions. Confirm/tune at
   apply time against a handful of live calls.
2. **PlantNet request timeout** — assumed 15s (image analysis is slower
   than GBIF's/weather's plain lookups, which use 5s). Confirm against
   observed PlantNet latency.
3. **Multer field shape for multi-photo + parallel organs** — assumed
   `photos` (multiple files, one field) + `organs` (JSON-encoded array,
   index-aligned to `photos`) on the REST multipart endpoint. Confirm exact
   wiring at apply time against `FilesInterceptor` conventions already used
   in this codebase.
4. **PlantNet API key provisioning** — this proposal assumes a
   `PLANTNET_API_KEY` will be obtained (PlantNet's free tier has a daily
   quota, historically ~500 requests/day) before `apply`. Not something an
   agent can provision — flagging so it isn't discovered late.
