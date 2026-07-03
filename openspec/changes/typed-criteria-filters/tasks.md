# Tasks: Type-Safe Criteria Filters

Order: fix the read-repository first on an unchanged surface (behaviour
preservation), then land the shared mechanism dependency, then wire it into
`plants` and expose it. Each phase keeps `pnpm test` / `pnpm build` green and
is independently committable.

## Phase 0 — Baseline

- [ ] 0.1 Add an e2e test capturing today's `plantsFindByCriteria` behaviour
      (no filters applied, sorted by `createdAt DESC`, paginated) — this is
      the regression guard for Phase 1.
- [ ] 0.2 Confirm `pnpm test`, `pnpm build`, `pnpm lint` are green before any
      change.

## Phase 1 — Fix `PlantTypeOrmReadRepository.findByCriteria`

- [ ] 1.1 Rewrite `findByCriteria` to use `repo.createQueryBuilder('plant')`
      instead of `findAndCount`, translating each `FilterOperator` to the
      matching `andWhere` clause (design §4).
- [ ] 1.2 Keep default sort (`createdAt DESC`) when `criteria.sorts` is empty.
- [ ] 1.3 Unit tests: one per `FilterOperator` value, asserting the generated
      SQL/parameters (mock `QueryBuilder`, mirror
      `base-mongo-database.repository.spec.ts`'s per-operator style).
- [ ] 1.4 Run Phase 0's e2e test — must still pass unchanged (repo now reads
      `criteria.filters` but the resolver still always sends `[]`).
- [ ] 1.5 `pnpm test` + `pnpm build` green; commit.

## Phase 2 — `@sisques-labs/nestjs-kit` dependency bump

- [ ] 2.1 Bump `@sisques-labs/nestjs-kit` to the version exposing
      `createFilterInput`, `createSortInput`, `FilterFieldRegistry`, the
      filter-validation pipe, and `BaseFilterInput.value: GraphQLJSON`.
- [ ] 2.2 Confirm the version bump alone doesn't break existing consumers
      (`pnpm build`, full unit suite) — no context uses `filters`/`sorts`
      with a real value yet, so this should be a no-op behaviourally.
- [ ] 2.3 Commit.

## Phase 3 — `plants` queryable-field enum + registry

- [ ] 3.1 Add `PlantQueryableFieldEnum` (`NAME`, `PLANT_SPECIES_ID`,
      `PLANTING_SPOT_ID`, `CREATED_AT`, `UPDATED_AT`) in
      `plants/transport/graphql/enums/plant/`, registered via
      `registerEnumType`.
- [ ] 3.2 Add `plantFilterableFields` registry
      (`plants/transport/graphql/registries/`) mapping each field to its
      expected value shape (string / uuid / date — no enum entries yet).
- [ ] 3.3 Generate `PlantFilterInput` / `PlantSortInput` via the nestjs-kit
      factories; update `PlantFindByCriteriaRequestDto` to use them for
      `filters` / `sorts`.
- [ ] 3.4 Wire the shared validation pipe into `plant-queries.resolver.ts`
      (`plantsFindByCriteria`).
- [ ] 3.5 Unit tests: registry validation (valid field/value combos pass,
      mismatches throw `BadRequestException`), DTO shape.
- [ ] 3.6 `pnpm test` + `pnpm build` green; commit.

## Phase 4 — Verification & docs

- [ ] 4.1 E2E: `plantsFindByCriteria` with `LIKE` on `name`, `EQUALS` on
      `plantSpeciesId`, `IN` on `plantingSpotId` with an array value, and an
      invalid field/value combo (expect 400).
- [ ] 4.2 `pnpm test:cov` ≥ 80% on touched files.
- [ ] 4.3 Update `src/contexts/plants/README.md` documenting the queryable
      fields and how to add a new one (registry entry + enum value).
- [ ] 4.4 `pnpm lint`, `pnpm build`, full unit suite green.

## Follow-ups (separate changes, not part of this one)

- Roll out the same mechanism to `users` (has `UserStatusEnum` ready, same
  filters-ignored gap in its TypeORM read repository) — first real
  enum-value-validation pilot.
- Roll out to `inventory`, `harvests`, `care-schedule`, `care-log`,
  `spaces`, `planting-spots`, `files` as their filtering needs come up.
