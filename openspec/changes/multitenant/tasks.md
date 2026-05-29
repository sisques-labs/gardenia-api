# Tasks: Multi-Tenancy via Spaces

**Change**: multitenant  
**Phase**: tasks  
**Date**: 2026-05-29  
**Status**: done

---

## Summary

55 tasks across 8 phases. Phases 0–3 are strictly sequential (each depends on the previous). Phases 4–5 can begin in parallel once Phase 3 entities exist. Phase 6 depends on Phase 4 (SpaceContext + factory available). Phase 7 requires Phase 6 complete. Phase 8 is the final wiring pass.

---

## Review Workload Forecast

**Estimated changed lines**: ~1,800–2,200  
**Chained PRs recommended: Yes**  
**400-line budget risk: High**

Suggested PR slices:

| PR | Phases | Description | Est. lines |
|----|--------|-------------|-----------|
| PR 1 | 0 | Migrations only — schema no app code | ~200 |
| PR 2 | 1 + 2 | `spaces` domain + application (pure domain, no infra wiring) | ~500 |
| PR 3 | 3 + 4 | `spaces` infra + cross-cutting `SpaceContext`/`createTenantRepository` | ~400 |
| PR 4 | 5 | `SpaceGuard` + `spaces.module.ts` + transport wiring | ~250 |
| PR 5 | 6 | Adapt `auth` + `users` contexts | ~350 |
| PR 6 | 7 + 8 | E2E isolation tests + `app.module.ts` final wiring | ~300 |

**Decision needed before apply: Yes** — confirm PR slicing strategy before starting `sdd-apply`.

---

## Dependency Map

```
Phase 0 → Phase 1 → Phase 2 → Phase 3
                                 ↓         ↘
                              Phase 4    Phase 5 (needs Phase 4)
                                 ↓
                              Phase 6
                                 ↓
                              Phase 7
                                 ↓
                              Phase 8
```

---

## Phase 0 — Database & Migrations

> All schema changes first. No application code. Alpha data discarded — no backfill.

### 0.1 — Spike: verify TypeORM migration API

- [x] **0.1** Read the resolved `typeorm@1.0.0` migration API (`DataSource.runMigrations`, `MigrationInterface`) and confirm the pattern used in existing migrations (`src/database/migrations/`).
  <!-- Confirmed: uses `MigrationInterface` + `QueryRunner.query()` with raw SQL. Class name = PascalCase + timestamp. `name` property = class name as string. -->
  - **File**: `src/database/migrations/1779729423499-InitialSchema.ts` (read only)
  - **Acceptance**: migration API pattern documented in a comment in `tasks.md` or confirmed matches existing files — no code written.
  - **Test**: none (spike)
  - **Parallel**: can run in parallel with nothing — do first

### 0.2 — Migration: CreateSpaces

- [x] **0.2** Create migration `src/database/migrations/<ts>-CreateSpaces.ts`.
  - Schema: `spaces` table — `id uuid PK`, `name varchar(255) NOT NULL`, `owner_id uuid NOT NULL`, `created_at timestamp`, `updated_at timestamp`.
  - `down()` drops `spaces` table.
  - **Acceptance**: `pnpm migration:run` applies without error; `pnpm migration:revert` removes the table cleanly.
  - **Test**: none (migration artifact)
  - **Sequential after**: 0.1

### 0.3 — Migration: CreateSpaceMemberships

- [x] **0.3** Create migration `src/database/migrations/<ts>-CreateSpaceMemberships.ts`.
  - Schema: `space_memberships` — `id uuid PK`, `space_id uuid NOT NULL FK→spaces.id`, `user_id uuid NOT NULL`, `role varchar NOT NULL`, `joined_at timestamp NOT NULL`.
  - `UNIQUE(space_id, user_id)`, `INDEX(user_id)`.
  - `down()` drops `space_memberships`.
  - **Acceptance**: migration applies and reverts cleanly; FK constraint exists in DB.
  - **Test**: none
  - **Sequential after**: 0.2

### 0.4 — Migration: AddSpaceIdToAccounts

