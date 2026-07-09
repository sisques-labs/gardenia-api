# Users Context

## Purpose

The `users` context owns user profiles: display names, avatars, bios, locale, timezone, and status. It does NOT manage authentication credentials or JWT tokens — that is the responsibility of the `auth` context. A **user** is the profile entity; the `auth` context holds the matching security principal.

---

## Identity vs. Membership

A `users` row is a **global** profile keyed by a stable `id` — one row per person, never duplicated per space. Its `space_id` column only records the space the user's account was originally created in (their "home" space); it is **not** the source of truth for "who belongs to this space".

Space membership is modeled separately in `space_memberships` (owned by the `spaces` context): a user who joins a space via an invitation gets a `space_memberships` row in that space without ever touching their `users` row. Because of this, `UserTypeOrmReadRepository` resolves `userFindById` / `usersFindByCriteria` with an explicit `INNER JOIN space_memberships ON space_memberships.user_id = users.id`, scoped by the active `X-Space-ID`, instead of filtering `users.space_id`. This ensures invited members are visible in the space's user listings even though their `users.space_id` still points at their original space. The write repository and the `users.space_id` column itself are untouched by this — they remain relevant for account-scoped flows that run outside a space context (e.g. delete-account).

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

## MCP Tools

Exposed under `transport/mcp/` for AI clients (see `src/core/mcp/README.md`). Each tool dispatches through the Command/Query bus; `user_update` targets the authenticated user.

| Tool | Action |
|------|--------|
| `user_update` | Update the authenticated user profile |
| `user_find_by_id` | Get a user by id |
| `user_find_by_criteria` | Paginated list of users |
