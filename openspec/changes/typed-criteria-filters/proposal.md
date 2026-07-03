# Proposal: Type-Safe Criteria Filters (field enum + validated value)

## Intent

`Criteria`/`Filter` (from `@sisques-labs/nestjs-kit`) is the shared query
mechanism behind every `{Entity}FindByCriteriaRequestDto` in the API. Today
`BaseFilterInput` (and `BaseSortInput`) expose `field` as a bare `String!` and
`value` as a bare `String!`. Nothing stops a client from filtering on an
internal/unsupported field name, and nothing validates that the value makes
sense for that field — e.g. a status-like field could receive any string, and
the `IN` operator (already defined in `FilterOperator`) cannot actually be used
from GraphQL because `value` cannot carry an array.

We want to keep the **flexible, array-based Criteria pattern** (clients build
an arbitrary list of `{field, operator, value}` filters and `{field,
direction}` sorts) — not replace it with fixed per-field DTO properties — while
closing both gaps:

1. `field` is restricted, per context, to a registered GraphQL enum of the
   fields that context actually allows querying on (whitelist, not free text).
2. `value` is validated server-side against a per-context registry that knows,
   for each allowed field, its expected shape — and, when the field is backed
   by a domain enum (e.g. a future `PlantStatusEnum`), validates membership
   against that enum's real values (`Object.values(enum)`), sourced from
   `domain/enums/`, not duplicated anywhere else.

Why `plants` as the pilot: it already has a real GraphQL query
(`plantsFindByCriteria`), a real consumer screen in `gardenia-web`
(`plants-list.screen.tsx`, which has a disabled "Filters" button and disabled
category tabs waiting to be wired up), and — critically — its TypeORM read
repository **currently ignores `criteria.filters` entirely**, so this change
also closes that pre-existing gap. `plants` has no enum field yet
(`plant-registered-enums.graphql.ts` is an empty scaffold), so this pilot
proves the mechanism end-to-end on plain fields (string/uuid/date); enum-value
validation itself is proven by unit tests in the shared mechanism (in
`@sisques-labs/nestjs-kit`) and is a one-line addition to the field registry
the day `plants` (or any other context) gets a real enum.

## Scope

### In Scope

- Bump `@sisques-labs/nestjs-kit` to the version that ships (tracked as a
  plain PR in that repo, no OpenSpec there):
  - `createFilterInput(fieldEnum, contextName)` factory producing a
    per-context `{Context}FilterInput extends BaseFilterInput` with `field`
    typed to `fieldEnum` instead of `String`.
  - `BaseFilterInput.value` changed from `String!` to a `GraphQLJSON` scalar
    (so `IN` can carry an array; other operators keep passing a scalar).
  - A `FilterFieldRegistry<TField>` type + a shared NestJS pipe/guard that
    validates, per query, that every `filter.value` matches the type declared
    for `filter.field` in the context's registry (including enum membership).
  - `BaseSortInput.field` gets the same per-context enum treatment via an
    equivalent `createSortInput` factory (reusing the same field enum as
    filters, since sortable fields = filterable fields here).
- `plants` context:
  - `PlantQueryableFieldEnum` (`NAME`, `PLANT_SPECIES_ID`, `PLANTING_SPOT_ID`,
    `CREATED_AT`, `UPDATED_AT`), registered via `registerEnumType`.
  - `plantFilterableFields` registry: `name` (string, `LIKE`-eligible),
    `plantSpeciesId` / `plantingSpotId` (uuid), `createdAt` / `updatedAt`
    (date) — no enum entries yet (none exist for plants).
  - `PlantFindByCriteriaRequestDto` switches `filters`/`sorts` to the
    generated `PlantFilterInput` / `PlantSortInput`.
  - Wire the shared validation pipe into `plant-queries.resolver.ts`.
  - Rewrite `PlantTypeOrmReadRepository.findByCriteria` to actually apply
    `criteria.filters` (today it only applies pagination/sort) using a
    TypeORM `QueryBuilder`, translating every `FilterOperator` value
    (`EQUALS`, `NOT_EQUALS`, `LIKE`, `IN`, `GREATER_THAN`, `LESS_THAN`,
    `GREATER_THAN_OR_EQUAL`, `LESS_THAN_OR_EQUAL`) into `andWhere` clauses.
  - Update `src/contexts/plants/README.md` to document the new queryable
    fields.
  - Tests: unit (registry validation, filter mapper, query-builder
    translation) + e2e (`plantsFindByCriteria` with real filter/sort
    combinations against Postgres).

### Out of Scope (explicit)

- Any new `PlantStatusEnum` or other plants business enum — no invented
  domain concept. When one is added later, it is a one-line registry entry on
  top of this mechanism.
- Rolling the mechanism out to other contexts (`users`, `inventory`,
  `harvests`, ...). Each is a separate follow-up change once this pilot is
  verified; `users` is the next natural candidate since `UserStatusEnum`
  already exists and its TypeORM read repository has the same
  filters-are-ignored gap.
- Changing the `Criteria`/`Filter` **domain** entity shape
  (`{field, operator, value}` stays as-is) — only the GraphQL-facing input
  layer and the persistence-layer translation change.
- The `@sisques-labs/nestjs-kit` implementation itself — tracked as a plain
  PR in that repo and consumed here as a version bump.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `BaseFilterInput.value: String! → JSON` is a breaking GraphQL schema change for any existing client already sending string values | Low | Med | `gardenia-web` sends no `filters` today for any `find-by-criteria` query (verified) — no live client depends on the old shape |
| QueryBuilder rewrite of `PlantTypeOrmReadRepository.findByCriteria` regresses existing pagination/sort behaviour | Med | High | Cover current behaviour (no filters, sort by `createdAt`) with an e2e test *before* adding filter support; keep it green throughout |
| Field/value registry drifts from the entity's real columns over time | Low | Med | Registry lives next to the entity in the same context; `plant-typeorm-read.repository.spec.ts` asserts every registry field maps to a real query-buildable column |
| Validation pipe rejects a value that should be legal for a given operator (e.g. array only valid for `IN`) | Med | Low | Unit-test the operator/type compatibility matrix in the shared pipe (nestjs-kit) before wiring it into any context |

## Rollback Plan

Additive and structural: new GraphQL types (`PlantQueryableFieldEnum`,
`PlantFilterInput`, `PlantSortInput`), a new registry file, a new query-builder
path in the read repository, and a dependency bump. No database migration, no
data impact. Rollback = revert the branch and pin `@sisques-labs/nestjs-kit`
back to the previous version; `plantsFindByCriteria` keeps working exactly as
it does today (no filters applied) if reverted.

## Success Criteria

- [ ] `plantsFindByCriteria(input: { filters, sorts })` accepts only
      `PlantQueryableFieldEnum` values for `field`, and rejects (400) any
      `value` that doesn't match the registry for that field.
- [ ] `PlantTypeOrmReadRepository.findByCriteria` applies every
      `FilterOperator` correctly against Postgres.
- [ ] `IN` operator works end-to-end with an array value.
- [ ] `src/contexts/plants/README.md` documents the queryable fields.
- [ ] Unit + e2e green; coverage ≥ 80% on touched files.