- [x] **0.4** Create migration `src/database/migrations/<ts>-AddSpaceIdToAccounts.ts`.
  - Drop `UNIQUE(email)` on `accounts`; add `space_id uuid NOT NULL`; add `UNIQUE(space_id, email)`; add `INDEX(space_id)`.
  - `down()` reverses: drop composite unique + index, drop `space_id`, restore scalar `UNIQUE(email)`.
  - **Acceptance**: migration applies and reverts cleanly; `UNIQUE(email)` no longer exists; `UNIQUE(space_id,email)` does.
  - **Test**: none
  - **Sequential after**: 0.3

### 0.5 — Migration: AddSpaceIdToUsers

- [x] **0.5** Create migration `src/database/migrations/<ts>-AddSpaceIdToUsers.ts`.
  - Drop `UNIQUE(username)` on `users`; add `space_id uuid NOT NULL`; add `UNIQUE(space_id, username)`; add `INDEX(space_id)`.
  - `down()` reverses analogously.
  - **Acceptance**: migration applies and reverts cleanly; `UNIQUE(space_id,username)` exists; scalar unique is gone.
  - **Test**: none
  - **Sequential after**: 0.4

---

## Phase 1 — `spaces` Bounded Context (Domain)

> Strict TDD: write failing unit test FIRST, then production code, then refactor.

### 1.1 — Value Objects

- [x] **1.1.1** Create `src/contexts/spaces/domain/value-objects/space-id/space-id.vo.ts` + co-located `.spec.ts`.
  - Wraps a UUID string; `create(value)` factory; rejects non-UUID with `InvalidSpaceIdException`.
  - **Acceptance**: spec passes; VO is immutable and validates format.
  - **Test**: unit — valid UUID accepted, empty string rejected, non-UUID rejected.

- [x] **1.1.2** Create `src/contexts/spaces/domain/value-objects/space-name/space-name.vo.ts` + `.spec.ts`.
  - Wraps a non-empty string (max 100 chars); rejects empty/blank/over-limit with `InvalidSpaceNameException`.
  - **Acceptance**: spec passes; boundary values (1 char, 100 chars, 101 chars) all tested.
  - **Test**: unit.

- [x] **1.1.3** Create `src/contexts/spaces/domain/value-objects/membership-role/membership-role.vo.ts` + `.spec.ts`.
  - Enum-like VO accepting only `'owner'` | `'member'`; rejects any other string.
  - **Acceptance**: spec passes; invalid value throws.
  - **Test**: unit.

### 1.2 — Domain Exceptions

- [x] **1.2** Create the following exception files (no tests required for exception classes):
  - `src/contexts/spaces/domain/exceptions/space-not-found.exception.ts`
  - `src/contexts/spaces/domain/exceptions/not-a-space-member.exception.ts`
  - `src/contexts/spaces/domain/exceptions/space-limit-exceeded.exception.ts`
  - `src/contexts/spaces/domain/exceptions/last-owner-removal.exception.ts`
  - `src/contexts/spaces/domain/exceptions/duplicate-membership.exception.ts`
  - `src/contexts/spaces/domain/exceptions/space-context-missing.exception.ts` (cross-cutting, lives here as domain exception)
  - **Acceptance**: all exceptions extend a base error class; HTTP status codes mapped (404/403/409/400 as appropriate).
  - **Test**: none.

### 1.3 — Domain Events

- [x] **1.3** Create domain events (no tests required):
  - `src/contexts/spaces/domain/events/space-created/space-created.event.ts` — payload: `spaceId`, `name`, `ownerId`
  - `src/contexts/spaces/domain/events/member-added/member-added.event.ts` — payload: `spaceId`, `userId`, `role`
  - `src/contexts/spaces/domain/events/member-removed/member-removed.event.ts` — payload: `spaceId`, `userId`
  - **Acceptance**: events are plain value objects (no methods); payload fields match spec §8.
  - **Test**: none.

### 1.4 — `SpaceMembership` Child Entity

- [x] **1.4** Create `src/contexts/spaces/domain/entities/space-membership.entity.ts` + `.spec.ts`.
  - Fields: `userId` (string), `spaceId` (string), `role` (`MembershipRoleVO`), `joinedAt` (Date).
  - `SpaceMembership.create(userId, spaceId, role)` — named factory, sets `joinedAt = new Date()`.
  - Constructor is hydration-only.
  - **Acceptance**: spec passes; cannot be constructed with invalid role; `create()` sets `joinedAt` automatically.
  - **Test**: unit.
  - **Sequential after**: 1.1, 1.2

### 1.5 — `Space` Aggregate

