# Design: Type-Safe Criteria Filters

## 1. Guiding principle

`Criteria` stays a flexible array (`filters: Filter[]`, `sorts: Sort[]`) — the
client still assembles an arbitrary combination at query time. We are not
introducing fixed, named filter properties per entity (that trades away the
flexibility this pattern exists for). Instead we tighten the two axes that are
unconstrained today, `field` and `value`, without touching the shape.

```
Filter { field: string; operator: FilterOperator; value: any }   // unchanged, domain-level
```

Only the **GraphQL-facing** input types and the **persistence-layer**
translation change.

## 2. `field` — per-context whitelist enum

### Options considered

1. Keep `field: String!`, validate against a whitelist array at runtime only.
   Rejected as the sole mechanism: no schema-level autocomplete/dropdown, and
   a typo'd field name still round-trips through validation instead of being
   impossible to construct.
2. One shared GraphQL enum listing every filterable field across all
   contexts. Rejected: a `users` client could technically select
   `plantSpeciesId`, meaningless cross-context noise, and the enum would grow
   unbounded and need editing for every context's feature work.
3. **Per-context enum + factory-generated `{Context}FilterInput`.** Each
   context declares its own small enum of queryable fields; a shared factory
   in `nestjs-kit` produces the concrete GraphQL `InputType` so the
   boilerplate isn't hand-written per context.

### Decision

Option 3, following the same idiom already used for
`BasePaginatedResultDto` → `PaginatedUserResultDto` (subclass a base GraphQL
type to specialize one field):

```ts
// nestjs-kit (consumed via version bump, implemented in that repo's own PR)
export function createFilterInput(fieldEnum: object, contextName: string) {
  @InputType(`${contextName}FilterInput`)
  class FilterInput extends BaseFilterInput {
    @Field(() => fieldEnum, { description: 'The field to filter by' })
    declare field: string;
  }
  return FilterInput;
}
```

```ts
// plants/transport/graphql/enums/plant/plant-queryable-field.enum.ts
export enum PlantQueryableField {
  NAME = 'name',
  PLANT_SPECIES_ID = 'plantSpeciesId',
  PLANTING_SPOT_ID = 'plantingSpotId',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}
registerEnumType(PlantQueryableField, { name: 'PlantQueryableFieldEnum' });

// plants/transport/graphql/dtos/requests/plant/plant-filter.input.ts
export class PlantFilterInput extends createFilterInput(
  PlantQueryableField,
  'Plant',
) {}
```

Same treatment for sorting (`createSortInput`, same field enum — sortable
fields are the same set as filterable fields for `plants`; a context is free
to pass a narrower enum if that ever diverges).

## 3. `value` — JSON scalar + per-context type/enum registry

GraphQL cannot express "the type of this field depends on the sibling
`field` value" — there is no dependent typing. Keeping the array shape
therefore means `value` cannot be statically typed to a specific enum inside
the schema. Two moves compensate for that without giving up the array:

**3.1 Scalar**: `BaseFilterInput.value` becomes `GraphQLJSON`
(`graphql-type-json`) instead of `String!`. This is required regardless of
enum support: the existing `IN` operator is unusable today because a `String!`
value can never be an array, and `plants` doesn't even reach that codepath
since its read repo drops filters entirely (see §4).

**3.2 Registry**: each context declares what each field expects:

```ts
// plants/transport/graphql/registries/plant-filterable-fields.registry.ts
export const plantFilterableFields: FilterFieldRegistry<PlantQueryableField> = {
  name: { type: 'string' },
  plantSpeciesId: { type: 'uuid' },
  plantingSpotId: { type: 'uuid' },
  createdAt: { type: 'date' },
  updatedAt: { type: 'date' },
  // the day PlantStatusEnum exists:
  // status: { type: 'enum', enum: PlantStatusEnum },
};
```

A shared pipe/guard (nestjs-kit) runs before the resolver body, for every
entry in `input.filters`:
- looks up `registry[filter.field]`
- if `type: 'enum'`, checks `filter.value` (or every element, when
  `operator === IN`) is in `Object.values(entry.enum)` — the enum comes
  straight from `domain/enums/`, never redeclared
