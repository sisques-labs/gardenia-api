# Delta for Rollout — Type-Safe Criteria Fields (harvests, plant-species, planting-spots, care-log)

**Change:** typed-criteria-fields
**Date:** 2026-06-20

This delta generalizes the users/plants pattern to every remaining bounded context that
exposes a GraphQL find-by-criteria input. `spaces` and `auth` use `Criteria` internally
but expose no such GraphQL input, so they are out of scope.

---

## ADDED Requirements

### Requirement: Per-Context Criteria Field Enums

Each of `harvests`, `plant-species`, `planting-spots`, and `care-log` MUST define a
`{Name}FilterFieldEnum` and `{Name}SortFieldEnum` in its `domain/enums/`. Every enum
value MUST equal an actual field of that context's read ViewModel (`HarvestViewModel`,
`PlantSpeciesViewModel`, `PlantingSpotViewModel`, `CareLogEntryViewModel`), so the value
passed to `Criteria` matches the read model and persistence column. A drift guard spec
MUST assert this per context.

#### Scenario: Enum values match the view model

- GIVEN a context's filter-field and sort-field enums
- WHEN each enum value is compared to that context's ViewModel fields
- THEN every value is a real ViewModel field name

---

### Requirement: Per-Context Criteria Input Is Enum-Typed

Each context's `*FindByCriteriaRequestDto` MUST extend the shared
`createFindByCriteriaInput` factory so that its GraphQL find-by-criteria query constrains
`filters[].field` and `sorts[].field` to the context's enums. Both enums MUST be
registered with GraphQL. Generated input type names MUST NOT collide across contexts.

#### Scenario: Schema types each context's criteria fields to its enums

- WHEN the combined GraphQL schema is generated
- THEN `HarvestFilterInput.field` is `HarvestFilterFieldEnum!`,
  `PlantSpeciesFilterInput.field` is `PlantSpeciesFilterFieldEnum!`,
  `PlantingSpotFilterInput.field` is `PlantingSpotFilterFieldEnum!`,
  and `CareLogFilterInput.field` is `CareLogFilterFieldEnum!`
- AND the corresponding `*SortInput.field` are typed to each `*SortFieldEnum`
- AND no input type names collide across contexts

#### Scenario: Unknown field is rejected by the schema

- WHEN any context's find-by-criteria query is dispatched with a `field` not in its enum
- THEN the GraphQL layer rejects the request before any repository call

---

### Requirement: Downstream Unchanged (rollout)

This rollout MUST NOT modify `Criteria`, any resolver's `new Criteria(...)` call, queries,
handlers, or repositories. Enum values being strings, runtime behavior MUST be identical
to before.

#### Scenario: Resolvers and handlers untouched

- GIVEN the typed request DTOs
- WHEN each find-by-criteria query runs
- THEN `new Criteria(input.filters, input.sorts, input.pagination)` and the handlers behave exactly as before the change
