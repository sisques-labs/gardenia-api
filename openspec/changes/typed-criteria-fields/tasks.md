# Tasks: Type-Safe Criteria Filter/Sort Fields via Per-Context Enums

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 120–180 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Shared factory + users pilot end-to-end | PR 1 | Atomic; proves the pattern before rollout |

---

## Phase 1: Shared Factory

- [x] 1.1 Create `src/core/transport/graphql/criteria/create-find-by-criteria-input.factory.ts` exporting `createFindByCriteriaInput({ name, filterFieldEnum, sortFieldEnum })` that returns a typed `@InputType` class. Filters/sorts `field` typed to the enums (via `@Field(() => enum)`); reuse kit `FilterOperator`/`SortDirection` and pagination; unique GraphQL type names derived from `name`. Property names MUST stay `filters`/`sorts`/`pagination`. Satisfies: *Typed Criteria Input Factory*.
- [x] 1.2 Confirm against the installed kit whether re-declaring `filters`/`sorts` on a `BaseFindByCriteriaInput` subclass works; if not, declare them standalone in the factory. Satisfies: design Open Question.

## Phase 2: Users Pilot — Enums

- [x] 2.1 Create `src/contexts/users/domain/enums/user-filter-field.enum.ts` (`UserFilterFieldEnum`) with values equal to `UserViewModel` field names (`status`, `username`, `locale`, `timezone`, `createdAt`). Satisfies: *Users Criteria Field Enums*.
- [x] 2.2 Create `src/contexts/users/domain/enums/user-sort-field.enum.ts` (`UserSortFieldEnum`) with values equal to `UserViewModel` field names (`username`, `status`, `createdAt`, `updatedAt`). Satisfies: *Users Criteria Field Enums*.

## Phase 3: Users Pilot — Wiring

- [x] 3.1 Modify `src/contexts/users/transport/graphql/enums/user/user-registered-enums.graphql.ts` to `registerEnumType` both new enums. Satisfies: *Users Criteria Input Is Enum-Typed*.
- [x] 3.2 Modify `src/contexts/users/transport/graphql/dtos/requests/user/user-find-by-criteria.request.dto.ts` to `extends createFindByCriteriaInput({ name: 'User', filterFieldEnum: UserFilterFieldEnum, sortFieldEnum: UserSortFieldEnum })`. Satisfies: *Users Criteria Input Is Enum-Typed*.
- [x] 3.3 Verify `UserQueriesResolver` and `UserFindByCriteriaQueryHandler` are unchanged (`new Criteria(...)` still compiles and runs). Satisfies: *Downstream Unchanged*.

## Phase 4: Tests

- [x] 4.1 Create `src/core/transport/graphql/criteria/create-find-by-criteria-input.factory.spec.ts`: assert the returned class exposes `filters`/`sorts`/`pagination`, that GraphQL input metadata references the supplied enums, and that two different `name`s yield distinct type names. Satisfies: *Typed Criteria Input Factory*.
- [x] 4.2 Add a unit assertion that every `UserFilterFieldEnum`/`UserSortFieldEnum` value is a key of `UserViewModel` (guards against drift). Satisfies: *Users Criteria Field Enums*.
- [x] 4.3 Extend `test/users.e2e-spec.ts`: `usersFindByCriteria` filtering by `STATUS` and sorting by `CREATED_AT` returns the expected page; an unknown `field` value is rejected by the GraphQL schema. Satisfies: *Users Criteria Input Is Enum-Typed*.

## Phase 5: Verify

- [x] 5.1 `pnpm build` (schema generates, no GraphQL type-name collisions). 
- [x] 5.2 `pnpm test` green (927/927). `pnpm test:e2e` NOT run here (no Postgres/Docker); e2e cases added and type-clean, to run in CI.
- [x] 5.3 Update `src/contexts/users/README.md` if it documents the `usersFindByCriteria` input contract. Satisfies: apply rule (public API/query contract change).

## Phase 6: Rollout — Plants

- [x] 6.1 Create `src/contexts/plants/domain/enums/plant-filter-field.enum.ts` (`PlantFilterFieldEnum`) and `plant-sort-field.enum.ts` (`PlantSortFieldEnum`) with values equal to `PlantViewModel` field names. Satisfies: *Plants Criteria Field Enums*.
- [x] 6.2 Replace the scaffold `plants/transport/graphql/enums/plant/plant-registered-enums.graphql.ts` with real `registerEnumType` calls for both enums. Satisfies: *Plants Criteria Input Is Enum-Typed*.
- [x] 6.3 Modify `plants/transport/graphql/dtos/requests/plant/plant-find-by-criteria.request.dto.ts` to extend `createFindByCriteriaInput({ name: 'Plant', ... })`. Satisfies: *Plants Criteria Input Is Enum-Typed*.
- [x] 6.4 Add `plant-criteria-fields.enum.spec.ts` drift guard; verify schema build types `PlantFilterInput.field`/`PlantSortInput.field` to the enums. Satisfies: *Plants Criteria Field Enums*, *Plants Criteria Input Is Enum-Typed*.

## Phase 7: Remaining Rollout (not implemented here)

- [ ] 7.1 Replicate the three-step recipe (two enums + register + one-line DTO) for `harvests`, `care-log`, `spaces`, `auth`, `planting-spots`. Out of scope for this change.

