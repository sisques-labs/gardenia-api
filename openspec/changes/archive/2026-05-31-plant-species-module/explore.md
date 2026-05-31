# Exploration: plant-species-module — gardenia-api

**Change slug:** `plant-species-module`  
**Date:** 2026-05-31  
**Revised:** 2026-05-31 — user decisions override tenant-scoped v1

---

## Revision summary (2026-05-31)

| Topic | Original exploration | **Updated decision** |
|-------|---------------------|----------------------|
| Tenancy | Per-space catalog (`space_id`, `createTenantRepository`) | **Global platform catalog** — no `spaceId` on aggregate or table |
| Name uniqueness | Unique per space (case-insensitive) | **Globally unique** name (case-insensitive) |
| Transport | REST-only | **REST + GraphQL** (dual transport) |
| Plants linkage | Deferred (`plant-species-link`) | **In scope:** `plantSpeciesId` on `PlantAggregate` + QR-style port/enrichment on read |
| `plants.species` free text | Unchanged in v1 | **Removed** — replaced by optional `plantSpeciesId` FK to catalog |

---

## Exploration: Plant Species bounded context (global catalog + plants link)

### Current State

**Plants** store species as optional free text (`PlantSpeciesValueObject`, `plants.species` column). No catalog table.

**QR pattern in plants** (reference for species enrichment):

- `IPlantQrPort` + `PlantQrViewModel` in plants domain
- `PlantQrAdapter` in infrastructure (QueryBus → `qr` context)
- `EnrichPlantWithQrService` on read queries
- `qrId` persisted; `qr` nested object enrichment-only on `PlantViewModel`

**Global BC precedent:** `spaces` is tenant root without `space_id` on its own table; `users` is global. `plant-species` aligns with **users-style** repos (raw TypeORM `Repository`, no `createTenantRepository`).

### Affected Areas

**New:** `src/contexts/plant-species/` — full BC, migration `plant_species` (no `space_id`), REST + GraphQL.

**Modified:** `src/contexts/plants/**` — `plantSpeciesId`, remove `species` column/VO, port/adapter/enrich service, create/update commands/DTOs, migration alter `plants`.

**Specs:** `openspec/changes/plant-species-module/specs/plant-species/spec.md`, `specs/plants/spec.md` (delta).

### Recommendation (current)

**Global catalog** with globally unique `name`, dual transport, and **same-change** plants integration via `plantSpeciesId` + `IPlantSpeciesPort` enrichment mirroring QR.

### Ready for Proposal

**Yes** — proposal/design/specs/tasks updated to match revision.
