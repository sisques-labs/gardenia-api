# Users Context

## Purpose

The `users` context owns user profiles: display names, avatars, bios, locale, timezone, and status. It does NOT manage authentication credentials or JWT tokens — that is the responsibility of the `auth` context. A **user** is the profile entity; the `auth` context holds the matching security principal.

---

## Identity vs. Membership Model

Understanding the distinction between a user's identity and their space membership is important for working with this context correctly.

- `users.id` is a **global primary key** — there is exactly one row per user across the entire system, not one per space.
- `users.space_id` is the **home space** from registration: it records the space the user was registered in. The write repository uses this column to stamp new rows. It is **not** used as a membership filter on reads.
- Space membership is tracked in the `space_memberships (space_id, user_id, role, joined_at)` table. A user may belong to multiple spaces; invited members only appear in `space_memberships` — they do not get a new `users` row.
- The read repository (`UserTypeOrmReadRepository`) resolves "users in this space" via an `INNER JOIN space_memberships ON sm.user_id = users.id AND sm.space_id = :spaceId` in every query.
- This ensures invited members (who only have a `space_memberships` row, not a matching `users.space_id`) appear correctly in all read queries including `usersFindByCriteria` and `userFindById`.

---

## Conceptual Flow (for newcomers)

Here is what happens when a user is created end-to-end:

1. An account is registered via the `auth` context. `RegisterAccountCommandHandler` dispatches a `CreateUserCommand` onto the bus after persisting the account.
2. `CreateUserCommandHandler` picks up the command. It calls `AssertUsernameAvailableService` to guard against duplicate usernames, then uses `UserBuilder` to construct a `UserAggregate` instance.
3. `UserAggregate.create()` is called explicitly — this applies `UserCreatedEvent` to the aggregate's uncommitted-events queue.
4. `IUserWriteRepository.save()` persists the aggregate via `UserTypeOrmWriteRepository`.

For profile queries and mutations, the flow is purely GraphQL:

1. A GraphQL query (`userFindById`, `usersFindByCriteria`) or mutation (`userUpdate`, `userDelete`) arrives.
2. `UserQueriesResolver` or `UserMutationsResolver` receives it and dispatches the appropriate `Query` or `Command` onto the CQRS bus.
3. Query handlers read from `IUserReadRepository`; command handlers write via `IUserWriteRepository`.
4. `UserGraphQLMapper` converts the domain view model to a `UserResponseDto` before returning.

---

## Architecture Layers

| Layer | Path | What lives here |
|-------|------|-----------------|
| **domain** | `domain/` | `UserAggregate`, `UserBuilder`, value objects (`UserIdValueObject`, `UsernameValueObject`, `UserStatusValueObject`), domain events, repository interfaces, exceptions |
| **application** | `application/` | Command handlers (`CreateUserCommandHandler`, `UpdateUserCommandHandler`, `DeleteUserCommandHandler`), query handlers (`UserFindByIdQueryHandler`, `UserFindByCriteriaQueryHandler`), application services (`AssertUserExistsService`, `AssertUserViewModelExistsService`, `AssertUsernameAvailableService`) |
| **infrastructure** | `infrastructure/` | TypeORM repository implementations (`UserTypeOrmReadRepository`, `UserTypeOrmWriteRepository`), `UserTypeOrmMapper`, `UserTypeOrmEntity` |
| **transport** | `transport/` | `UserQueriesResolver`, `UserMutationsResolver` (GraphQL), `UsersController` (empty REST stub), GraphQL DTOs, `UserGraphQLMapper`, enum registrations |

---

## Public API

### REST Endpoints

None. The `UsersController` at `transport/rest/controllers/users.controller.ts` is currently an empty stub with no mapped routes. All user operations are GraphQL-only.

### GraphQL Operations

| Name | Type | Auth required | Description |
|------|------|---------------|-------------|
| `usersFindByCriteria(input?: UserFindByCriteriaRequestDto)` | `Query` | No* | Returns a paginated list of users matching optional filters and sorts |
| `userFindById(input: UserFindByIdRequestDto)` | `Query` | No* | Returns a single user by id, or `null` if not found |
| `userUpdate(input: UserUpdateRequestDto)` | `Mutation` | No* | Updates user fields (currently: `status`). Returns `MutationResponseDto` |
| `userDelete(input: UserDeleteRequestDto)` | `Mutation` | No* | Deletes a user by id. Returns `MutationResponseDto` |

