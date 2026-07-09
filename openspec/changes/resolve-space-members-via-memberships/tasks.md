# Tasks: Resolve Space Members via Memberships

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~285 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-shot |

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Repository fix + unit/integration/e2e tests + README | PR #320 | Single existing context, no schema change, no cross-context coupling |

---

## Phase 1: Read repository

- [x] T1 — Modify `src/contexts/users/infrastructure/persistence/typeorm/repositories/user-typeorm-read.repository.ts`: drop `createTenantRepository` usage; hold the injected `Repository<UserTypeOrmEntity>` directly as `private readonly repo`.
- [x] T2 — Add private `spaceMembersQueryBuilder()` helper: `this.repo.createQueryBuilder('user').innerJoin('space_memberships', 'membership', 'membership.user_id = user.id').where('membership.space_id = :spaceId', { spaceId: this.spaceContext.require() })`.
- [x] T3 — Rewrite `findById(id)` to build on `spaceMembersQueryBuilder()` with `.andWhere('user.id = :id', { id }).getOne()`.
- [x] T4 — Rewrite `findByUsername(username)` to build on `spaceMembersQueryBuilder()` with `.andWhere('user.username = :username', { username: username.toLowerCase() }).getOne()`.
- [x] T5 — Rewrite `findByCriteria(criteria)` to build the query via `spaceMembersQueryBuilder()` instead of the previous bespoke `.where('user.space_id = :spaceId', ...)`, keeping the existing `applyCriteriaToQueryBuilder` + pagination logic unchanged.

## Phase 2: Unit tests

- [x] T6 — Rewrite `user-typeorm-read.repository.spec.ts` to mock `Repository.createQueryBuilder()` returning a chainable `SelectQueryBuilder` stub (`innerJoin`/`where`/`andWhere`/`orderBy`/`addOrderBy`/`skip`/`take`/`getOne`/`getManyAndCount`).
- [x] T7 — Assert `innerJoin('space_memberships', 'membership', 'membership.user_id = user.id')` and `where('membership.space_id = :spaceId', { spaceId: SPACE_ID })` are called for `findById`, `findByUsername`, and `findByCriteria`.
- [x] T8 — Cover a user whose `spaceId` (home space) differs from the active space still resolving successfully via `findById`.

## Phase 3: Integration tests

- [x] T9 — Add `seedMembership(dataSource, spaceId, userId, role?)` to `test/helpers/tenant-seed.ts` (direct `space_memberships` INSERT).
- [x] T10 — In `test/integration/users/user-typeorm-read.integration-spec.ts`, add a `saveUserWithMembership()` local helper (save via `userWriteRepo.save()` + `seedMembership()`) and use it in every existing case, since the write repository alone no longer produces a membership row the join can match.
- [x] T11 — Add: invited member (home space B, membership seeded in space A) resolves via `findById` in space A.
- [x] T12 — Add: invited member appears alongside home-space members via `findByCriteria` in space A.
- [x] T13 — Add: a `users` row with a matching `space_id` but no `space_memberships` row is excluded from both `findById` and `findByCriteria`.

## Phase 4: E2E test

- [x] T14 — Extend `test/e2e/spaces/space-invitations.e2e-spec.ts`'s accept-invitation test: after the guest accepts, query `usersFindByCriteria` as the owner in that space and assert the guest's id (from the accept response) is present.

## Phase 5: Docs & verification

- [x] T15 — Add an "Identity vs. Membership" section to `src/contexts/users/README.md` documenting that `users` rows are global identity and `space_memberships` is the sole scoping mechanism for space-scoped listings.
- [x] T16 — Ran `pnpm lint` (clean), `pnpm tsc --noEmit` (clean), `pnpm test` (402/402 suites, 1696/1696 tests passing). `pnpm test:integration` / `pnpm test:e2e` were **not run** — this sandbox has no Docker/Postgres available (`docker ps` fails: no daemon). Run these against a real Postgres before merging.
