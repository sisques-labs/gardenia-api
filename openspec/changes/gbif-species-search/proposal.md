# Proposal: Live GBIF species search, remove the local plant-species catalog

**Change**: `gbif-species-search`
**Issue**: GDN-35 — https://sisqueslabs.atlassian.net/browse/GDN-35
**Status**: proposed
**Artifact store**: openspec

---

## 1. Intent

### What
1. **Remove** the `plant-species` bounded context entirely — domain, application,
   infrastructure, transport (REST/GraphQL/MCP), the `plant_species` table, and
   every cross-context reference to it from `plants` and `planting-spots`.
2. **Replace** `Plant.plantSpeciesId` (a UUID FK into the now-deleted catalog) with
   two plain, denormalized fields owned by `Plant` itself: `gbifSpeciesKey` (GBIF's
   numeric `usageKey`) and `speciesScientificName` (the scientific name as chosen
   by the user at selection time).
3. **Add** a new, read-only, non-persisting `plant-species-search` bounded context
   that queries GBIF's `/species/suggest` endpoint live and returns candidates for
   autocomplete. Nothing it returns is ever written to our database.

### Why now
GDN-35 asks for live species autocomplete against GBIF with **zero local
persistence** of species data. The repo already has a `plant-species` bounded
context (catalog CRUD + `ImportPlantSpeciesFromGbif` + `EnrichPlantSpecies`,
shipped and merged) that does the opposite: it imports and stores species rows
locally, and `Plant` links to them via FK. The user has confirmed (decision
recorded in conversation, not re-litigated here) that GDN-35 supersedes that
catalog: the catalog is deleted outright, and a plant's species becomes an
attribute of the plant itself (mirroring how `Plant.imageUrl` already works —
a plain string owned by the plant, not a row in a shared table).

### Success looks like
- Typing a species name anywhere species search is exposed hits GBIF live
  (`/species/suggest`) and returns candidates; nothing from that response is
  persisted anywhere.
