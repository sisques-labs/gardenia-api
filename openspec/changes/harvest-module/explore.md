# Explore: Harvest Module

**Date:** 2026-06-12

## Summary

Session exploring what "cosecha" (harvest) means in the Gardenia domain and how to model it.

## Key Decisions

### Harvest is keyed by crop type, not by individual plant
Gardenia users may have 10 tomato plants but want to record "we harvested 4kg of cherry tomatoes today" — not per-plant. The aggregate is NOT linked to `PlantAggregate`.

### Free-text `cropType` for v1
Three options were evaluated: FK to `plant-species`, free-text, or a hybrid. Free-text was chosen to avoid forcing users to catalog species before recording a harvest. Structured linking (`plantSpeciesId`) is deferred to a future change.

### Fixed unit enum
Units: `KG | G | PIECES | LITERS | ML | BUNCHES`. Free-text units rejected because they would block future aggregation queries.

### `quantity` is decimal
Integer was rejected — 2.5 kg, 0.75 liters are real-world values.

### Any space member can create / update / delete
No ownership gate. Collaborative harvest log model.

### Dual transport: REST + GraphQL
Consistent with all other bounded contexts in the project.

### No cross-context dependencies
`harvests` is fully standalone in v1.

## Explored but Rejected

- Per-plant harvest (too granular for the use case described)
- Link to `plant-species` catalog (friction for v1; deferred)
- Free-text units (loses structured data)
- Owner-only edit/delete (collaborative model preferred)
