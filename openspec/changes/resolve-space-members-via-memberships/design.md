# Design: Resolve Space Members via Memberships

> Targets `users` bounded context, read-side only. Scope and motivation in `proposal.md`.

---

## Context

- **`users` table**: `id` (global PK), `space_id` (home space from registration), profile columns.
- **`space_memberships` table**: `(space_id, user_id, role, joined_at)` — UNIQUE `(space_id, user_id)`, INDEX `(user_id)`. This is the authoritative membership record.
- **`createTenantRepository`**: JS Proxy that injects `WHERE <entity>.space_id = :spaceId` into every TypeORM read/write call. Correct for most tenant-scoped entities (plants, QRs, spaces themselves). **Incorrect** for `users`, whose `space_id` is a registration stamp, not a membership marker.
- **`SpaceContext`**: `AsyncLocalStorage`-backed service; `spaceContext.require()` returns the current `spaceId` or throws `SpaceContextMissingException`.
- **Write repo** (`UserTypeOrmWriteRepository`): Continues to use `createTenantRepository` — saves always stamp `space_id` from context. This is correct for home-space creation. No change here.

---

## Goals / Non-Goals

**Goals:**

- `findById`, `findByCriteria`, `findByUsername` resolve membership via `space_memberships` JOIN.
- Cross-space isolation preserved: users without a `space_memberships` row for the current space are invisible.
- Write repo and `users.space_id` column untouched.

**Non-Goals:**

- Removing `users.space_id` column or its index (deferred).
- Changing the write side or `createTenantRepository` factory.
- Exposing membership metadata (role, joinedAt) from the `users` read repo (that's the `spaces` context's concern).

---

## Decisions

### ADR-1: Replace `createTenantRepository` with explicit JOIN in read repo

**Decision:** `UserTypeOrmReadRepository` receives the raw `Repository<UserTypeOrmEntity>` and `SpaceContext` directly. All read methods use `createQueryBuilder` with an `INNER JOIN space_memberships ON space_memberships.user_id = users.id AND space_memberships.space_id = :spaceId`.

**Rationale:** `createTenantRepository`'s WHERE injection targets `users.space_id`, which is the home-space column, not the membership column. We cannot reuse the factory without modifying its contract, which would break all other tenant entities. An explicit `QueryBuilder` JOIN is the least-invasive, most readable fix.

**Alternative considered:** Extend `createTenantRepository` to accept a custom join strategy — rejected for over-engineering scope and risk to other consumers.

---

### ADR-2: INNER JOIN enforces cross-space isolation

**Decision:** Use `INNER JOIN` (not `LEFT JOIN`) between `users` and `space_memberships`. Only rows with a matching membership row are returned.

**Rationale:** An `INNER JOIN` guarantees that users without a `space_memberships` row for the current space are excluded — preserving isolation. A `LEFT JOIN` with a NULL check would achieve the same but is more verbose.

**Implication for home-space users:** The space owner and users who registered in the space automatically have a `space_memberships` row (created by `SpaceAggregate.create()` / `AddMemberCommand`). They will still appear in results.

---

### ADR-3: `findByUsername` keeps space-scoped semantics

**Decision:** `findByUsername` joins with `space_memberships` the same way as other methods — returns the user only if they are a member of the current space.

**Rationale:** Usernames have a `UNIQUE(spaceId, username)` constraint on `users`, meaning the same username can theoretically exist in different spaces. Scoping by space avoids ambiguity. Cross-space username lookup is not in scope.

---

### ADR-4: No schema changes

**Decision:** No migration required. `users.space_id` column and indexes are unchanged.

**Rationale:** Removing the column would be a breaking schema change with no immediate benefit — write repo still stamps it. Defer to a future cleanup once confirmed safe.

---

## Implementation Detail

### `UserTypeOrmReadRepository` — rewritten read methods

