# Proposal: Resolve Space Members via Memberships

## Why

`userId` in the JWT is **global** — a single identity that belongs to many spaces. Space membership is modeled in `space_memberships (space_id, user_id, role, joined_at)`, which is the authoritative record of who belongs to a space.

However, `UserTypeOrmReadRepository` currently wraps the `users` raw repository with `createTenantRepository(rawRepo, spaceContext)`. That factory's Proxy injects `WHERE users.space_id = :spaceId` into every `findOne`, `find`, and `findAndCount` call. A user who joined a space via invitation only receives a `space_memberships` row — their `users.space_id` still points to their **home space** (the one they registered in).

As a result:
- `usersFindByCriteria` returns only users whose `users.space_id` matches the current space, silently excluding invited members.
- `userFindById` returns `null` for an invited member when called in the target space.
- Any guard or UI that relies on these queries to verify membership will incorrectly reject legitimate members.

A previous workaround (`EnsureUserExistsCommand`) duplicated `users` rows across spaces. This is incorrect: `users.id` is a global PK and must not be duplicated per space. That command was already removed; this change fixes the underlying read-side to make the workaround unnecessary.

## What Changes

- **`UserTypeOrmReadRepository`**: Stop using `createTenantRepository`. Instead, join with `space_memberships` to resolve users who belong to the current space. `SpaceContext.require()` still provides the `spaceId` for the join.
- **`findById`**: Return a user if they have a `space_memberships` row for the current space (regardless of `users.space_id`).
- **`findByCriteria`**: Return all users with a `space_memberships` row for the current space.
- **`findByUsername`**: Same join-based approach.
- **Write repository**: No change — `UserTypeOrmWriteRepository` and `createTenantRepository` usage on the write side remain untouched. The `users.space_id` column stays as the "home space" stamp.
- **Unit tests**: New specs for the reworked read repo covering both home-space and invited-member scenarios.
- **Integration tests**: `test/integration/users/user-typeorm-read.integration-spec.ts` — cross-space isolation, invited member visibility.
- **E2E tests**: Invited member appears in `usersFindByCriteria` after `spaceAcceptInvitation`.
- **`users` README**: Document the identity vs. membership model.

## Capabilities

### New Capabilities

_None — this is a read-side correctness fix within the existing `users` context._

### Modified Capabilities

- `users`: `usersFindByCriteria` and `userFindById` now resolve members via `space_memberships` join.
- `users`: `users.space_id` demoted from "membership filter" to "home space stamp".

## Impact

| Area | Impact |
|------|--------|
| `src/contexts/users/infrastructure/` | Rework `UserTypeOrmReadRepository` |
| `src/contexts/users/README.md` | Document identity vs. membership model |
| `test/integration/users/` | New integration spec |
| `test/e2e/spaces/` | Extend space-invitations e2e with member visibility assertion |
| `src/shared/tenant-repository/` | No change (write repos still use it) |

### Delivery

| PR | Scope | Est. lines |
|----|-------|------------|
| 1 | Fix `UserTypeOrmReadRepository` + unit tests | ~80–120 |
| 2 | Integration test + e2e extension + README | ~100–150 |

Chained PRs recommended: **No** — fits in a single PR given the narrow scope. Single-PR delivery.

### Rollback plan

1. Revert `UserTypeOrmReadRepository` to `createTenantRepository`-based implementation.
2. No migration needed — no schema changes.
3. Invited members will again be invisible in the target space (original bug).

## Success Criteria

- [ ] Invited members appear in `usersFindByCriteria` after accepting an invitation.
- [ ] `userFindById` returns the correct user when called in a space they joined via invitation.
- [ ] Users from other spaces do NOT appear (cross-space isolation preserved).
- [ ] Write side (`UserTypeOrmWriteRepository`) is unchanged.
- [ ] Integration test: home-space user visible + invited user visible + foreign user invisible.
- [ ] E2E: create invitation → accept → `usersFindByCriteria` returns invited member.
- [ ] `users/README.md` explains global identity vs. space membership.

## Open Questions

1. **`findByUsername` uniqueness**: `UNIQUE(spaceId, username)` is on `users`, but usernames are logically global in product intent. Should `findByUsername` still scope by space (join + username) or go global? Propose: keep space-scoped for now (join + username) — avoids leaking cross-space usernames.
2. **Deprecate `users.space_id` filter entirely?** The column stays as home-space metadata, but the index `IDX_users_space_id` may be obsolete for reads. Defer to a follow-up migration once usage is confirmed zero.
