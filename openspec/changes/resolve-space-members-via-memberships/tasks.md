# Tasks: Resolve Space Members via Memberships

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~200–280 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Decision needed before apply | No |

---

## Phase 1: Fix `UserTypeOrmReadRepository`

- [ ] 1.1 Remove `createTenantRepository` wrapper from `UserTypeOrmReadRepository` constructor. Store `rawRepo` directly as a private field. Keep `spaceContext` injection.
  - File: `src/contexts/users/infrastructure/persistence/typeorm/repositories/user-typeorm-read.repository.ts`

- [ ] 1.2 Add private `membershipQuery(alias = 'u')` helper that returns `rawRepo.createQueryBuilder(alias).innerJoin('space_memberships', 'sm', 'sm.user_id = u.id AND sm.space_id = :spaceId', { spaceId: this.spaceContext.require() })`.

- [ ] 1.3 Rewrite `findById(id)` to use `membershipQuery().where('u.id = :id', { id }).getOne()`. Return mapped view model or `null`.

- [ ] 1.4 Rewrite `findByCriteria(criteria)` to use `membershipQuery()` with `.skip()`, `.take()`, sort order from `criteria.sorts`, and `.getManyAndCount()`. Return `PaginatedResult`.

- [ ] 1.5 Rewrite `findByUsername(username)` to use `membershipQuery().where('u.username = :username', { username: username.toLowerCase() }).getOne()`.

- [ ] 1.6 Leave `save()` and `delete()` stubs unchanged.

---

## Phase 2: Unit Tests

- [ ] 2.1 Create (or update) `src/contexts/users/infrastructure/persistence/typeorm/repositories/user-typeorm-read.repository.spec.ts`.
  - Mock `rawRepo.createQueryBuilder` returning a Jest mock builder with chainable methods (`innerJoin`, `where`, `skip`, `take`, `addOrderBy`, `getOne`, `getManyAndCount`).
  - Mock `spaceContext.require()` returning a fixed `spaceId`.
  - Assert `innerJoin` is called with `'space_memberships'`, `'sm'`, correct ON string, and `{ spaceId }`.
  - `findById` — entity returned → `mapper.toViewModel` called; `null` returned → result `null`.
  - `findByCriteria` — `getManyAndCount` returns `[entities, total]`; assert `PaginatedResult` shape.
  - `findByUsername` — username lowercased in WHERE; entity/null propagation.

---

## Phase 3: Integration Test

- [ ] 3.1 Create `test/integration/users/user-typeorm-read.integration-spec.ts`.
  - Bootstrap `TypeOrmModule` with real Postgres (Docker test compose).
  - Seed: space A, space B; user X (home space A, also member of B via `space_memberships`); user Y (home space B only).
  - `SpaceContext.run(spaceA, ...)`: assert user X visible in `findByCriteria`; assert `findById(X.id)` returns user X.
  - `SpaceContext.run(spaceB, ...)`: assert user X visible (membership row); assert user Y visible (home space = B).
  - `SpaceContext.run(spaceA, ...)`: assert user Y invisible (no membership in A).

---

## Phase 4: E2E Extension

- [ ] 4.1 Extend `test/e2e/spaces/space-invitations.e2e-spec.ts`.
  - After the existing "accept invitation → membership created" assertion, execute `usersFindByCriteria` GraphQL query authenticated as the space owner (in the target space context via `X-Space-ID`).
  - Assert `items` array includes an entry with `id` equal to the invited user's id.
  - Add negative case: query the **other** space's users as the invited user — assert the invited user is NOT listed there.

---

## Phase 5: Documentation

- [ ] 5.1 Update `src/contexts/users/README.md`.
  - Add a new **"Identity vs. Membership Model"** section explaining:
    - `users.id` is a global PK — one row per user across all spaces.
    - `users.space_id` is the home space from registration — used only by the write repo to stamp new rows; not a membership filter.
    - Space membership is governed by `space_memberships (space_id, user_id)`.
    - The read repo resolves "users in this space" via `INNER JOIN space_memberships`.
  - Update the `usersFindByCriteria` / `userFindById` documentation to reflect the new membership-based scoping.

---

## Phase 6: Post-implementation

- [ ] 6.1 Run `pnpm test src/contexts/users` — all unit tests pass.
- [ ] 6.2 Run `pnpm test:integration --testPathPattern=users` — integration spec passes.
- [ ] 6.3 Run `pnpm test:e2e --testPathPattern=space-invitations` — e2e passes.
- [ ] 6.4 Run `pnpm lint && pnpm build` — no errors.
- [ ] 6.5 Update `CHANGELOG.md` under Unreleased: `fix(users): resolve space members via space_memberships join, not users.space_id filter`.
