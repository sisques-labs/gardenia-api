# Delta for Users — Type-Safe Criteria Fields

**Change:** typed-criteria-fields
**Base spec:** `openspec/specs/users/spec.md`
**Date:** 2026-06-20

---

## ADDED Requirements

### Requirement: Typed Criteria Input Factory

A shared factory `createFindByCriteriaInput` MUST exist in
`src/core/transport/graphql/criteria/` that, given a `name`, a filter-field enum, and a
sort-field enum, returns a GraphQL `@InputType` class whose `filters[].field` and
`sorts[].field` are typed to the supplied enums. The returned class MUST expose the
properties `filters`, `sorts`, and `pagination` so that
`new Criteria(input.filters, input.sorts, input.pagination)` remains valid. Generated
GraphQL type names MUST be unique per `name`.

#### Scenario: Factory yields enum-typed criteria input

- GIVEN a filter-field enum and a sort-field enum
- WHEN `createFindByCriteriaInput({ name, filterFieldEnum, sortFieldEnum })` is called
- THEN the returned class exposes `filters`, `sorts`, `pagination`
- AND its GraphQL input metadata types `filters[].field` and `sorts[].field` to the enums

#### Scenario: Distinct names avoid GraphQL type collisions

- GIVEN two contexts call the factory with different `name` values
- WHEN the GraphQL schema is built
- THEN the generated input type names do not collide

---

### Requirement: Users Criteria Field Enums

The `users` bounded context MUST define `UserFilterFieldEnum` and `UserSortFieldEnum` in
`users/domain/enums/`. Every enum value MUST equal an actual `UserViewModel` field name,
so the value passed to `Criteria` matches the read model and persistence column.

#### Scenario: Enum values match the view model

- GIVEN `UserFilterFieldEnum` and `UserSortFieldEnum`
- WHEN each enum value is compared to `UserViewModel`'s fields
- THEN every value is a real `UserViewModel` field name

---

### Requirement: Users Criteria Input Is Enum-Typed

`UserFindByCriteriaRequestDto` MUST extend the factory output so that `usersFindByCriteria`
constrains `filters[].field` and `sorts[].field` to `UserFilterFieldEnum` /
`UserSortFieldEnum`. Both enums MUST be registered with GraphQL. An unknown field value
MUST be rejected at the GraphQL schema layer rather than reaching the repository.

#### Scenario: Filter and sort by an enum field

- GIVEN existing users in a space
- WHEN `usersFindByCriteria` is dispatched filtering by `STATUS` and sorting by `CREATED_AT`
- THEN the expected page of users is returned

#### Scenario: Unknown field is rejected by the schema

- WHEN `usersFindByCriteria` is dispatched with a `field` value not in the enum
- THEN the GraphQL layer rejects the request before any repository call

---

### Requirement: Downstream Unchanged

This change MUST NOT modify the kit, `Criteria`, `UserQueriesResolver`,
`UserFindByCriteriaQuery`, `UserFindByCriteriaQueryHandler`, or any user repository.
Enum values being strings, runtime behavior MUST be identical to before.

#### Scenario: Resolver and handler untouched

- GIVEN the typed request DTO
- WHEN `usersFindByCriteria` runs
- THEN `new Criteria(input.filters, input.sorts, input.pagination)` and the handler behave exactly as before the change

---

## Out of Scope (typed-criteria-fields delta)

- Validating a filter's value against the field type (e.g. `status` must be `UserStatusEnum`)
- Changing the kit, `Criteria`, repositories, queries, or handlers
- Rolling the pattern out beyond the `users` pilot
