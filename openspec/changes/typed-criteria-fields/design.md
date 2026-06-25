# Design: Type-Safe Criteria Filter/Sort Fields via Per-Context Enums

## Technical Approach

Constrain the `field` of criteria filters and sorts to a closed, per-bounded-context
enum, surfaced as a GraphQL enum, without touching the kit, `Criteria`, repositories,
queries, or handlers. The lever is that a TypeScript enum's values ARE strings: if
`UserSortFieldEnum.CREATED_AT = 'createdAt'`, then `new Criteria(input.filters,
input.sorts, input.pagination)` receives exactly the same runtime strings it does today.
The enum only narrows the type at the GraphQL/TS boundary.

A shared factory `createFindByCriteriaInput` (transport/GraphQL, in `core`) takes a
context's filter-field enum, sort-field enum, and a `name`, and returns a typed
`@InputType` class. Each context defines its two enums in `domain/enums/`, registers
them with GraphQL alongside its existing enums, and swaps its empty request DTO for a
one-line extension of the factory output.

## Architecture Decisions

### Decision: Shared factory vs. hand-written InputTypes per context

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Shared `createFindByCriteriaInput` factory parameterized by enums | One enum + one line per context; single point to evolve (e.g. future value validation) | CHOSEN |
| Hand-written `Filter`/`Sort`/`Criteria` InputTypes per context | Explicit but ~3 InputTypes of boilerplate per context, logic duplicated | Rejected |

**Rationale**: User asked for the cleanest, most scalable option. The factory keeps each
bounded context owning only its enum (its real domain knowledge) while the mechanism
lives once in `core`. A later enhancement (e.g. per-field value typing) lands in one file.

### Decision: Enum values are ViewModel field names (string-valued enums)

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `enum { CREATED_AT = 'createdAt' }` (value = VM field) | Zero changes downstream; `Criteria` and repos consume the string unchanged | CHOSEN |
| Logical enum + infra mapper enum→column | Decouples API from persistence but adds a mapper per context for no current need (VM fields == columns today) | Rejected for now |

**Rationale**: The repos already treat `field` as a string matching the ViewModel/column.
Making the enum value that exact string is the minimal, non-invasive change. If a VM field
ever diverges from its column, the translation belongs in the infra mapper, never exposed
to the client.

### Decision: Separate filter-field and sort-field enums

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `{Name}FilterFieldEnum` + `{Name}SortFieldEnum` | Filterable set rarely equals sortable set; each stays accurate | CHOSEN |
| Single `{Name}FieldEnum` | Less code but conflates two different field sets | Rejected |

**Rationale**: Explicit user decision. A field may be sortable but not a sensible filter
(or vice versa); two enums keep each contract honest.

### Decision: Enums in `domain/enums/`, registration in `transport/graphql/enums/`

Mirrors the existing precedent (`UserStatusEnum` lives in `users/domain/enums/` and is
registered in `users/transport/graphql/enums/user/user-registered-enums.graphql.ts`).
No new convention is introduced; the field enums are domain vocabulary (what the read
model exposes for querying) and GraphQL is just one transport that registers them.

### Decision: Factory reuses kit pagination/value, only narrows `field`

The factory's preferred form extends `BaseFindByCriteriaInput` and re-declares only
`filters` and `sorts` with typed `Filter`/`Sort` input classes, inheriting `pagination`
and the `value` scalar from the kit. If GraphQL code-first does not honor a re-declared
field on a subclass, the factory instead builds a standalone `@InputType` that declares
`filters`, `sorts`, and `pagination` with property names identical to the kit's, so the
resolver's `new Criteria(input.filters, input.sorts, input.pagination)` is unaffected.
This is the one detail to confirm against the installed kit (deps absent in this env).

## Data Flow

    GraphQL request (criteria input)
        │  filters: [{ field: <enum>, operator, value }]
        │  sorts:   [{ field: <enum>, direction }]
        ▼
    UserFindByCriteriaRequestDto  (extends createFindByCriteriaInput({...}))
        │  field is enum-typed → GraphQL schema rejects unknown fields
        ▼
    UserQueriesResolver
        │  new Criteria(input.filters, input.sorts, input.pagination)   ← UNCHANGED
        ▼
    UserFindByCriteriaQuery → handler → IUserReadRepository.findByCriteria
        │  s.field / f.field consumed as strings (enum values)          ← UNCHANGED
        ▼
    PaginatedResult<UserViewModel>

## Factory Contract

```ts
// src/core/transport/graphql/criteria/create-find-by-criteria-input.factory.ts
export interface CreateFindByCriteriaInputOptions {
  name: string;            // 'User' → 'UserFilterInput', 'UserSortInput', 'UserFindByCriteriaInput'
  filterFieldEnum: object; // e.g. UserFilterFieldEnum (already registerEnumType'd)
  sortFieldEnum: object;   // e.g. UserSortFieldEnum
}

export function createFindByCriteriaInput(
  options: CreateFindByCriteriaInputOptions,
): Type<BaseFindByCriteriaInput>;
```

```ts
// users/domain/enums/user-filter-field.enum.ts
export enum UserFilterFieldEnum {
  STATUS = 'status',
  USERNAME = 'username',
  LOCALE = 'locale',
  TIMEZONE = 'timezone',
  CREATED_AT = 'createdAt',
}

// users/domain/enums/user-sort-field.enum.ts
export enum UserSortFieldEnum {
  USERNAME = 'username',
  STATUS = 'status',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}
```

```ts
// users/transport/graphql/dtos/requests/user/user-find-by-criteria.request.dto.ts
@InputType('UserFindByCriteriaRequestDto')
export class UserFindByCriteriaRequestDto extends createFindByCriteriaInput({
  name: 'User',
  filterFieldEnum: UserFilterFieldEnum,
  sortFieldEnum: UserSortFieldEnum,
}) {}
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `core/transport/graphql/criteria/create-find-by-criteria-input.factory.ts` | Create | Generic typed criteria-input factory |
| `core/transport/graphql/criteria/create-find-by-criteria-input.factory.spec.ts` | Create | Unit spec: GraphQL metadata + property shape |
| `users/domain/enums/user-filter-field.enum.ts` | Create | Filterable field enum (VM values) |
| `users/domain/enums/user-sort-field.enum.ts` | Create | Sortable field enum (VM values) |
| `users/transport/graphql/enums/user/user-registered-enums.graphql.ts` | Modify | Register both enums |
| `users/transport/graphql/dtos/requests/user/user-find-by-criteria.request.dto.ts` | Modify | Extend factory output |
| `test/users.e2e-spec.ts` | Modify | Filter + sort by enum field; reject unknown field |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Factory output | Assert returned class exposes `filters`/`sorts`/`pagination` and the GraphQL input metadata uses the supplied enums; unique type names per `name` |
| Unit | Enum values | Assert each enum value is an actual `UserViewModel` field name |
| E2E | `usersFindByCriteria` | Filter by `STATUS` + sort by `CREATED_AT` returns expected page; an unknown `field` is rejected by the schema |

## Migration / Rollout

No migration. Pilot `users` only; once green, the same three steps (two enums + register +
one-line DTO) replicate per context. Rollback is code-only: restore the empty DTO, delete
enums/registration/factory.

## Open Questions

- [ ] Confirm against the installed kit whether `BaseFindByCriteriaInput` can be subclassed
      with `filters`/`sorts` re-declared (preferred) or the factory must declare them
      standalone. Resolved at implementation time when deps are present.
