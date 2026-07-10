# Delta for Planting Spots

**Change**: `gbif-species-search`
**Issue**: GDN-35
**Base spec**: none exists yet for `planting-spots` under `openspec/specs/` —
this documents the field swap as an ADDED requirement rather than a MODIFIED
one; a future archival pass should fold this into a proper base spec for the
context.

---

## ADDED Requirements

### Requirement: PlantingSpotPlant Mirrors Plant's Species Fields

`PlantingSpotPlant` (the read-model `planting-spots` builds per plant to
display inside a planting spot) MUST mirror `Plant.gbifSpeciesKey` (number or
null) and `Plant.speciesScientificName` (string or null) instead of the
removed `Plant.plantSpeciesId`.

`PlantingSpotPlantsAdapter` MUST source these two fields directly from the
`PlantViewModel` returned by `PlantFindByCriteriaQuery` — no additional
lookup, cross-context call, or GBIF call is made from `planting-spots`.

(Previously: mirrored `plantSpeciesId: UuidValueObject | null`, a leftover FK
reference into the now-deleted `plant-species` catalog with no further
resolution performed by `planting-spots` itself either.)

#### Scenario: Planting spot plant listing mirrors species fields

- GIVEN a plant in a planting spot with `gbifSpeciesKey: 3152358` and
  `speciesScientificName: "Monstera deliciosa"`
- WHEN `PlantingSpotPlantsAdapter.findByPlantingSpotId` builds the
  planting-spot's plant list
- THEN the resulting `PlantingSpotPlantViewModel` for that plant carries the
  same `gbifSpeciesKey` and `speciesScientificName` values

#### Scenario: Planting spot plant listing with no species chosen

- GIVEN a plant in a planting spot with `gbifSpeciesKey: null` and
  `speciesScientificName: null`
- WHEN the planting spot's plant list is built
- THEN the resulting view model carries both fields as `null`
