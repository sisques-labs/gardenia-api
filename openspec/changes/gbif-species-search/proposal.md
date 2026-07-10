# Proposal: Trim plant-species to scientificName+gbifKey, add live GBIF search

**Change**: `gbif-species-search`
**Issue**: GDN-35 — https://sisqueslabs.atlassian.net/browse/GDN-35
**Status**: proposed
**Artifact store**: openspec

> **Revision note**: this supersedes an earlier draft of this same change that
> proposed deleting the `plant-species` bounded context entirely and moving
> `Plant`'s species link onto two denormalized fields
> (`gbifSpeciesKey`/`speciesScientificName`) with no FK. The user reviewed
> that draft and asked for a smaller-footprint approach instead (see §6 for
> what changed and why).

---

## 1. Intent

### What
1. **Keep** the `plant-species` bounded context, but trim it down to exactly
   two content fields: `scientificName` (string) and `gbifKey` (GBIF's numeric
   `usageKey`). Remove `description`, `imageUrl`, the `EnrichPlantSpecies`
   command, and the `ImportPlantSpeciesFromGbif` bulk-import command — none of
   these serve the trimmed shape.
2. **Add** a live, non-persisting `GbifSpeciesSearch` query inside this same
   context, proxying GBIF's `/species/suggest` endpoint for autocomplete.
   Nothing this query returns is written to the database.
3. **Add** a `FindOrCreatePlantSpeciesByGbifKey` command: given a `gbifKey` +
   `scientificName` picked from a live search result, look up an existing
   catalog row by `gbifKey`; create it on the spot if missing. This is how a
   client's live-search pick becomes a linkable catalog id, without ever
   requiring a manual "browse and create a catalog entry first" step.
4. **`Plant.plantSpeciesId` (FK) is UNCHANGED** — `Plant` still links to
   `plant_species` by id, exactly as it does today. What changes is *how that
   id gets set*: `CreatePlant`/`UpdatePlant` now accept `gbifSpeciesKey` +
   `speciesScientificName` (what a client actually has after a live search)
   instead of a raw `plantSpeciesId` (a local catalog UUID the client has no
   way to know without first browsing the catalog — which no longer makes
   sense once catalog entries are created on demand from search picks). The
   handler resolves this via `FindOrCreatePlantSpeciesByGbifKey` internally.

### Why now
GDN-35 wants live GBIF autocomplete during "add a plant." The existing
`plant-species` catalog + `plants.plantSpeciesId` FK machinery (aggregate,
cross-context port, resolved GraphQL field, in-use guard on delete) is
already built, tested, and working — only its *content* (description/image
enrichment, bulk import) doesn't fit the "live search, on-demand link"
model GDN-35 asks for. Trimming the content and adding a search+link path
reuses that machinery instead of discarding and rebuilding it.

### Success looks like
- Typing a species name anywhere search is exposed hits GBIF live
  (`/species/suggest`); nothing from that response is persisted by the search
  itself.
- Picking a search result and creating/updating a `Plant` results in exactly
  one `plant_species` row for that `gbifKey` (created on first use, reused on
  every subsequent pick of the same species) and the plant's existing FK
  mechanics apply unchanged.
- `description`/`imageUrl` and the enrich/import commands are gone; nothing
  references them.
- `plants`, `planting-spots`, and all existing cross-context wiring keep
  working with zero change to `plants`' own schema or aggregate.

---

## 2. Scope

### Bounded contexts impacted
- **`plant-species`** — trimmed fields (drop `description`/`imageUrl`), drop
  `EnrichPlantSpecies`/`ImportPlantSpeciesFromGbif`, add `gbifKey` field, add
  `GbifSpeciesSearchQuery` and `FindOrCreatePlantSpeciesByGbifKeyCommand`.
- **`plants`** — no aggregate/schema change. `CreatePlantCommand`/
  `UpdatePlantCommand` input swaps `plantSpeciesId?` for `gbifSpeciesKey?` +
  `speciesScientificName?`; the existing `IPlantSpeciesPort` gains a
  `findOrCreateByGbifKey` method; `AssertPlantLinkedSpeciesExistsService` is
  replaced by a resolve-and-link step (existence is no longer asserted, it's
  ensured). The already-existing resolved `species` field on `PlantResponseDto`
  keeps its shape (nested object), just with trimmed content
  (`gbifSpeciesKey`, `scientificName` — no `description`/`imageUrl`).
- **`planting-spots`** — **no change**. It only mirrors
  `Plant.plantSpeciesId` as a raw id passthrough today; that field doesn't
  move.

### In scope
- DB migration on `plant_species`: drop `description`, `image_url` columns;
  add nullable `gbif_key integer` (nullable at the DB level — existing rows
  predate GBIF keys and can't be backfilled, same unavoidable gap as before,
  scoped much smaller now); partial unique index on `gbif_key WHERE gbif_key
  IS NOT NULL`; drop the old uniqueness constraint on `scientific_name`
  (uniqueness moves to `gbif_key`, the real external identity).
- Domain: new `PlantSpeciesGbifKeyValueObject`; remove
  `PlantSpeciesDescriptionValueObject`/`PlantSpeciesImageUrlValueObject` and
  their field-changed events; remove name-uniqueness assertion, add
  gbifKey-uniqueness assertion.
