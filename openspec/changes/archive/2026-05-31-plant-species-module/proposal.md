# Proposal: Plant Species Catalog (`plant-species` bounded context) + Plants Link

## Intent

Gardenia stores species as optional free text on each plant (`plants.species`), which duplicates labels and prevents a shared taxonomy. This change introduces a **global platform catalog** of species names (`plant-species` bounded context) and links each plant to an optional catalog entry via `plantSpeciesId`.

Why now: `plants`, QR port/enrichment, and dual transport patterns are proven. A global catalog matches product intent (one Latin/common name list for all gardens) and enables picklists and consistent reporting.

Success looks like:

- Authenticated users can CRUD catalog entries (name only) over **REST and GraphQL**, with **globally unique** names (case-insensitive).
- Plants support optional `plantSpeciesId`; read APIs return a nested `species` object (enrichment via port, like `qr`) or `null`.
- Inline `plants.species` free text is **removed** in favor of the FK.

## Scope

### In Scope

- New `plant-species` bounded context under `src/contexts/plant-species/` (domain → application → infrastructure → transport).
- `PlantSpeciesAggregate` with fields: `name` (required), `id`, `createdAt`, `updatedAt` — **no `spaceId`**.
- Commands: `CreatePlantSpecies`, `UpdatePlantSpecies`, `DeletePlantSpecies`.
- Queries: `PlantSpeciesFindById`, `PlantSpeciesFindByCriteria` (global list; not tenant-scoped).
- Domain events: `PlantSpeciesCreated`, `PlantSpeciesUpdated`, `PlantSpeciesDeleted`.
- **Dual transport** — REST controller **and** GraphQL resolvers (queries + mutations).
- TypeORM entity + migration for `plant_species` table with **global unique** `name` (case-insensitive enforced in application layer; DB unique on stored trimmed name).
- **No** `createTenantRepository` — raw TypeORM repositories (like `users`).
- **JwtAuthGuard** on catalog routes; **no SpaceGuard** / no `X-Space-ID` required for plant-species endpoints.
- Delete catalog entry blocked when plants still reference it (409).
- **Plants changes (same change):**
  - `PlantAggregate` / entity / primitives: optional `plantSpeciesId`; **remove** `species` string / `PlantSpeciesValueObject`.
  - `IPlantSpeciesPort`, `PlantSpeciesViewModel`, `PlantSpeciesBuilder`, `PlantSpeciesAdapter`, `EnrichPlantWithSpeciesService` (mirror QR).
  - `PlantViewModel.species: PlantSpeciesViewModel | null` (enrichment-only nested object); persist only `plantSpeciesId`.
  - Create/Update plant commands and REST/GraphQL DTOs accept optional `plantSpeciesId`.
  - Migration: add `plant_species_id` nullable UUID on `plants`; drop `species` column.
- Register `PlantSpeciesModule` in `AppModule`; export queries for adapter use.
- OpenSpec deltas: `plant-species` + `plants`.

### Out of Scope (explicit)

- **Rich species metadata** — scientific name, family, care notes, images, i18n.
- **Backfill job** from legacy `plants.species` strings to catalog rows (manual or follow-up `plant-species-backfill`).
- **Admin-only catalog authz** — v1 uses any authenticated user; tighten later if needed.
- **Per-space catalog views** — catalog is global; plants remain tenant-scoped via `spaceId`.

## Domain Model

### `PlantSpeciesAggregate` (extends `BaseAggregate`)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `PlantSpeciesIdValueObject` | yes | UUID; generated on create |
| `name` | `PlantSpeciesNameValueObject` | yes | trimmed, non-empty, max 200 |
| `createdAt` / `updatedAt` | `Date` | yes | from `BaseAggregate` |

> **Naming:** `PlantSpeciesNameValueObject` (catalog). The removed plants VO was `PlantSpeciesValueObject` (free text) — do not resurrect under the same name in plants.

### Value Objects

- `plant-species-id/plant-species-id.value-object.ts` — `UuidValueObject`.
- `plant-species-name/plant-species-name.value-object.ts` — `StringValueObject`, trim, max 200.

### Domain Events

- `plant-species-created`, `plant-species-updated`, `plant-species-deleted`.

### Exceptions

