# Delta for Plant Species

**Change**: `gbif-species-search`
**Issue**: GDN-35
**Base spec**: `openspec/specs/plant-species/spec.md`

---

## REMOVED Requirements

### Requirement: PlantSpeciesAggregate Fields and Validation
**Reason**: The `plant-species` bounded context is deleted outright — GDN-35
replaces the local species catalog with live GBIF search plus two plain
fields owned by `Plant` (see the `plants` delta in this same change). There is
no more aggregate, no more catalog table.
**Migration**: existing catalog rows' `scientific_name` are best-effort
backfilled into `plants.species_scientific_name` before the `plant_species`
table is dropped (see this change's `design.md` §9). No consumer of this
requirement survives the migration.

### Requirement: Globally Unique Species Name
**Reason**: uniqueness was a catalog-level constraint; there is no catalog.

### Requirement: CreatePlantSpecies Command
**Reason**: no catalog to create entries in.

### Requirement: UpdatePlantSpecies Command
**Reason**: no catalog to update.

### Requirement: DeletePlantSpecies Command
**Reason**: no catalog to delete from.

### Requirement: PlantSpeciesFindById Query
**Reason**: no catalog to query.

### Requirement: PlantSpeciesFindByCriteria Query
**Reason**: no catalog to query.

### Requirement: No Tenant Repository for Catalog
**Reason**: the table itself (`plant_species`) is dropped.

### Requirement: REST Transport
**Reason**: `/plant-species` REST endpoints removed along with the context.

### Requirement: GraphQL Transport
**Reason**: `plant-species` GraphQL queries/mutations removed along with the
context.

### Requirement: Per-Field Domain Events on Update
**Reason**: (added by `plant-species-enrich`) no aggregate remains to emit
field-changed events from.

### Requirement: Value Objects for New Fields
**Reason**: (added by `plant-species-enrich`) `PlantSpeciesScientificNameValueObject`,
`PlantSpeciesDescriptionValueObject`, `PlantSpeciesImageUrlValueObject` are
deleted with the rest of the domain layer. A differently-scoped
`PlantSpeciesScientificNameValueObject` is re-introduced **inside the `plants`
context** (not shared) — see the `plants` delta.

---

## Notes

This spec file becomes moot after this change archives — `plant-species` has
no surviving requirements. The archival step should remove
`openspec/specs/plant-species/spec.md` rather than leave an empty spec on
disk, consistent with `openspec/config.yaml`'s "warn before merging
destructive deltas" rule (surfaced here explicitly for the human reviewer).
