# Delta for Plants — Type-Safe Criteria Fields

**Change:** typed-criteria-fields
**Base spec:** `openspec/specs/plants/spec.md`
**Date:** 2026-06-20

---

## ADDED Requirements

### Requirement: Plants Criteria Field Enums

The `plants` bounded context MUST define `PlantFilterFieldEnum` and `PlantSortFieldEnum`
in `plants/domain/enums/`. Every enum value MUST equal an actual `PlantViewModel` field
name, so the value passed to `Criteria` matches the read model and persistence column.

#### Scenario: Enum values match the view model

- GIVEN `PlantFilterFieldEnum` and `PlantSortFieldEnum`
- WHEN each enum value is compared to `PlantViewModel`'s fields
- THEN every value is a real `PlantViewModel` field name

---

### Requirement: Plants Criteria Input Is Enum-Typed

`PlantFindByCriteriaRequestDto` MUST extend the shared `createFindByCriteriaInput`
factory so that `plantsFindByCriteria` constrains `filters[].field` and `sorts[].field`
to `PlantFilterFieldEnum` / `PlantSortFieldEnum`. Both enums MUST be registered with
GraphQL. An unknown field value MUST be rejected at the GraphQL schema layer rather than
reaching the repository.

#### Scenario: Schema types the criteria fields to the enums

- WHEN the GraphQL schema is generated
- THEN `PlantFilterInput.field` is `PlantFilterFieldEnum!`
- AND `PlantSortInput.field` is `PlantSortFieldEnum!`

#### Scenario: Unknown field is rejected by the schema

- WHEN `plantsFindByCriteria` is dispatched with a `field` value not in the enum
- THEN the GraphQL layer rejects the request before any repository call

---

### Requirement: Downstream Unchanged (plants)

This change MUST NOT modify `Criteria`, `PlantQueriesResolver`,
`PlantFindByCriteriaQuery`, its handler, or any plant repository. Enum values being
strings, runtime behavior MUST be identical to before.

#### Scenario: Resolver and handler untouched

- GIVEN the typed request DTO
- WHEN `plantsFindByCriteria` runs
- THEN `new Criteria(input.filters, input.sorts, input.pagination)` and the handler behave exactly as before the change