- [x] **1.5** Create `src/contexts/spaces/domain/aggregates/space.aggregate.ts` + `.spec.ts`.
  - Fields: `id` (`SpaceIdVO`), `name` (`SpaceNameVO`), `ownerId` (string), `memberships` (`SpaceMembership[]`), `createdAt`, `updatedAt`.
  - Constructor: hydration-only.
  - `Space.create(ownerId, name)` — static factory; generates UUID id; calls `addMember(ownerId, OWNER)`; emits `SpaceCreatedEvent`.
  - `addMember(userId, role)` — throws `DuplicateMembershipException` if already member; pushes new `SpaceMembership`; emits `MemberAddedEvent`.
  - `removeMember(userId)` — throws `CannotRemoveOwnerException` / `LastOwnerRemovalException` if removing last owner; throws `NotASpaceMemberException` if user not a member; removes; emits `MemberRemovedEvent`.
  - **Acceptance**: all invariants tested (spec §2.1, §4); aggregate emits correct events.
  - **Test**: unit — at minimum 8 scenarios covering create, addMember happy/dup, removeMember happy/last-owner/non-member.
  - **Sequential after**: 1.4

### 1.6 — Repository Interfaces (Domain)

- [x] **1.6** Create:
  - `src/contexts/spaces/domain/repositories/read/space-read.repository.ts` — interface: `findById(id): Promise<Space | null>`, `findByUserId(userId): Promise<Space[]>`.
  - `src/contexts/spaces/domain/repositories/write/space-write.repository.ts` — interface: `save(space): Promise<void>`.
  - `src/contexts/spaces/domain/repositories/read/membership-read.repository.ts` — interface: `findByUserAndSpace(userId, spaceId): Promise<SpaceMembership | null>`, `countByOwner(userId): Promise<number>`.
  - **Acceptance**: interfaces compile; no infra imports.
  - **Test**: none.
  - **Sequential after**: 1.5

---

## Phase 2 — `spaces` Bounded Context (Application)

> Strict TDD applies. Handler tests use `jest.Mocked<T>`, no `@nestjs/testing`.

### 2.1 — `CreateSpaceCommand` + Handler

- [x] **2.1** Create:
  - `src/contexts/spaces/application/commands/create-space/create-space.command.ts` — `{ ownerId: string, name: string }`
  - `src/contexts/spaces/application/commands/create-space/create-space.handler.ts` + `.spec.ts`
    - Reads `MAX_SPACES_PER_USER` from config.
    - Calls `membershipReadRepository.countByOwner(ownerId)`; throws `SpaceLimitExceededException` if at cap.
    - Calls `Space.create(ownerId, name)`; calls `spaceWriteRepository.save(space)`; publishes events.
  - **Acceptance**: spec passes; cap enforced before persist; no direct TypeORM dependency in handler.
  - **Test**: unit — happy path, cap exceeded, repo failure.
  - **Sequential after**: 1.6

### 2.2 — `AddMemberCommand` + Handler

- [x] **2.2** Create:
  - `src/contexts/spaces/application/commands/add-member/add-member.command.ts` — `{ spaceId: string, requestingUserId: string, targetUserId: string }`
  - `src/contexts/spaces/application/commands/add-member/add-member.handler.ts` + `.spec.ts`
    - Loads `Space` via `spaceReadRepository.findById`; throws `SpaceNotFoundException` if not found.
    - Checks `requestingUserId` is owner; throws `NotASpaceMemberException` (or authorization exception) if not.
    - Calls `space.addMember(targetUserId)`; saves; publishes events.
  - **Acceptance**: spec passes; non-owner rejected; duplicate member rejected at aggregate level.
  - **Test**: unit — happy path, space not found, not owner, duplicate.
  - **Sequential after**: 1.6

### 2.3 — `RemoveMemberCommand` + Handler

- [x] **2.3** Create:
  - `src/contexts/spaces/application/commands/remove-member/remove-member.command.ts` — `{ spaceId, requestingUserId, targetUserId }`
  - `src/contexts/spaces/application/commands/remove-member/remove-member.handler.ts` + `.spec.ts`
    - Loads Space; checks requester is owner; calls `space.removeMember(targetUserId)`; saves; publishes.
  - **Acceptance**: spec passes; last-owner removal blocked at aggregate level.
  - **Test**: unit — happy path, not owner, last-owner attempt, non-member.
  - **Sequential after**: 1.6

