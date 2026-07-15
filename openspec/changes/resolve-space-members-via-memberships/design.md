# Design: Resolve Space Members via Memberships

## Architecture

No new context, aggregate, command, or query. The fix is confined to a
single infrastructure class:
`src/contexts/users/infrastructure/persistence/typeorm/repositories/user-typeorm-read.repository.ts`.

```
infrastructure/persistence/typeorm/repositories/
  user-typeorm-read.repository.ts   MODIFIED — findById/findByUsername/findByCriteria
                                      now share a private spaceMembersQueryBuilder()
                                      helper that joins space_memberships instead of
                                      relying on createTenantRepository
  user-typeorm-read.repository.spec.ts  MODIFIED — QueryBuilder-mock assertions
test/helpers/tenant-seed.ts          MODIFIED — + seedMembership()
test/integration/users/
  user-typeorm-read.integration-spec.ts MODIFIED — seeds memberships explicitly,
                                          adds invited-member / no-membership cases
test/e2e/spaces/space-invitations.e2e-spec.ts MODIFIED — asserts guest visibility
  after accept
src/contexts/users/README.md         MODIFIED — + "Identity vs. Membership" section
```

## Why `createTenantRepository` doesn't fit here

`createTenantRepository` wraps a `Repository<E>` in a `Proxy` that injects
`spaceId: ctx.require()` into `find`/`findOne`/`findAndCount`/`save`/`delete`
options — it assumes "the tenant column on this entity is the scoping
mechanism," which is true for every other tenant-scoped entity in this
codebase (`harvests.space_id`, `plants.space_id`, etc.) but false for `users`:
a `users` row's `space_id` is identity metadata (home space), not membership.
The existing `findByCriteria` implementation already had to special-case this
by bypassing the proxy and building its own `QueryBuilder` with an explicit
`.where('user.space_id = :spaceId', ...)` (documented inline as
"createQueryBuilder bypasses createTenantRepository's find/findOne proxy
interception"). This change removes `createTenantRepository` from this
repository entirely, replacing that bespoke `.where()` — and the
proxy-mediated `findOne` calls in `findById`/`findByUsername` — with one
shared query-builder helper.

## The join

```ts
const ALIAS = 'user';
const MEMBERSHIP_ALIAS = 'membership';

private spaceMembersQueryBuilder(): SelectQueryBuilder<UserTypeOrmEntity> {
  return this.repo
    .createQueryBuilder(ALIAS)
    .innerJoin(
      'space_memberships',
      MEMBERSHIP_ALIAS,
      `${MEMBERSHIP_ALIAS}.user_id = ${ALIAS}.id`,
    )
    .where(`${MEMBERSHIP_ALIAS}.space_id = :spaceId`, {
      spaceId: this.spaceContext.require(),
    });
}
```

`space_memberships` is joined by its raw table name (no TypeORM relation is
declared between `UserTypeOrmEntity` and `SpaceMembershipEntity` — and none
is needed for a filter-only join). This mirrors the existing precedent in
`SpaceTypeOrmReadRepository.findByMember`:
`.innerJoin('space_memberships', 'm', 'm.space_id = s.id')`.

Each method builds on `spaceMembersQueryBuilder()`:

```ts
async findById(id: string): Promise<UserViewModel | null> {
  const entity = await this.spaceMembersQueryBuilder()
    .andWhere(`${ALIAS}.id = :id`, { id })
    .getOne();
  return entity ? this.mapper.toViewModel(entity) : null;
}

async findByUsername(username: string): Promise<UserViewModel | null> {
  const entity = await this.spaceMembersQueryBuilder()
    .andWhere(`${ALIAS}.username = :username`, {
      username: username.toLowerCase(),
    })
    .getOne();
  return entity ? this.mapper.toViewModel(entity) : null;
}

async findByCriteria(criteria: Criteria): Promise<PaginatedResult<UserViewModel>> {
  const { page, limit, skip } = await this.calculatePagination(criteria);
  const qb = this.spaceMembersQueryBuilder();
  applyCriteriaToQueryBuilder(qb, criteria, {
    alias: ALIAS,
    defaultSort: { field: 'createdAt', direction: SortDirection.DESC },
  });
  const [entities, total] = await qb.skip(skip).take(limit).getManyAndCount();
  return new PaginatedResult(entities.map((e) => this.mapper.toViewModel(e)), total, page, limit);
}
```

`applyCriteriaToQueryBuilder` (from `@sisques-labs/nestjs-kit`) only ever
calls `.andWhere()`/`.orderBy()`/`.addOrderBy()` for user-supplied
filters/sorts — it never calls `.where()` — so it composes safely with the
membership `.where()` already set by `spaceMembersQueryBuilder()`.

Constructor injection changes from wrapping the injected repository in
`createTenantRepository(rawRepo, spaceContext)` to holding the injected
`Repository<UserTypeOrmEntity>` directly as `private readonly repo`. `save`/
`delete` remain no-ops (read-side projection; write side is
`UserTypeOrmWriteRepository`, untouched).

## Why not join on `UserTypeOrmEntity` via a TypeORM relation

A formal `@OneToMany`/`@ManyToMany` relation between `UserTypeOrmEntity` and
`SpaceMembershipEntity` was considered and rejected for this change: it would
require touching the `users` entity and widen the blast radius beyond the
read repository, for no behavioral benefit — the raw-table-name
`innerJoin()` already gives QueryBuilder everything it needs (a join
condition + a filter), consistent with how `SpaceTypeOrmReadRepository`
already joins the same table without a relation.

## Test seams

Unit tests mock `Repository.createQueryBuilder()` to return a chainable
`SelectQueryBuilder` stub (`innerJoin`/`where`/`andWhere`/`orderBy`/
`addOrderBy`/`skip`/`take`/`getOne`/`getManyAndCount`, all
`mockReturnThis()` except the two terminal `getOne`/`getManyAndCount`), then
assert the exact `innerJoin('space_memberships', 'membership',
'membership.user_id = user.id')` and `where('membership.space_id =
:spaceId', ...)` calls — the same pattern already used by
`HarvestTypeOrmReadRepository`'s and `SpaceTypeOrmReadRepository`'s specs.

Integration tests can no longer rely on `userWriteRepo.save()` alone to make
a user "visible" in its own home space, because the write repository never
touches `space_memberships` (that's `spaces`' `CreateSpaceCommandHandler`
calling `space.addMember()`, which the `users`-only integration module under
test does not wire in). A `saveUserWithMembership()` test helper — save via
`userWriteRepo.save()`, then insert the membership row directly with a new
`seedMembership(dataSource, spaceId, userId, role?)` SQL helper — restores
parity with what the real write path produces, and is reused across all
existing cases plus three new ones: an invited member (home space B,
membership seeded in space A) visible via `findById`/`findByCriteria` in
space A, and a legacy row with a `users.space_id` match but no
`space_memberships` row correctly excluded.

The E2E addition needs no new fixture: `space-invitations.e2e-spec.ts`
already drives the full owner-invites/guest-accepts flow through real HTTP
endpoints (which does create the guest's `space_memberships` row via
`AcceptSpaceInvitationCommandHandler`); the change only adds a
`usersFindByCriteria` GraphQL query as the owner, asserting the guest's id
returned by the accept response is present in the results.

## No new cross-context coupling

This change reads from the `space_memberships` table by raw name (already an
established pattern in `spaces`' own read repository) but does not import
anything from `@contexts/spaces/*`. No boundary rule is affected.