- Application: remove `EnrichPlantSpeciesCommand`/
  `ImportPlantSpeciesFromGbifCommand` (+ their ports/adapters); add
  `FindOrCreatePlantSpeciesByGbifKeyCommand` and `GbifSpeciesSearchQuery`.
- Infrastructure: remove the enrichment/import GBIF adapters; add
  `GbifSpeciesSuggestAdapter` (`/species/suggest`).
- Transport: trim create/update/response DTOs (REST/GraphQL/MCP); remove
  enrich/import mutations/tools; add the search query/endpoint/tool.
- `plants`: command input field swap, port method addition, handler
  resolve-and-link change. README updates for `plant-species` and `plants`.

### Out of scope
- Any change to `gardenia-web` beyond what the already-drafted, paired web
  proposal covers (unaffected in its write-side shape; its read-side needs a
  small adjustment — see that proposal's own revision).
- Re-adding taxonomy/habitat/additional GBIF fields.
- Backfilling `gbif_key` for pre-existing catalog rows — same accepted gap as
  the previous draft, now limited to a nullable column rather than a data
  migration for an entirely dropped table.
- Making `CreatePlantSpecies`/`UpdatePlantSpecies`/`DeletePlantSpecies`
  unreachable — they stay as a manual/admin-ish path alongside the new
  find-or-create-on-link flow (flagged as an open question below: confirm
  they're still wanted, since most links will now go through
  find-or-create).

---

## 3. Rollback plan

Smaller-footprint than the previous draft, but still a schema change to a
real table (per `openspec/config.yaml`'s "include rollback plan for risky
changes"):

- Dropping `description`/`image_url` **does lose data** for any catalog row
  that had them set. `down()` re-adds both columns as nullable (schema only —
  the actual text/URL values are not recoverable once dropped).
- Adding `gbif_key` and its partial unique index is purely additive/reversible
  (`down()` drops the index and column).
- Dropping the `scientific_name` uniqueness constraint and not restoring it
  in `down()`'s inverse is intentional — the previous constraint doesn't
  apply to the new model; `down()` should recreate it anyway for a clean
  schema-level reversal, understanding that if duplicate names accumulated
  in the meantime, `down()` would fail until deduplicated (documented risk).
- Code rollback (reverting the PR) restores all removed source files via git.
  No plant/planting-spots data is touched at all — those two contexts have no
  migration in this change.

---

## 4. Delivery

**Recommendation: single PR.** Unlike the previous draft, this no longer
touches `plants`' schema or `planting-spots` at all — the diff is now
concentrated in one context (`plant-species`) plus a small, well-contained
edit to `plants`' command handlers/DTOs. Estimate: comfortably within normal
review size; no chaining needed unless the tasks phase finds otherwise.

**Risk assessment: MEDIUM** — the migration still drops columns with real
data (`description`/`image_url`); no table is dropped, no cross-context
schema is touched outside `plant-species`.

---

## 5. Open questions

1. **Keep manual `CreatePlantSpecies`/`UpdatePlantSpecies`/`DeletePlantSpecies`
   mutations?** *Assumed: yes, keep them* — trimmed to the new fields, as a
   lower-traffic manual/admin path alongside `FindOrCreatePlantSpeciesByGbifKey`
   (which is what the normal "search → pick → create/edit plant" flow uses).
   Confirm at apply time if these should instead become internal-only
   (unexposed via transport).
2. **`gbif_key` uniqueness enforcement** — assumed a partial unique index
   (`WHERE gbif_key IS NOT NULL`) so legacy `NULL` rows don't collide, while
   new rows are strictly unique per GBIF key.
3. **`scientificName` uniqueness dropped entirely** — assumed acceptable
   since `gbifKey` is now the authoritative external identity; two catalog
   rows could theoretically carry the same display name from GBIF taxonomy
   quirks (rare). Flag if strict name-uniqueness is still wanted.
4. **GBIF `/species/suggest` response shape** — same assumption as before:
   `key` → `gbifKey`, `canonicalName`/`scientificName` → `scientificName`;
   confirm exact fields against a live call at implementation time.

---

## 6. What changed from the earlier draft (for the record)

| | Earlier draft | This revision |
|---|---|---|
| `plant-species` context | Deleted entirely | Kept, trimmed to `scientificName`+`gbifKey` |
| `Plant.plantSpeciesId` | Removed (replaced by 2 denormalized fields) | **Unchanged** |
| `plants` migration | Drop column + FK | **None** |
| `planting-spots` | Field-swap migration/mirror update | **No change at all** |
| New search capability | New bounded context `plant-species-search` | Lives inside the existing `plant-species` context |
| Linking a plant to a search result | Plant stores gbifKey+name directly | `FindOrCreatePlantSpeciesByGbifKey` upserts a catalog row, Plant keeps its FK |
| Blast radius | 3 contexts + 1 new context, ~900-1200 lines, 2 chained PRs | 1 context + small `plants` edit, single PR |

This revision is deliberately less destructive at the user's request, while
still satisfying GDN-35's AC1–AC4: search stays fully live/non-persisting,
species selection still flows into the relevant plant, GBIF errors are still
handled gracefully. The one trade-off: the catalog table itself persists
`scientificName`+`gbifKey` per linked species (by design, per the user's
explicit choice) — a stricter reading of AC2 ("no species metadata persisted
locally") would call this a deviation; the user has confirmed this is
intentional and acceptable.