```typescript
// Before (broken for invited members)
constructor(...) {
  this.repo = createTenantRepository(rawRepo, spaceContext);
}

async findById(id: string) {
  return this.repo.findOne({ where: { id } }); // WHERE space_id = :space
}

// After
constructor(
  @InjectRepository(UserTypeOrmEntity)
  private readonly rawRepo: Repository<UserTypeOrmEntity>,
  private readonly mapper: UserTypeOrmMapper,
  private readonly spaceContext: SpaceContext,
) { super(); }

private membershipQuery(alias = 'u') {
  return this.rawRepo
    .createQueryBuilder(alias)
    .innerJoin(
      'space_memberships',
      'sm',
      'sm.user_id = u.id AND sm.space_id = :spaceId',
      { spaceId: this.spaceContext.require() },
    );
}

async findById(id: string) {
  const entity = await this.membershipQuery()
    .where('u.id = :id', { id })
    .getOne();
  return entity ? this.mapper.toViewModel(entity) : null;
}

async findByCriteria(criteria: Criteria) {
  const { page, limit, skip } = await this.calculatePagination(criteria);
  const qb = this.membershipQuery()
    .skip(skip)
    .take(limit);
  // apply sorts from criteria
  for (const s of criteria.sorts) {
    qb.addOrderBy(`u.${s.field}`, s.direction as 'ASC' | 'DESC');
  }
  const [entities, total] = await qb.getManyAndCount();
  return new PaginatedResult(entities.map(e => this.mapper.toViewModel(e)), total, page, limit);
}

async findByUsername(username: string) {
  const entity = await this.membershipQuery()
    .where('u.username = :username', { username: username.toLowerCase() })
    .getOne();
  return entity ? this.mapper.toViewModel(entity) : null;
}
```

### `save` and `delete` stubs

No change — they remain no-ops in the read repo.

---

## File Structure (new/modified)

```
src/contexts/users/
└── infrastructure/
    └── persistence/
        └── typeorm/
            └── repositories/
                └── user-typeorm-read.repository.ts   ← MODIFIED: remove createTenantRepository, use QueryBuilder JOIN

test/
├── integration/
│   └── users/
│       └── user-typeorm-read.integration-spec.ts     ← NEW
└── e2e/
    └── spaces/
        └── space-invitations.e2e-spec.ts             ← EXTENDED: assert invited member visibility

src/contexts/users/README.md                          ← UPDATED: identity vs. membership model section
```

---

## Test Plan

### Unit tests (no DB)

File: `src/contexts/users/infrastructure/persistence/typeorm/repositories/user-typeorm-read.repository.spec.ts`

- Mock `rawRepo.createQueryBuilder` to return a chainable mock builder.
- Assert `innerJoin` is called with `space_memberships` and the correct condition.
- `findById`: returns mapped view model when `getOne()` returns entity; returns `null` when `getOne()` returns `null`.
- `findByCriteria`: `getManyAndCount()` result is paginated correctly; sorts are applied.
- `findByUsername`: lowercases the username before query.

### Integration tests (Docker Postgres)

File: `test/integration/users/user-typeorm-read.integration-spec.ts`

| Scenario | Expected |
|----------|----------|
| User registered in space A — queried in space A | Visible |
| User invited to space B (membership row only) — queried in space B | Visible |
| User registered in space A — queried in space B (no membership) | Invisible |
| `findById` for invited user | Returns user |
| `findById` for foreign user | Returns null |

### E2E extension

File: `test/e2e/spaces/space-invitations.e2e-spec.ts`

Extend existing test: after `spaceAcceptInvitation` succeeds, call `usersFindByCriteria` in the target space and assert that `items` contains the invited user's id.

---

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| `membershipQuery()` called outside a `SpaceContext` frame (e.g., background jobs) | `spaceContext.require()` throws `SpaceContextMissingException` — same failure mode as before; no regression |
| QueryBuilder bypasses TypeORM entity hooks | `findOne`/`findAndCount` also bypass hooks; no hooks on `UserTypeOrmEntity` currently |
| Performance: JOIN on large tables | `space_memberships(user_id)` and `space_memberships(space_id, user_id)` indexes cover the join; no full scan |
| Sorts referencing non-existent columns | `criteria.sorts` from `@sisques-labs/nestjs-kit` passes field names; same risk as before — no regression |