> *Auth guards are defined (`JwtAuthGuard`) but currently commented out in resolver decorators. Expect this to change.

Example:

```graphql
query {
  usersFindByCriteria {
    items {
      id
      username
      status
    }
    total
  }
}

query {
  userFindById(input: { id: "uuid-here" }) {
    id
    username
    firstName
    lastName
  }
}

mutation {
  userUpdate(input: { id: "uuid-here", status: ACTIVE }) {
    success
    message
  }
}

mutation {
  userDelete(input: { id: "uuid-here" }) {
    success
    message
  }
}
```

### Commands & Queries

| Class | Type | Purpose |
|-------|------|---------|
| `CreateUserCommand` | Command | Creates a new user profile (called internally after account registration) |
| `UpdateUserCommand` | Command | Updates user fields (id + status) |
| `DeleteUserCommand` | Command | Marks a user as deleted |
| `UserFindByIdQuery` | Query | Returns a user view model by id |
| `UserFindByCriteriaQuery` | Query | Returns a paginated list of user view models matching criteria |

### Domain Events

| Class | When emitted |
|-------|-------------|
| `UserCreatedEvent` | When `UserAggregate.create()` is called (user first persisted) |
| `UserUpdatedEvent` | When `UserAggregate.update()` is called |
| `UserDeletedEvent` | When `UserAggregate.delete()` is called |
| `UserStatusChangedEvent` | When status field changes during `update()` |
| `UserUsernameChangedEvent` | When username field changes during `update()` |
| `UserFirstNameChangedEvent` | When firstName field changes during `update()` |
| `UserLastNameChangedEvent` | When lastName field changes during `update()` |
| `UserAvatarUrlChangedEvent` | When avatarUrl field changes during `update()` |
| `UserBioChangedEvent` | When bio field changes during `update()` |
| `UserLocaleChangedEvent` | When locale field changes during `update()` |
| `UserTimezoneChangedEvent` | When timezone field changes during `update()` |

---

## How to Test This Module

**Unit tests** (no database, no HTTP):

```bash
pnpm test src/contexts/users
```

Unit spec files live next to their source files (e.g., `user.aggregate.spec.ts` next to `user.aggregate.ts`). They use direct class instantiation with `jest.Mocked<T>` collaborators — no NestJS DI container. The exception is `users.module.spec.ts`, which bootstraps the DI container to verify provider wiring.

**E2E tests** (requires Docker):

```bash
docker compose -f docker-compose.test.yml up -d
pnpm test:e2e --testPathPattern=users
```

E2E coverage lives in `test/users.e2e-spec.ts`. It tests all four GraphQL operations against a real Postgres instance using a JWT obtained via the auth flow.

---

## Configuration & Dependencies

### Environment Variables

The users context has no environment variables of its own. It relies on the database config provided by `src/core/config/postgres.config.ts`:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_HOST` | Yes | Postgres host |
| `DATABASE_PORT` | No | Postgres port (default: `5432`) |
| `DATABASE_USERNAME` | Yes | Postgres username |
| `DATABASE_PASSWORD` | Yes | Postgres password |
| `DATABASE_DATABASE` | Yes | Postgres database name |

### `@sisques-labs/nestjs-kit` base classes used

| Class | Used by |
|-------|---------|
| `BaseAggregate` | `UserAggregate` extends it; provides `apply()` and `getUncommittedEvents()` |
| `MutationResponseGraphQLMapper` | `UserMutationsResolver` — maps command results to `MutationResponseDto` |
| `MutationResponseDto` | Return type for `userUpdate` and `userDelete` mutations |
| `Criteria` | `UserFindByCriteriaQueryHandler` — wraps filters, sorts, pagination |
| `UserStatusEnum` | Used inside `UserAggregate` for status field typing |

### External NestJS packages

- `@nestjs/cqrs` — `CommandBus`, `QueryBus`, `CqrsModule`
- `@nestjs/typeorm` — `TypeOrmModule.forFeature([UserTypeOrmEntity])`
- `@nestjs/graphql` — `@Resolver()`, `@Query()`, `@Mutation()`, `@Args()`