### 2.4 — `SpaceFindByIdQuery` + Handler

- [x] **2.4** Create:
  - `src/contexts/spaces/application/queries/space-find-by-id/space-find-by-id.query.ts` — `{ spaceId: string }`
  - `src/contexts/spaces/application/queries/space-find-by-id/space-find-by-id.handler.ts` + `.spec.ts`
    - Returns `Space` or throws `SpaceNotFoundException`.
  - **Acceptance**: spec passes; maps to view model if needed.
  - **Test**: unit — found, not found.
  - **Sequential after**: 1.6

### 2.5 — `SpacesFindByUserQuery` + Handler

- [x] **2.5** Create:
  - `src/contexts/spaces/application/queries/spaces-find-by-user/spaces-find-by-user.query.ts` — `{ userId: string }`
  - `src/contexts/spaces/application/queries/spaces-find-by-user/spaces-find-by-user.handler.ts` + `.spec.ts`
  - **Acceptance**: returns list of Spaces the user belongs to (via `spaceReadRepository.findByUserId`).
  - **Test**: unit — empty list, multiple results.
  - **Sequential after**: 1.6

### 2.6 — `MembershipFindByUserAndSpaceQuery` + Handler

- [x] **2.6** Create:
  - `src/contexts/spaces/application/queries/membership-find-by-user-and-space/membership-find-by-user-and-space.query.ts` — `{ userId, spaceId }`
  - `src/contexts/spaces/application/queries/membership-find-by-user-and-space/membership-find-by-user-and-space.handler.ts` + `.spec.ts`
    - Returns `SpaceMembership | null` (null = not a member; `SpaceGuard` uses this).
  - **Acceptance**: returns membership when found, `null` when not; `SpaceGuard` can use return value as boolean.
  - **Test**: unit — found, not found.
  - **Sequential after**: 1.6

---

## Phase 3 — `spaces` Bounded Context (Infrastructure)

> Strict TDD: infra unit tests mock the TypeORM `Repository<E>` via `jest.Mocked<Repository<E>>`.

### 3.1 — TypeORM Entities

- [ ] **3.1.1** Create `src/contexts/spaces/infrastructure/persistence/typeorm/entities/space.entity.ts`.
  - Columns: `id`, `name`, `owner_id`, `created_at`, `updated_at`. No `@OneToMany` for memberships (loaded separately or joined).
  - **Acceptance**: entity compiles; column names match migration 0.2.
  - **Test**: none.

- [ ] **3.1.2** Create `src/contexts/spaces/infrastructure/persistence/typeorm/entities/space-membership.entity.ts`.
  - Columns: `id`, `space_id`, `user_id`, `role`, `joined_at`. `@ManyToOne` → `SpaceEntity` with `{ onDelete: 'CASCADE' }`.
  - **Acceptance**: entity compiles; column names match migration 0.3.
  - **Test**: none.

### 3.2 — Mappers

- [ ] **3.2.1** Create `src/contexts/spaces/infrastructure/persistence/typeorm/mappers/space-typeorm.mapper.ts` + `.spec.ts`.
  - `toDomain(entity): Space` and `toPersistence(space): Partial<SpaceEntity>`.
  - Does NOT map memberships inline (membership mapper is separate).
  - **Acceptance**: round-trip test passes; no data loss.
  - **Test**: unit.

- [ ] **3.2.2** Create `src/contexts/spaces/infrastructure/persistence/typeorm/mappers/space-membership-typeorm.mapper.ts` + `.spec.ts`.
  - `toDomain(entity): SpaceMembership` and `toPersistence(m): Partial<SpaceMembershipEntity>`.
  - **Acceptance**: round-trip test passes.
  - **Test**: unit.

### 3.3 — TypeORM Read Repository

- [ ] **3.3** Create `src/contexts/spaces/infrastructure/persistence/typeorm/repositories/space-typeorm-read.repository.ts` + `.spec.ts`.
  - Implements `ISpaceReadRepository` + `IMembershipReadRepository`.
  - `findById`: uses raw `Repository<SpaceEntity>.findOne`; maps to domain.
  - `findByUserId`: joins `space_memberships` where `user_id = userId`; maps results.
  - `findByUserAndSpace`: queries `SpaceMembershipEntity` directly.
  - `countByOwner`: counts memberships with `role = 'owner'` for `userId`.
  - NOTE: this repository is NOT tenant-wrapped — it is used by `SpaceGuard` and needs cross-space reads.
  - **Acceptance**: all interface methods implemented; mock tests pass.
  - **Test**: unit.
  - **Sequential after**: 3.1, 3.2

