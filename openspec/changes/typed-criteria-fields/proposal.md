# Proposal: Type-Safe Criteria Filter/Sort Fields via Per-Context Enums

## Intent

Today every `*FindByCriteriaRequestDto` is an empty shell extending the kit's
`BaseFindByCriteriaInput`, whose `filters[].field` and `sorts[].field` are free-form
`string`s. Clients hand-write field names (`"username"`, `"createdAt"`, `"status"`),
so a typo or an unknown field passes API validation and either is silently ignored or
crashes at the DB layer. There is no schema contract, no autocompletion, and — because
some read repos interpolate `field` straight into SQL (e.g. harvests:
`` qb.andWhere(`LOWER(harvest.${filter.field}) LIKE ...`) ``) — a free `field` is also
an injection surface.

We make the filterable/sortable fields a closed, per-bounded-context enum derived from
the ViewModel, surfaced as a GraphQL enum so the schema itself rejects unknown fields,
while each bounded context stays the sole owner of its own field set.

## Scope

### In Scope
- A shared GraphQL factory `createFindByCriteriaInput` in
  `src/core/transport/graphql/criteria/` that, given a context's filter-field enum and
  sort-field enum, produces a typed `FindByCriteria` `@InputType` whose `filters[].field`
  and `sorts[].field` are the enums.
- Per-context domain enums `{Name}FilterFieldEnum` and `{Name}SortFieldEnum` in
  `domain/enums/`, whose values are the ViewModel field names.
- GraphQL registration of the new enums in each context's existing
  `*-registered-enums.graphql.ts`.
- Pilot wiring end-to-end in the `users` context (request DTO + enums + e2e).

### Out of Scope
- Validating a filter's **value** against its field type (e.g. forcing `status` to be a
  `UserStatusEnum`). Only the `field` is constrained in this change.
- Changing the kit (`@sisques-labs/nestjs-kit`), `Criteria`, repositories, queries, or
  handlers — enum values are strings, so runtime behavior is unchanged.
- Rolling the pattern out to the remaining contexts (`plants`, `harvests`, `care-log`,
  `spaces`, `auth`, `planting-spots`); that follows once the pilot is validated.

## Capabilities

### New Capabilities
- Shared transport capability: a reusable typed criteria-input factory parameterized by
  per-context field enums.

### Modified Capabilities
- `users`: the `usersFindByCriteria` GraphQL input MUST constrain `filters[].field` and
  `sorts[].field` to `UserFilterFieldEnum` / `UserSortFieldEnum` instead of free strings.

## Approach

Enum values ARE the ViewModel field strings (`CREATED_AT = 'createdAt'`). Because repos
already consume `criteria.sorts[].field` / `criteria.filters[].field` as strings and
`new Criteria(input.filters, input.sorts, input.pagination)` is untouched, the enum only
narrows the input type at the GraphQL/TS boundary — nothing downstream changes. The
factory builds three `@InputType` classes per context (`{Name}FilterInput`,
`{Name}SortInput`, `{Name}FindByCriteriaInput`) with unique GraphQL type names derived
from `name`, reusing the kit's `FilterOperator` / `SortDirection` and pagination shape.
Each context defines its two enums, registers them with GraphQL, and replaces its empty
request DTO with a one-line `extends createFindByCriteriaInput({...})`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/core/transport/graphql/criteria/create-find-by-criteria-input.factory.ts` | New | Generic typed criteria-input factory |
| `src/contexts/users/domain/enums/user-filter-field.enum.ts` | New | Filterable ViewModel fields |
| `src/contexts/users/domain/enums/user-sort-field.enum.ts` | New | Sortable ViewModel fields |
| `src/contexts/users/transport/graphql/enums/user/user-registered-enums.graphql.ts` | Modified | Register the two new enums |
| `src/contexts/users/transport/graphql/dtos/requests/user/user-find-by-criteria.request.dto.ts` | Modified | Extend the factory output |
| `test/users.e2e-spec.ts` (or new) | Modified | Assert enum-typed criteria input |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Kit's exact pagination/value GraphQL types unknown until deps installed | Med | Prefer extending `BaseFindByCriteriaInput` and only re-declaring `filters`/`sorts`; fall back to standalone fields mirroring the kit |
| GraphQL code-first field override on subclass not supported | Low | Factory builds a standalone `@InputType` keeping property names identical |
| Enum value drifts from actual ViewModel field name | Low | Pilot e2e exercises a real filter+sort; values reviewed against the ViewModel |

## Rollback Plan

Code-only, no migration. Revert the request DTO to the empty `extends BaseFindByCriteriaInput {}`,
remove the two enums and their registration, and delete the factory. No DB, no entity, no
query/handler/repository touched.

## Dependencies

- `@sisques-labs/nestjs-kit` exports `FilterOperator`, `SortDirection`, and
  `BaseFindByCriteriaInput` (already used across the codebase).

## Success Criteria

- [ ] `createFindByCriteriaInput` produces a GraphQL `@InputType` with `field` typed to the supplied enums.
- [ ] `usersFindByCriteria` rejects an unknown `field` at the GraphQL schema layer.
- [ ] `UserFilterFieldEnum` / `UserSortFieldEnum` values match `UserViewModel` fields.
- [ ] `Criteria`, the query, handler, and repository remain unchanged.
- [ ] Pilot e2e filters and sorts users by an enum field and passes.