- Creating/updating a `Plant` with a chosen `gbifSpeciesKey` +
  `speciesScientificName` just stores those two values on the plant row — no
  external call, no existence check against a local catalog (there isn't one).
- The `plant_species` table, and every file under `src/contexts/plant-species/`,
  is gone. No dangling imports, no orphaned migrations left un-run.
- `plants` and `planting-spots` (which mirrors `plantSpeciesId` for its own
  read model) compile and pass tests against the new fields.

---

## 2. Scope

### Bounded contexts impacted
- **`plant-species`** — deleted entirely (domain/application/infrastructure/transport).
- **`plants`** — `plantSpeciesId` (UUID VO, FK semantics) replaced by
  `gbifSpeciesKey` (number, nullable) + `speciesScientificName` (string, nullable).
  Cross-context port to `plant-species` (`IPlantSpeciesPort`), its adapter, the
  `species`-resolved GraphQL field, and the linked-species-exists assertion are
  all removed — there is nothing left to look up.
- **`planting-spots`** — `PlantingSpotPlant` (a read-model mirror built from
  `Plant` for planting-spot display) currently mirrors `plantSpeciesId`; it must
  mirror the two new fields instead.
- **`plant-species-search`** (new) — a small, stateless bounded context: one
  query, one port, one GBIF-backed adapter. No aggregate, no repository, no
  persistence of any kind.

### In scope
- DB migration: alter `plants` (drop `plant_species_id` column + FK, add
  `gbif_species_key int NULL`, `species_scientific_name varchar(300) NULL`,
  best-effort backfill of `species_scientific_name` from the current catalog
  before it's dropped); drop `plant_species` table.
- Full removal of `src/contexts/plant-species/` and its tests
  (`test/integration/plant-species/`, `test/e2e/plant-species/`).
- `plants` domain/application/infrastructure/transport updated for the field swap.
- `planting-spots` read-model mirror updated for the field swap.
- New `plant-species-search` context: `GbifSpeciesSearchQuery` +
  handler, `IGbifSpeciesSearchPort`, `GbifSpeciesSuggestAdapter` (calls
  `GET /v1/species/suggest`), GraphQL query + REST endpoint + MCP tool.
- README updates for `plants`, `planting-spots`, and the new
  `plant-species-search` context (per `openspec/config.yaml` apply rule).

### Out of scope
- Any change to `gardenia-web` (separate proposal, drafted after this one is
  approved).
- Caching or storing GBIF search results anywhere, even transiently (no Redis,
  no in-memory TTL cache) — every autocomplete keystroke that reaches the API
  hits GBIF directly, per AC2.
- Validating that a submitted `gbifSpeciesKey` actually exists in GBIF at
  create/update-plant time (see Design §ADR — deliberately not done: it would
  reintroduce a mandatory external dependency on the write path, which is
  exactly what GDN-35 removes).
- Re-adding taxonomy/description/image data — GDN-35 explicitly limits this to
  name/autocomplete.
- The `Criteria`/`findByCriteria` filter pattern for the new search — it's a
  live external passthrough, not a persisted list (called out explicitly so
  reviewers don't flag it as a missed convention).

---

## 3. Rollback plan (risky change)

This change drops a table and a column that hold real data (per
`openspec/config.yaml`: "Include rollback plan for risky changes" /
"Warn before merging destructive deltas — this qualifies").

- **Before the drop migration runs**, `species_scientific_name` on `plants` is
  backfilled from the current `plant_species.scientific_name` via a plain SQL
  `UPDATE ... FROM` in the same migration, so the human-readable species name
  survives the cutover. `gbifSpeciesKey` CANNOT be backfilled — the old catalog
  never stored a GBIF key, so it starts `NULL` for all pre-existing plants.
  This is called out as an accepted, irreversible data gap.
- **Migration `down()`**: recreates `plant_species` (empty — data is not
  restorable, Postgres `DROP TABLE` is not reversible) and reverts `plants`
  columns (`gbif_species_key`/`species_scientific_name` dropped,
  `plant_species_id` re-added as `NULL`, FK not restored since the referenced
  rows are gone). This down migration restores **schema shape only**, not data —
  documented inline in the migration file.
- **Code rollback**: reverting this PR/branch restores all deleted
  `plant-species` source files via git; it does **not** restore dropped data.
  If a real rollback is ever needed, it must happen before the drop migration
  is applied to a database that matters (i.e., roll back code + DB together in
  the same maintenance window, not independently).
- **Recommendation**: take a full DB backup (or a `pg_dump` of `plant_species`
  and `plants.plant_species_id` specifically) immediately before this migration
  runs in any environment with real data, even though this is pre-production.

---

## 4. Delivery

**Recommendation: two chained PRs**, given the diff spans a full context
deletion + two context modifications + one new context:

1. **PR 1 — removal + field swap**: delete `plant-species`, migrate `plants` +
   `planting-spots`, update all cross-context wiring, update READMEs. This is
   the destructive/risky half; keeping it isolated makes it easy to review and,
   if needed, revert independently of PR 2.
2. **PR 2 — new capability**: add `plant-species-search` (query, port, GBIF
   adapter, all three transports, tests). Purely additive, no schema changes,
   low risk, depends on PR 1 only for the removed `plant-species` module slot
   being free (no hard code dependency).

If the tasks phase forecasts either slice under ~400 lines comfortably, they
may be delivered as a single PR instead — final call at tasks/apply time.

**Risk assessment: MEDIUM-HIGH** — the only risk driver is the destructive
migration (data loss on `gbifSpeciesKey` backfill, table drop). Everything else
(new query context, field rename mechanics) is low-risk, following established
patterns already used across `plants`/`plant-species`/`planting-spots`.

---

## 5. Open questions

1. **GBIF `/species/suggest` result shape** — assumed fields: `key` (usageKey,
   → `gbifSpeciesKey`), `canonicalName`/`scientificName` (→
   `speciesScientificName`), optionally `rank`/`status`/`kingdom` (not
   surfaced). *Assumed: only key + name are exposed to clients; confirm at
   design/implementation if GBIF's actual response needs light filtering
   (e.g. restrict to `rank=SPECIES` server-side).*
2. **Suggest endpoint limit param** — GBIF's `/species/suggest` defaults to a
   small page size. *Assumed: expose an optional `limit` input (default ~10,
   cap ~20) matching typeahead UX needs; no offset/pagination since this isn't
   a browsable list.*
3. **Does anything else depend on the deleted REST/GraphQL/MCP surface of
   `plant-species`?** — repo-wide search only found `plants` and
   `planting-spots` as consumers (both covered above). *Assumed: no other
   context or external consumer (e.g. a saved Postman collection, a mobile
   client) depends on the old `plant-species` endpoints — flagged here in case
   the user knows of one we can't see in this repo.*
4. **`gbifSpeciesKey` validation depth** — no format validation beyond
   "positive integer" (matches the "no existence check" decision above).
   *Assumed: acceptable; GBIF is the source of truth for whether a key is
   real, and we don't call it back to verify.*

These are low-stakes with working assumptions; none block starting the
spec/design phases.