### 3.4 — TypeORM Write Repository

- [ ] **3.4** Create `src/contexts/spaces/infrastructure/persistence/typeorm/repositories/space-typeorm-write.repository.ts` + `.spec.ts`.
  - Implements `ISpaceWriteRepository`.
  - `save(space)`: maps space + all memberships; upserts `SpaceEntity` + all `SpaceMembershipEntity` rows.
  - NOTE: this repository is also NOT tenant-wrapped (writes come from command handlers that already have the spaceId in the aggregate).
  - **Acceptance**: save persists both space and memberships atomically.
  - **Test**: unit.
  - **Sequential after**: 3.1, 3.2

---

## Phase 4 — Cross-Cutting Infrastructure

> These are new shared files. Can begin in parallel with Phase 3 once Phase 1 exceptions are written (1.2 done).

### 4.1 — `SpaceContext` Service

- [ ] **4.1** Create `src/shared/space-context/space-context.service.ts` + `.spec.ts`.
  - `@Injectable()` singleton backed by `AsyncLocalStorage<{ spaceId: string }>`.
  - Methods: `run<T>(spaceId: string, fn: () => T): T`, `get(): string | undefined`, `require(): string` (throws `SpaceContextMissingException` if empty).
  - **Acceptance**: spec passes; `require()` throws when store is empty; `run()` provides isolation across concurrent executions.
  - **Test**: unit — `get()` undefined outside run; `require()` throws; `run()` nests correctly; ALS isolation between two concurrent calls.
  - **Sequential after**: 1.2 (needs `SpaceContextMissingException`)

### 4.2 — `createTenantRepository` Factory

- [ ] **4.2** Create `src/shared/tenant-repository/create-tenant-repository.factory.ts` + `.spec.ts`.
  - `createTenantRepository<E extends { spaceId: string }>(repo: Repository<E>, ctx: SpaceContext): Repository<E>`.
  - Returns a `Proxy` that intercepts: `findOne`, `find`, `findAndCount` (merges `where: { spaceId: ctx.require() }`), `save` (sets `spaceId`), `delete` (merges condition).
  - Unintercepted methods pass through via `Reflect.get`.
  - **Acceptance**: spec passes; intercepted methods inject spaceId; unintercepted methods delegate; `save` with empty context throws `SpaceContextMissingException`.
  - **Test**: unit — each intercepted method, fail-closed for empty context, pass-through for unintercepted methods.
  - **Sequential after**: 4.1

### 4.3 — `@SkipSpace()` Decorator

- [ ] **4.3** Create `src/shared/decorators/skip-space.decorator.ts`.
  - `export const SKIP_SPACE_KEY = 'skipSpace'`; `@SkipSpace() = SetMetadata(SKIP_SPACE_KEY, true)`.
  - **Acceptance**: decorator compiles; `Reflector.getAllAndOverride(SKIP_SPACE_KEY, ...)` returns `true` when applied.
  - **Test**: none (decorator is trivial — no logic).
  - **Parallel**: can be done alongside 4.1

---

## Phase 5 — `SpaceGuard` + Transport

> Sequential after Phase 4 (needs `SpaceContext`, `@SkipSpace()`, `MembershipFindByUserAndSpaceQuery`).

### 5.1 — ALS Frame Lifetime Validation (spike)

- [x] **5.1** Validate whether a NestJS `CanActivate` guard returning `Promise<boolean>` keeps the `AsyncLocalStorage` frame alive for the full async handler chain, or if `run()` must be hosted in a middleware/interceptor.
  - Write a minimal throw-away test (can be a spike `.spec.ts` or inline comment) that verifies frame survival across `await next()`.
  - **Acceptance**: conclusion documented in a `// ALS Decision:` comment at top of `space.guard.ts` before it's written.
  - **Test**: spike unit test or manual verification.
  - **Sequential after**: 4.1

### 5.2 — `SpaceGuard`

