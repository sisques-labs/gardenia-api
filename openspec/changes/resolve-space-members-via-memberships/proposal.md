# Proposal: Resolve Space Members via Memberships

## Intent

A `users` row is a global profile keyed by a stable `id` — it is not
duplicated per space. A user's access to a space beyond their own is modeled
by a `space_memberships` row (`space_id`, `user_id`, `role`, `joined_at`),
created either when a space is created (owner) or when an invitation is
accepted (`space.addMember()`).

`UserTypeOrmReadRepository`, however, scoped `findById`, `findByUsername`,
and `findByCriteria` through `createTenantRepository`, which filters the
`users` table by its own `space_id` column — the space the user's account
was originally created in (their "home" space). A user who joins a space
*only* via an invitation gets a `space_memberships` row in that target space,
but their `users.space_id` still points at their original home space. As a
result, `usersFindByCriteria` / `userFindById` silently excluded invited
members from the space they had just joined.

This change makes `space_memberships` the sole source of truth for "who
belongs to this space" on the read side: `UserTypeOrmReadRepository` now
resolves all three methods through an explicit `INNER JOIN space_memberships`
via QueryBuilder, scoped by the active `X-Space-ID`, instead of filtering on
`users.space_id`.

## Scope

### In Scope
- `UserTypeOrmReadRepository.findById`, `.findByUsername`, `.findByCriteria`:
  replace `createTenantRepository` scoping with an explicit
  `INNER JOIN space_memberships ON space_memberships.user_id = users.id`,
  filtered by `space_memberships.space_id = :spaceId` (the active
  `SpaceContext`).
- Unit tests asserting the join/where clauses for all three methods.
- Integration tests seeding `space_memberships` rows directly (new
  `seedMembership` test helper) to prove an invited member (home space ≠
  active space) is resolved, and that a legacy row with no membership is
  excluded.
- An E2E assertion (extending the existing invitation-accept flow test) that
  a guest who accepted an invitation appears in the owner's
  `usersFindByCriteria` for that space.
- Documenting the identity-vs-membership model in `src/contexts/users/README.md`.

### Out of Scope
- `UserTypeOrmWriteRepository` and the `users.space_id` column itself —
  untouched. `space_id` remains relevant for account-scoped flows that run
  outside a space context (e.g. delete-account), which is a separate concern
  from space-scoped listings.
- Membership role-based filtering (e.g. "members with role X only").
- Any change to the invitation-accept flow itself (`space.addMember()` /
  `AcceptSpaceInvitation`) — it already only writes to `space_memberships`
  and was already correct; this change fixes the read side that failed to
  honor it.
- Deprecating or removing `users.space_id` — flagged as a candidate follow-up
  in the original issue, not addressed here.

## Impacted Bounded Contexts
- **Modified:** `users` (infrastructure/persistence read repository only).
- **Referenced, not modified:** `spaces` — this change reads the
  `space_memberships` table (owned by `spaces`) via a raw table name in the
  QueryBuilder join, the same pattern already used by
  `SpaceTypeOrmReadRepository.findByMember`. No `spaces` domain/application
  code changes.

## Rollback Plan
Read-only, additive-in-behavior change: no schema migration, no write-path
change, no public API shape change (same DTOs/response types). Rollback is a
straight revert of the repository/test/README commit — no data migration to
undo. The only behavioral risk is a widening of visibility (previously-hidden
invited members become visible), which is the intended fix, not a side
effect to guard against.