- if `type: 'uuid' | 'string' | 'date'`, checks the JS type / format matches
- throws a `BadRequestException` listing the offending field on mismatch

This is exactly what closes the original ask: a value for an enum-backed
field must come from that field's real domain enum — while `filters` stays a
free-form array the client builds however it wants.

```
sequenceDiagram
  participant C as Client
  participant R as PlantQueriesResolver
  participant V as FilterValidationPipe
  participant H as PlantFindByCriteriaHandler
  participant Repo as PlantTypeOrmReadRepository
  C->>R: plantsFindByCriteria({filters:[{field:NAME,operator:LIKE,value:"rosa"}]})
  R->>V: validate(input.filters, plantFilterableFields)
  V-->>R: ok (or throws BadRequestException)
  R->>H: PlantFindByCriteriaQuery(criteria)
  H->>Repo: findByCriteria(criteria)
  Repo->>Repo: buildQuery(criteria.filters) via QueryBuilder
  Repo-->>H: PaginatedResult<PlantViewModel>
```

## 4. Persistence: `PlantTypeOrmReadRepository.findByCriteria`

Today: `repo.findAndCount({ skip, take, order })` — `criteria.filters` is read
nowhere. Rewrite using `QueryBuilder` so operators translate 1:1:

```ts
async findByCriteria(criteria: Criteria): Promise<PaginatedResult<PlantViewModel>> {
  const { page, limit, skip } = await this.calculatePagination(criteria);
  const qb = this.repo.createQueryBuilder('plant');

  criteria.filters?.forEach((f, i) => {
    const param = `p${i}`;
    switch (f.operator) {
      case FilterOperator.EQUALS: qb.andWhere(`plant.${f.field} = :${param}`, { [param]: f.value }); break;
      case FilterOperator.NOT_EQUALS: qb.andWhere(`plant.${f.field} != :${param}`, { [param]: f.value }); break;
      case FilterOperator.LIKE: qb.andWhere(`plant.${f.field} ILIKE :${param}`, { [param]: `%${f.value}%` }); break;
      case FilterOperator.IN: qb.andWhere(`plant.${f.field} IN (:...${param})`, { [param]: f.value }); break;
      case FilterOperator.GREATER_THAN: qb.andWhere(`plant.${f.field} > :${param}`, { [param]: f.value }); break;
      case FilterOperator.LESS_THAN: qb.andWhere(`plant.${f.field} < :${param}`, { [param]: f.value }); break;
      case FilterOperator.GREATER_THAN_OR_EQUAL: qb.andWhere(`plant.${f.field} >= :${param}`, { [param]: f.value }); break;
      case FilterOperator.LESS_THAN_OR_EQUAL: qb.andWhere(`plant.${f.field} <= :${param}`, { [param]: f.value }); break;
    }
  });

  criteria.sorts?.forEach((s) => qb.addOrderBy(`plant.${s.field}`, s.direction));
  if (!criteria.sorts?.length) qb.orderBy('plant.createdAt', 'DESC');

  const [entities, total] = await qb.skip(skip).take(limit).getManyAndCount();
  return new PaginatedResult(entities.map((e) => this.mapper.toViewModel(e)), total, page, limit);
}
```

`plant.${f.field}` is safe from injection here specifically *because* `field`
already passed the enum-typed GraphQL input + registry validation upstream —
it can only ever be one of the whitelisted column names, never arbitrary
client input. This is the other half of why the field-enum work in §2 matters:
it's not just UX, it's what makes string-interpolating the column name into
the query builder safe.

## 5. Apply order

1. Land the `plants` read-repository fix with **no filters/sorts wired to
   GraphQL yet** (still called with `criteria.filters = []` from existing
   resolver) — proves the QueryBuilder rewrite is behaviour-preserving before
   any new surface is exposed.
2. Bump `@sisques-labs/nestjs-kit`, add `PlantQueryableFieldEnum` +
   `PlantFilterInput`/`PlantSortInput` + registry + validation pipe.
3. Wire the resolver + e2e tests last, once both halves are independently
   proven.