- [x] **5.2** Create `src/contexts/spaces/transport/guards/space.guard.ts` + `.spec.ts`.
  - Implements `CanActivate`.
  - Reads `SKIP_SPACE_KEY` via `Reflector`; returns `true` immediately if set.
  - Extracts `req.user` (set by `JwtAuthGuard`); if absent, throws `UnauthorizedException`.
  - Reads `req.headers['x-space-id']`; if absent or not valid UUID → throws `MissingSpaceHeaderException` (400).
  - Executes `MembershipFindByUserAndSpaceQuery` via `QueryBus`; if null → throws `NotASpaceMemberException` (403).
  - Calls `spaceContext.run(spaceId, () => resolve(true))` — ALS frame wraps rest of request.
  - Uses same dual-context `getRequest()` helper as `JwtAuthGuard` (REST + GraphQL).
  - **Acceptance**: spec passes; 400/403/allow scenarios all tested with mocked `QueryBus` + `SpaceContext`.
  - **Test**: unit — missing header, invalid UUID header, non-member, member (frame established), skip decorator bypass.
  - **Sequential after**: 5.1, 4.1, 4.3, 2.6

### 5.3 — `SpacesModule`

- [x] **5.3** Create `src/contexts/spaces/spaces.module.ts`.
  - Registers: `SpaceEntity`, `SpaceMembershipEntity` via `TypeOrmModule.forFeature(...)`.
  - Provides: all command handlers (2.1–2.3), query handlers (2.4–2.6), read/write repositories.
  - Exports: `SpaceReadRepository`, `MembershipReadRepository` (needed by guard).
  - Does NOT register `SpaceGuard` here — guard wiring is in `app.module.ts` (Phase 8).
  - **Acceptance**: module compiles; all providers resolvable.
  - **Test**: none (no module spec files per convention).
  - **Sequential after**: 3.3, 3.4, 2.1–2.6

---

## Phase 6 — Adapt Existing Contexts

> Sequential after Phase 4 complete (SpaceContext + factory available). Run auth and users adaptations in parallel.

### 6.1 — Auth: Add `spaceId` to `AccountEntity`

- [ ] **6.1** Modify `src/contexts/auth/infrastructure/persistence/typeorm/account.entity.ts`.
  - Add `@Column({ name: 'space_id' }) spaceId: string;`
  - Update unique index annotation: replace `@Unique(['email'])` with `@Unique(['spaceId', 'email'])`.
  - **Acceptance**: entity compiles; column name matches migration 0.4.
  - **Test**: update `account-typeorm.mapper.spec.ts` to include `spaceId` in fixture.
  - **Sequential after**: Phase 4

### 6.2 — Auth: Wrap Account Repositories with Tenant Factory

- [ ] **6.2** Modify `src/contexts/auth/infrastructure/persistence/typeorm/account-typeorm-read.repository.ts` and `account-typeorm-write.repository.ts`.
  - Inject `SpaceContext`; wrap injected `Repository<AccountEntity>` via `createTenantRepository(repo, ctx)`.
  - **Acceptance**: existing read/write repo tests pass; new tests verify `spaceId` is injected via the proxy.
  - **Test**: update existing `.spec.ts` files — add mock `SpaceContext`, assert proxy behaviour on at least one method.
  - **Sequential after**: 6.1, 4.2

### 6.3 — Auth: Update `register-account` Handler (Bootstrap Orchestration)

- [ ] **6.3** Modify `src/contexts/auth/application/commands/register-account/register-account.handler.ts`.
  - Before saving account: dispatch `CreateSpaceCommand(ownerId=userId, name='<username>\'s Space')`.
  - Receive `spaceId` from the newly created Space.
  - Wrap the account/user save calls in `SpaceContext.run(newSpaceId, ...)` so the tenant-wrapped repos accept the writes.
  - Return `spaceId` in the command result (so caller can relay it to the client per auth spec §2.1).
  - Annotate registration transport endpoint with `@SkipSpace()` (in transport layer, not handler).
  - **Acceptance**: `register-account.handler.spec.ts` updated and passing; atomicity verified by mock ordering; `spaceId` returned.
  - **Test**: unit — happy path (space created, account saved with spaceId), `CreateSpaceCommand` failure rolls back (mock throws, assert account not saved).
  - **Sequential after**: 6.2, 2.1, 4.1

### 6.4 — Auth: Annotate Auth Transport with `@SkipSpace()`

