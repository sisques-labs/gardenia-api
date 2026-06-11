# Proposal: Enrich PlantSpecies with scientificName, description, imageUrl

**Change**: `plant-species-enrich`
**Issue**: #172
**Status**: proposed
**Artifact store**: openspec

---

## 1. Intent

### What
Extend the `PlantSpecies` aggregate with three new optional descriptive fields:

| Field | Type | Constraints |
|-------|------|-------------|
| `scientificName` | nullable string | max 300 chars |
| `description` | nullable string | max 2000 chars |
| `imageUrl` | nullable string | max 500 chars |

These fields surface across the full slice: domain, persistence, application commands (create + update), and both GraphQL and REST transports.

### Why now
`PlantSpecies` today carries only `name`, which is insufficient to present a meaningful catalog entry to clients. Issue #172 asks for richer species metadata so the front-end can render a species card (taxonomic name, descriptive text, illustrative image) without joining external data sources. The bounded context is already mature and isolated, so this is a low-risk, additive enrichment.

### Success looks like
- A client can create or update a `PlantSpecies` supplying any combination of the three new fields (or none).
- The fields round-trip cleanly: command → aggregate → entity → DB → view model → response DTO, for both GraphQL and REST.
- Existing species (and existing API calls that omit the fields) continue to work unchanged — the change is fully backward-compatible.
- Field-level domain events are emitted when a value changes, consistent with the existing `name` pattern.

---

## 2. Scope

### In scope
- Three new value objects (`PlantSpeciesScientificName`, `PlantSpeciesDescription`, `PlantSpeciesImageUrl`), each extending `StringValueObject` with nullable semantics, mirroring `Plant.imageUrl`.
- Domain wiring: interface, primitives, aggregate (private fields, getters, `update()`, per-field `changeFoo()`, `toPrimitives()`), builder (`withFoo()`, `build()`, `buildViewModel()`), and view model.
- Three new field-changed domain events under `domain/events/field-changed/`.
- Persistence: 3 nullable columns on the `plant_species` entity + mapper updates + one backward-compatible migration (`ADD COLUMN ... NULL`).
- Application: optional inputs on `CreatePlantSpeciesCommand` / `UpdatePlantSpeciesCommand` and their handlers.
- Transport: GraphQL request/response DTOs + mapper; REST request/response DTOs + mapper.
- Tests: extend aggregate spec and create-handler spec; **create the missing** `update-plant-species.handler.spec.ts`.

### Out of scope
- Backfilling or migrating existing species data (all new columns default to NULL).
- Validation beyond length + nullability (no URL format validation, no taxonomy lookup, no image upload/storage — `imageUrl` is a plain string reference).
- Making any of the three fields required or unique.
- Search/filter/sort by the new fields.
- Any change outside the `plant-species` bounded context.
- Internationalization of `description`.

---

## 3. Approach

### Strategy: replicate the proven nullable-VO pattern from `Plant.imageUrl`
Rather than introduce a new convention, we follow the existing reference implementation already established in the `plants` context. Each new field becomes a nullable value object extending `StringValueObject`, flows through `| null` in the interface and primitives, persists as `@Column({ nullable: true })`, and is exposed as `nullable: true` (GraphQL) / `@ApiPropertyOptional` (REST).

**Rationale:**
- **Consistency** — a developer reading `plant-species` should recognize the same shape they saw in `plants`. No new mental model.
- **Backward compatibility** — nullable everywhere means no breaking changes to existing API consumers, no data backfill, no required-field migration.
- **Event symmetry** — each field gets its own `field-changed` event, matching the existing `PlantSpeciesNameChangedEvent`. Because `IPlantSpeciesEventData` is a type alias of `IPlantSpeciesPrimitives`, the new fields automatically appear in event payloads with no extra wiring.

### Migration
Single backward-compatible migration: `ALTER TABLE plant_species ADD COLUMN ... DEFAULT NULL` for each field. No data transformation, safe to roll forward and back.

### Per-field events
Following the `name` precedent, `update()` emits a `*Changed` event per field that actually changed, plus the umbrella `PlantSpeciesUpdatedEvent`. This keeps the aggregate's event vocabulary uniform.

---

## 4. Affected areas

~22 files + 1 migration, all within `src/contexts/plant-species/`:

- **Domain** (~10 files): interface, primitives, aggregate, builder, view model, 3 new VO folders, 3 new event folders.
- **Infrastructure** (~3 files): entity, TypeORM mapper, new migration.
- **Application** (~4 files): create command + handler, update command + handler.
- **Transport** (~5 files): GraphQL request/response DTOs + mapper, REST request/response DTOs + mapper.
- **Tests** (~3 files): aggregate spec (extend), create-handler spec (extend), update-handler spec (**create — currently missing**).

Zero cross-context impact. No read-model projection layer (single TypeORM repo serves read + write).

---

## 5. Delivery

**Recommendation: single PR.**

- The change is additive and mechanical: one repeated pattern applied three times across one bounded context.
- Estimated changed lines are moderate but the diff is highly repetitive (3 near-identical VOs, 3 near-identical events). Reviewer cognitive load is low despite line count.
- No cross-context coordination, no API breakage, no phased rollout needed.

**Risk assessment: LOW**
- No breaking changes (everything nullable/optional).
- Migration is backward-compatible additive DDL.
- Main correctness risk is the missing `update-plant-species.handler.spec.ts` — mitigated by creating it in this change, giving the new update path explicit coverage.

If the tasks phase forecasts the diff exceeding the 400-line budget, fall back to a 2-slice chained PR: (1) domain + persistence + migration, (2) application + transport. The domain slice is independently mergeable and testable.

---

## 6. Open questions

1. **`imageUrl` validation depth** — confirm `imageUrl` is a plain string reference (length-validated only), with no URL-format or reachability validation in this change. *Assumed: yes, matches `Plant.imageUrl`.*
2. **`description` content** — confirm plain text, no markdown/HTML sanitization or i18n in scope. *Assumed: plain string, length-validated only.*
3. **Create-time provenance events** — when fields are supplied at create time, should per-field `*Changed` events fire, or only on update? *Assumed: follow the existing `name` precedent exactly (changed events on update path; create emits creation event only).*

These are low-stakes and have working assumptions; none block starting the spec/design phases.
