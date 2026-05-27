# Auth Context

## Purpose

The `auth` context owns account identity: registration, credential validation, and JWT issuance. It does NOT manage user profiles (names, avatars, preferences) — that is the responsibility of the `users` context. An **account** is the security principal; a **user** is the profile attached to it.

---

## Conceptual Flow (for newcomers)

Here is what happens when a new account is registered end-to-end:

1. An HTTP `POST /api/auth/register` or a GraphQL `mutation { register(...) }` arrives.
2. `AuthController` (REST) or `AuthResolver` (GraphQL) receives the request and dispatches a `RegisterAccountCommand` onto the CQRS `CommandBus`.
3. `RegisterAccountCommandHandler` picks up the command. It calls `AssertAccountEmailAvailableService` to guard against duplicates, then uses `AccountBuilder` to construct an `AccountAggregate` instance.
4. `AccountAggregate.create()` is called explicitly — this applies `AccountCreatedEvent` to the aggregate's uncommitted-events queue.
5. `IAccountWriteRepository.save()` persists the aggregate via `AccountTypeOrmWriteRepository`.
6. The response returns `void` (REST 201) or `true` (GraphQL).

For login, the flow is:

1. `POST /api/auth/login` or `mutation { login(...) }` arrives.
2. `LoginAccountCommand` is dispatched. `LoginAccountCommandHandler` calls `ValidateAccountCredentialsService` to verify the password hash, then `TokenService` to generate a JWT.
3. `{ accessToken }` is returned to the caller.

---

## Architecture Layers

| Layer | Path | What lives here |
|-------|------|-----------------|
| **domain** | `domain/` | `AccountAggregate`, `AccountBuilder`, value objects (`AccountEmailValueObject`, `AccountIdValueObject`, `AccountPasswordHashValueObject`), domain events, repository interfaces, exceptions |
| **application** | `application/` | Command handlers (`RegisterAccountCommandHandler`, `LoginAccountCommandHandler`, `DeleteAccountCommandHandler`), query handlers (`AccountFindByIdQueryHandler`, `AccountFindByCriteriaQueryHandler`), application services (`AuthService`, `TokenService`, `AssertAccountEmailAvailableService`, `AssertAccountExistsService`, `ValidateAccountCredentialsService`, `AssertAccountViewModelExistsService`) |
| **infrastructure** | `infrastructure/` | TypeORM repository implementations (`AccountTypeOrmReadRepository`, `AccountTypeOrmWriteRepository`), `AccountTypeOrmMapper`, `AccountEntity`, Passport strategies (`LocalStrategy`, `JwtStrategy`), guards (`JwtAuthGuard`, `LocalAuthGuard`) |
| **transport** | `transport/` | `AuthResolver` (GraphQL mutations), `AuthController` (REST endpoints), DTOs and input objects |

---

## Public API

### REST Endpoints

All REST endpoints are prefixed with `/api` (global prefix set in `main.ts`).

| Method | Path | Auth required | Description |
|--------|------|---------------|-------------|
| `POST` | `/api/auth/register` | No | Register a new account. Returns 201 on success, 409 if email already exists. |
| `POST` | `/api/auth/login` | No | Log in with email and password. Returns `{ accessToken: string }` on success, 401 on wrong credentials. |

Example:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@example.com", "password": "secret123"}'

curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@example.com", "password": "secret123"}'
```

### GraphQL Operations

| Name | Type | Auth required | Description |
|------|------|---------------|-------------|
| `register(input: RegisterAccountInput)` | `Mutation` | No | Registers a new account. Returns `Boolean` (`true` on success). |
| `login(input: LoginUserInput)` | `Mutation` | No | Logs in and returns `AuthPayloadObject` with `accessToken`. |

Example:

```graphql
mutation {
  register(input: { email: "alice@example.com", password: "secret123" })
}

mutation {
  login(input: { email: "alice@example.com", password: "secret123" }) {
    accessToken
  }
}
```

### Commands & Queries

| Class | Type | Purpose |
|-------|------|---------|
| `RegisterAccountCommand` | Command | Creates a new account with email + hashed password |
| `LoginAccountCommand` | Command | Validates credentials and returns a JWT |
| `DeleteAccountCommand` | Command | Marks an account as deleted |
| `AccountFindByIdQuery` | Query | Returns an account view model by id |
| `AccountFindByCriteriaQuery` | Query | Returns a paginated list of account view models matching criteria |

### Domain Events

| Class | When emitted |
|-------|-------------|
| `AccountCreatedEvent` | When `AccountAggregate.create()` is called (account first persisted) |
| `AccountPasswordChangedEvent` | When `AccountAggregate.changePassword()` is called |
| `AccountDeletedEvent` | When `AccountAggregate.delete()` is called |

---

## How to Test This Module

**Unit tests** (no database, no HTTP):

```bash
pnpm test src/contexts/auth
```

Unit spec files live next to their source files (e.g., `account.aggregate.spec.ts` next to `account.aggregate.ts`). They use direct class instantiation with `jest.Mocked<T>` collaborators — no NestJS DI container.

**E2E tests** (requires Docker):

```bash
docker compose -f docker-compose.test.yml up -d
pnpm test:e2e --testPathPattern=auth
```

E2E coverage lives in `test/auth.e2e-spec.ts`. It tests both the REST and GraphQL transports against a real Postgres instance.

---

## Configuration & Dependencies

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | Yes | Secret key used to sign JWT tokens |
| `JWT_EXPIRES_IN` | No | JWT expiry duration (default: `1d`) |

These are consumed via `authConfig` (registered as `'auth'` namespace) in `src/core/config/auth.config.ts`.

### `@sisques-labs/nestjs-kit` base classes used

| Class | Used by |
|-------|---------|
| `BaseAggregate` | `AccountAggregate` extends it; provides `apply()` and `getUncommittedEvents()` |
| `UuidValueObject` | Used for `_userId` field inside `AccountAggregate` |

### External NestJS packages

- `@nestjs/cqrs` — `CommandBus`, `QueryBus`, `CqrsModule`
- `@nestjs/jwt` — `JwtModule`, `JwtService`
- `@nestjs/passport` — `PassportModule`
- `@nestjs/typeorm` — `TypeOrmModule.forFeature([AccountEntity])`
- `passport-local` / `passport-jwt` — strategy implementations