- [ ] **6.4** Apply `@SkipSpace()` to the registration and login endpoints/resolvers.
  - Files: REST controller and/or GraphQL resolver in `src/contexts/auth/transport/`.
  - **Acceptance**: `@SkipSpace()` present on `register` and `login` handlers; no other auth routes are exempt.
  - **Test**: none (decorator only).
  - **Sequential after**: 4.3, identify auth transport files (REST: `src/contexts/auth/transport/rest/`, GQL: check resolver)

### 6.5 — Users: Add `spaceId` to `UserEntity`

- [ ] **6.5** Modify `src/contexts/users/infrastructure/persistence/typeorm/entities/user.entity.ts`.
  - Add `@Column({ name: 'space_id' }) spaceId: string;`
  - Update unique index: replace `@Unique(['username'])` with `@Unique(['spaceId', 'username'])`.
  - **Acceptance**: entity compiles; column name matches migration 0.5.
  - **Test**: update `user-typeorm.mapper.spec.ts` fixture to include `spaceId`.
  - **Parallel with**: 6.1

### 6.6 — Users: Wrap User Repositories with Tenant Factory

- [ ] **6.6** Modify `src/contexts/users/infrastructure/persistence/typeorm/repositories/user-typeorm-read.repository.ts` and `user-typeorm-write.repository.ts`.
  - Inject `SpaceContext`; wrap injected `Repository<UserEntity>` via `createTenantRepository(repo, ctx)`.
  - **Acceptance**: existing repo tests pass; new assertions verify `spaceId` injection.
  - **Test**: update `.spec.ts` — mock `SpaceContext`, assert proxy on at least one read + one write.
  - **Sequential after**: 6.5, 4.2

### 6.7 — Auth: Update `AssertAccountEmailAvailableService`

- [ ] **6.7** Verify `src/contexts/auth/application/services/write/assert-account-email-available/assert-account-email-available.service.ts`.
  - Since email uniqueness is now `(spaceId, email)`, the uniqueness check must scope by `spaceId`. The tenant repo wrapping (6.2) handles this automatically if the service uses the wrapped read repo.
  - Confirm no manual email-only query exists; update if it does.
  - **Acceptance**: `assert-account-email-available.service.spec.ts` passes with mocked tenant-aware repo.
  - **Test**: unit — same-space duplicate rejected, cross-space same email allowed.
  - **Sequential after**: 6.2

---

## Phase 7 — E2E Isolation Tests

> Sequential after Phase 6 complete. E2E tests run against a real DB (`pnpm test:e2e`).

### 7.1 — E2E: Cross-Space Data Leak

- [ ] **7.1** Create `test/e2e/spaces/cross-space-isolation.e2e-spec.ts`.
  - Scenario: register user A (Space A created), register user B (Space B created). User A creates a resource (user record) in Space A. User B queries the same resource type — MUST get empty result.
  - **Acceptance**: test passes; Space B sees 0 records for resources created in Space A.
  - **Test**: E2E.

### 7.2 — E2E: Missing `X-Space-ID` Header → 400

- [ ] **7.2** In `test/e2e/spaces/space-guard.e2e-spec.ts` (or same file as 7.1):
  - Scenario: authenticated user makes request WITHOUT `X-Space-ID` header to a guarded endpoint.
  - **Acceptance**: response is HTTP 400.
  - **Test**: E2E.

### 7.3 — E2E: Non-Member `X-Space-ID` → 403

- [ ] **7.3** Same test file:
  - Scenario: authenticated user provides a valid Space UUID they are NOT a member of.
  - **Acceptance**: response is HTTP 403.
  - **Test**: E2E.

### 7.4 — E2E: Duplicate Email Across Spaces → OK

- [ ] **7.4** In `test/e2e/auth/cross-space-email.e2e-spec.ts`:
  - Scenario: User A registers `alice@example.com` in Space A. A second registration attempt with the same email in a different Space (Space B — new user flow) MUST succeed.
  - **Acceptance**: both registrations return 201/200; no uniqueness error.
  - **Test**: E2E.

### 7.5 — E2E: Duplicate Email Within Same Space → 409

- [ ] **7.5** Same or adjacent test file:
  - Scenario: two registrations with the same email in the same Space.
  - **Acceptance**: second registration returns conflict error.
  - **Test**: E2E.

---

## Phase 8 — Cleanup & Final Wiring