- `PlantSpeciesNotFoundException` — 404.
- `PlantSpeciesNameAlreadyExistsException` — duplicate global name, case-insensitive — 409.
- `PlantSpeciesInUseException` — delete while plants reference id — 409.

### Plants aggregate (modified)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `plantSpeciesId` | `PlantSpeciesIdValueObject \| null` | no | FK to global catalog; bare UUID column |
| ~~`species`~~ | — | — | **Removed** |

Read model: `PlantViewModel` adds nested `species: PlantSpeciesViewModel | null` (enrichment); primitives/entity hold `plantSpeciesId` only.

## Commands

### Plant-species (global)

| Command | Inputs | Authorization | Behavior |
|---------|--------|---------------|----------|
| `CreatePlantSpecies` | `name` | Authenticated | Assert global name available; create; persist; emit event |
| `UpdatePlantSpecies` | `plantSpeciesId`, `name?` | Authenticated | Assert exists; if name changes, assert available (exclude self); update |
| `DeletePlantSpecies` | `plantSpeciesId` | Authenticated | Assert not referenced by any plant; delete; emit event |

### Plants (modified)

| Command | Change |
|---------|--------|
| `CreatePlant` / `UpdatePlant` | Accept optional `plantSpeciesId`; validate catalog row exists when provided; **no** `species` string |

## Queries

| Query | Scope | Returns |
|-------|-------|---------|
| `PlantSpeciesFindById` | Global | `PlantSpeciesViewModel` |
| `PlantSpeciesFindByCriteria` | Global | `PaginatedResult<PlantSpeciesViewModel>` |
| `PlantFindById` / `PlantFindByCriteria` | Tenant (unchanged) | `PlantViewModel` with enriched `species` |

## Capabilities

### New

- `plant-species`: Global species name catalog — CRUD, globally unique name, REST + GraphQL.

### Modified

- `plants`: `plantSpeciesId` FK, remove free-text species, QR-style species enrichment on reads.

## Approach

- **Catalog:** `users` persistence style (no tenant wrapper) + `plants`/`qr` dual transport.
- **Plants link:** Copy `plant-qr-view-model` / `IPlantQrPort` pattern — port + adapter + enrich service; no direct `@contexts/plant-species` imports in plants domain/application.
- **Uniqueness:** `AssertPlantSpeciesNameAvailableService` with `findByNameNormalized` on write repo (global).
- **Delete guard:** `AssertPlantSpeciesNotInUseService` via `IPlantSpeciesReferencePort` (plants adapter).

## Affected Areas

| Area | Impact |
|------|--------|
| `src/contexts/plant-species/` | New BC |
| `src/contexts/plants/` | FK, remove species text, port/enrichment, DTOs |
| `src/database/migrations/` | `CreatePlantSpecies`, `AlterPlantsPlantSpeciesId` |
| `src/app.module.ts` | Register module |
| `src/core/filters/base-exception.filter.ts` | New exceptions |
| `openspec/specs/plant-species/`, `openspec/specs/plants/` | Canonical on archive |

## Pending Features (tracked separately)

| Change | Description |
|--------|-------------|
| `plant-species-backfill` | Script/job: create catalog rows from legacy `plants.species` before column drop (if data exists in prod) |
| `plant-species-admin-authz` | Restrict catalog mutations to platform admins |

## Risks

| Risk | Mitigation |
|------|------------|
| Open catalog mutations to all authenticated users | Document; add admin authz in follow-up |
| Breaking API: `species` string removed from plant DTOs | Major note in CHANGELOG; coordinate clients |
| Orphan `plantSpeciesId` if catalog row deleted | Block delete with `PlantSpeciesInUseException` |
| Cross-context delete check | `IPlantSpeciesReferencePort` + integration test |

## Rollback Plan

Revert branch; run migrations `down()` (drop `plant_species`, restore `plants.species` column if needed). Coordinate with clients if shipped.

## Success Criteria

- [ ] Global CRUD via REST and GraphQL with globally unique names (409 on duplicate).
- [ ] Plant create/update accepts `plantSpeciesId`; reads return nested `species` object or `null`.
- [ ] No `plants.species` column; no `PlantSpeciesValueObject` in plants.
- [ ] `IPlantSpeciesPort` — plants domain never imports `@contexts/plant-species`.
- [ ] Unit, integration, and e2e tests green.