> Sequential after Phase 5 + 6. Final pass to connect all modules.

### 8.1 — `app.module.ts`: Register `SpacesModule` + `SpaceContext`

- [ ] **8.1** Modify `src/app.module.ts`.
  - Import `SpacesModule`.
  - Provide `SpaceContext` as a global singleton provider (or export from `SpacesModule` with `@Global()`).
  - **Acceptance**: app boots without error; `SpaceContext` is injectable in all modules.
  - **Test**: none.

### 8.2 — `app.module.ts`: Register `SpaceGuard` as `APP_GUARD`

- [ ] **8.2** Modify `src/app.module.ts`.
  - Add `{ provide: APP_GUARD, useClass: SpaceGuard }` AFTER the existing `JwtAuthGuard` `APP_GUARD` entry (order matters — JWT runs first).
  - **Acceptance**: guard order is `JwtAuthGuard` → `SpaceGuard`; a request without JWT is rejected by JWT guard before Space guard executes.
  - **Test**: none (covered by E2E in Phase 7).

### 8.3 — `MAX_SPACES_PER_USER` Config

- [ ] **8.3** Add `MAX_SPACES_PER_USER` to the app config / `.env.example`.
  - Default value: `5`.
  - `CreateSpaceCommandHandler` (2.1) reads from `ConfigService`; document the env var name.
  - **Acceptance**: `ConfigService.get('MAX_SPACES_PER_USER')` returns `5` when env var is unset; handler uses it.
  - **Test**: update 2.1 handler test to verify config reads default value.

### 8.4 — `auth.module.ts`: Provide `SpaceContext` dependency

- [ ] **8.4** Verify `src/contexts/auth/auth.module.ts` imports `SpacesModule` (or the shared module exporting `SpaceContext`) so `SpaceContext` and `createTenantRepository` are injectable in auth repos/handlers.
  - **Acceptance**: auth module resolves `SpaceContext` without circular dependency.
  - **Test**: app boots (checked by E2E run).

### 8.5 — `users.module.ts`: Provide `SpaceContext` dependency

- [ ] **8.5** Same as 8.4 for `src/contexts/users/users.module.ts`.
  - **Acceptance**: users module resolves `SpaceContext`; no circular dependency.
  - **Test**: app boots.

### 8.6 — Lint & Type Check Pass

- [ ] **8.6** Run `pnpm lint` and `tsc --noEmit` to zero errors.
  - Fix any import or type errors introduced by the change.
  - **Acceptance**: both commands exit 0.
  - **Test**: CI quality gate.

### 8.7 — Full Test Suite Green

- [ ] **8.7** Run `pnpm test` (unit) and `pnpm test:e2e`.
  - **Acceptance**: all tests pass; coverage for new `spaces` context ≥ 80%.
  - **Test**: CI gate.

---

## Task Index by Phase

| Phase | Tasks | Parallel opportunity |
|-------|-------|---------------------|
| 0 — Migrations | 0.1–0.5 | 0.1 first; 0.2–0.5 sequential |
| 1 — Domain | 1.1–1.6 | 1.1–1.3 parallel; 1.4 after 1.1+1.2; 1.5 after 1.4; 1.6 after 1.5 |
| 2 — Application | 2.1–2.6 | 2.1–2.6 all depend on 1.6; can parallelize 2.1 vs 2.4–2.6 |
| 3 — Infra | 3.1–3.4 | 3.1.1 ∥ 3.1.2; 3.2.1 ∥ 3.2.2 (after 3.1); 3.3 ∥ 3.4 (after 3.2) |
| 4 — Cross-cutting | 4.1–4.3 | 4.3 parallel with 4.1; 4.2 after 4.1 |
| 5 — SpaceGuard | 5.1–5.3 | 5.1 first; 5.2 + 5.3 after 5.1+Phase4+Phase2 |
| 6 — Adapt contexts | 6.1–6.7 | 6.1 ∥ 6.5; 6.2 after 6.1; 6.6 after 6.5; 6.3 after 6.2+2.1; 6.7 after 6.2 |
| 7 — E2E | 7.1–7.5 | 7.2–7.5 can be in one file; all parallel after Phase 6 |
| 8 — Wiring | 8.1–8.7 | 8.1 first; 8.2 after 8.1; 8.4 ∥ 8.5 after 8.1; 8.6+8.7 last |

**Total tasks: 55**
