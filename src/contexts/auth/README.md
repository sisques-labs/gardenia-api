# Auth Context

## What this context owns

The `auth` context is the **identity and security boundary** of the application. It owns:

- **Accounts** — the security principal (email + password hash + app role)
- **Auth sessions** — refresh token lifecycle (rotation, revocation, reuse detection)
- **OAuth identities** — third-party provider links (Google, GitHub, Apple)
- **JWT issuance** — signing access tokens and embedding identity claims
- **App-level RBAC** — `AppRoleEnum { ADMIN, USER }` enforcement via `AppRoleGuard`

What it does **not** own: user profiles (names, avatars, bios). That belongs to the `users` context. An **account** is the security principal; a **user** is the profile attached to it. They share the same `userId` but live in separate bounded contexts.

---

## Core aggregates

### `AccountAggregate`

The central aggregate. Fields:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `AccountIdValueObject` | Account UUID |
| `userId` | `UuidValueObject` | Links to the `users` context profile |
| `email` | `AccountEmailValueObject` | Unique, lowercased email |
| `passwordHash` | `AccountPasswordHashValueObject` | bcrypt hash |
| `appRole` | `AppRoleValueObject` | `ADMIN` or `USER` (default: `USER`) |

Domain methods:

- `create()` — applies `AccountCreatedEvent`, call after saving via the builder
- `changePassword(hash)` — applies `AccountPasswordChangedEvent`
- `changePasswordWithValidation(current, new)` — bcrypt comparison + change
- `delete()` — applies `AccountDeletedEvent`

### `AuthSessionAggregate`

Represents a refresh token session. Fields: `id`, `userId`, `tokenHash` (bcrypt hash of the raw token), `expiresAt`, `revokedAt`, `deviceInfo`.

Methods:

- `create()` — applies `AuthSessionCreatedEvent`
- `revoke(reason)` — idempotent, sets `revokedAt`, applies `AuthSessionRevokedEvent`
- `markReuseDetected()` — applies `AuthSessionReuseDetectedEvent` (token rotation attack signal)

### `OAuthIdentityAggregate`

Links a third-party provider identity (`provider` + `providerUserId`) to a `userId`. Created on first OAuth login; reused on subsequent logins.

### `ApiTokenAggregate`

A long-lived, **space-scoped** API token for non-interactive clients (e.g. Home Assistant's MCP client) that cannot run a JWT refresh flow. Fields: `id`, `userId`, `spaceId`, `label`, `tokenHash` (SHA-256 of the raw token), `lastUsedAt`, `revokedAt`.

- Plaintext is shown **once** at issuance (prefixed `ght_`) and never recoverable; only the hash is stored.
- `revoke()` — idempotent, sets `revokedAt`.
- `markUsed(at)` — records last authentication time.
- Presented as `Authorization: Bearer ght_…`; the guard resolves it to the owning user **and** the token's space, so no `X-Space-ID` header is needed.

---

## Architecture layers

```
auth/
├── domain/          → aggregates, builders, value objects, interfaces,
│                      primitives, repository interfaces, events, exceptions, enums
├── application/     → command handlers, query handlers, application services
├── infrastructure/  → TypeORM repos + mappers, Passport strategies, guards, decorators
└── transport/
    ├── graphql/     → resolvers, DTOs (GQL input types), GQL objects
    └── rest/        → controllers, DTOs, mappers
```

---

## How registration works (end-to-end)

```
POST /api/auth/register   →   AuthController
                          →   RegisterAccountCommand (CommandBus)
                          →   RegisterAccountCommandHandler
                              1. AssertAccountEmailAvailableService (throws 409 if duplicate)
                              2. AccountBuilder.withEmail().withPasswordHash().withAppRole(USER).build()
                              3. account.create()  →  queues AccountCreatedEvent
                              4. AccountWriteRepository.save()
```

## How login works

```
POST /api/auth/login      →   AuthController (LocalAuthGuard validates credentials inline)
                          →   LoginAccountCommand
                          →   LoginAccountCommandHandler
                              1. ValidateAccountCredentialsService (bcrypt compare)
                              2. TokenService.sign(userId, email, role)  →  JWT
                              3. GenerateRefreshTokenService  →  raw token
                              4. HashRefreshTokenService  →  token hash
                              5. AuthSessionBuilder.build()  →  session.create()  →  save
                              6. Returns { accessToken, refreshToken }
                              7. Refresh token is set as HttpOnly cookie by RefreshCookieService
```

## How token refresh works

```
POST /api/auth/refresh    →   RefreshTokenCommandHandler
                              1. Extract hashed token from cookie
                              2. Find session by userId + match hash
                              3. If session already revoked → markReuseDetected() + revoke all sessions (rotation attack)
                              4. Revoke old session, create new session
                              5. Issue new accessToken + refreshToken
```

## How OAuth login works

```
GET /api/auth/{provider}          →   DynamicOAuthGuard → passport OAuth strategy
GET /api/auth/{provider}/callback →   OAuthController
                                  →   LoginWithOAuthCommand
                                      1. Find existing OAuthIdentity by providerUserId
                                         - If found: resolve userId + read account for actual appRole
                                         - If not found + email match: auto-link to existing account (preserve role)
                                         - If not found + no match: provision new user + space (role = USER)
                                      2. Issue JWT + refresh token (same as login)
```

---

## JWT payload

Every issued token carries:

```json
{ "sub": "<userId>", "email": "<email>", "role": "user" | "admin" }
```

`JwtStrategy.validate()` extracts these and returns a `CurrentUserPayload`:

```typescript
interface CurrentUserPayload {
  userId: string;
  email: string;
  appRole: AppRoleEnum;  // defaults to AppRoleEnum.USER if claim absent (backward compat)
}
```

Access the current user in any resolver or controller via:

```typescript
@CurrentUser() user: CurrentUserPayload
```

---

## App-level RBAC

Two roles: `AppRoleEnum.ADMIN` and `AppRoleEnum.USER`.

The role lives on the account, travels in the JWT, and is enforced at the transport boundary by `AppRoleGuard`. It is **not** registered globally — it must be applied per-resolver.

**Usage:**

```typescript
@UseGuards(JwtAuthGuard, AppRoleGuard)   // JwtAuthGuard MUST run first
@RequireAppRole(AppRoleEnum.ADMIN)
@Mutation(() => String)
adminOnlyMutation() { ... }
```

`AppRoleGuard` behavior:
- No `@RequireAppRole` metadata → **pass** (opt-in)
- No `req.user` → **401**
- Role mismatch → **403**
- Role match → **pass**

**Promoting the first ADMIN** (no endpoint yet — operational):

```sql
UPDATE accounts SET app_role = 'admin' WHERE email = 'admin@example.com';
```

After promoting, the user must log out and log back in (or call `logoutAll`) to get a new JWT with the `admin` claim.

---

## Public API

### REST endpoints (`/api/auth/*`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/register` | — | Register with email + password. Returns 201. |
| `POST` | `/api/auth/login` | — | Login. Returns `{ accessToken }` + sets refresh cookie. |
| `POST` | `/api/auth/refresh` | cookie | Rotate refresh token. Returns new `{ accessToken }` + new cookie. |
| `POST` | `/api/auth/logout` | JWT | Revoke current session. |
| `POST` | `/api/auth/logout-all` | JWT | Revoke all sessions for the current user. |
| `POST` | `/api/auth/change-password` | JWT | Change password (requires current password). |
| `DELETE` | `/api/auth/account` | JWT | Delete own account. |
| `GET` | `/api/auth/google` | — | Redirect to Google OAuth. |
| `GET` | `/api/auth/google/callback` | — | Google OAuth callback. |
| `GET` | `/api/auth/github` | — | Redirect to GitHub OAuth. |
| `GET` | `/api/auth/github/callback` | — | GitHub OAuth callback. |
| `GET` | `/api/auth/apple` | — | Redirect to Apple OAuth. |
| `GET` | `/api/auth/apple/callback` | — | Apple OAuth callback. |
| `POST` | `/api/auth/api-tokens` | JWT + space | Issue a space-scoped API token. Returns `{ id, token }` (plaintext once). |
| `GET` | `/api/auth/api-tokens` | JWT | List the current user's API tokens (no secrets). |
| `DELETE` | `/api/auth/api-tokens/:id` | JWT | Revoke an API token. |

### GraphQL operations

| Name | Type | Auth | Description |
|------|------|------|-------------|
| `register(input)` | Mutation | — | Register new account. Returns `Boolean`. |
| `login(input)` | Mutation | — | Login. Returns `AuthPayloadObject { accessToken }`. |
| `logout` | Mutation | JWT | Revoke current session. |
| `logoutAll` | Mutation | JWT | Revoke all sessions. |
| `changePassword(input)` | Mutation | JWT | Change password. |
| `deleteAccount` | Mutation | JWT | Delete own account. |
| `me` | Query | JWT | Returns current `AccountObject`. |
| `accounts(criteria)` | Query | JWT + ADMIN | Paginated account list. |

### Commands & queries

| Class | Description |
|-------|-------------|
| `RegisterAccountCommand` | Creates account; assigns `USER` role; emits `AccountCreatedEvent` |
| `LoginAccountCommand` | Validates credentials; issues JWT + refresh session |
| `RefreshTokenCommand` | Rotates refresh token; detects reuse attacks |
| `LogoutCommand` | Revokes a single session |
| `LogoutAllCommand` | Revokes all sessions for a user |
| `ChangePasswordCommand` | Changes password with current-password validation |
| `DeleteAccountCommand` | Deletes the account aggregate |
| `LoginWithOAuthCommand` | OAuth login/provision flow |
| `LinkOAuthIdentityCommand` | Links a new OAuth provider to an existing account |
| `AccountFindByIdQuery` | Returns account view model by id |
| `AccountFindByCriteriaQuery` | Paginated account list |
| `IssueApiTokenCommand` | Issues a space-scoped API token; returns plaintext once |
| `RevokeApiTokenCommand` | Revokes one of the caller's API tokens |
| `ApiTokenAuthenticateQuery` | Resolves a raw `ght_…` token to `{ userId, spaceId }` (auth path) |
| `ApiTokenFindByUserQuery` | Lists a user's API tokens (view models, no secret) |

### Domain events

| Event | When emitted |
|-------|-------------|
| `AccountCreatedEvent` | `account.create()` — account first persisted |
| `AccountPasswordChangedEvent` | `account.changePassword()` |
| `AccountDeletedEvent` | `account.delete()` |
| `AuthSessionCreatedEvent` | `session.create()` — new login or token rotation |
| `AuthSessionRevokedEvent` | `session.revoke()` — logout or rotation |
| `AuthSessionReuseDetectedEvent` | `session.markReuseDetected()` — reuse attack |
| `OAuthIdentityLinkedEvent` | `identity.link()` — first OAuth login for a provider |

---

## Guards reference

| Guard | Where registered | What it does |
|-------|-----------------|--------------|
| `OptionalJwtAuthGuard` | Global (`APP_GUARD`) | Extracts JWT if present; never throws. Populates `req.user` or leaves it `undefined`. |
| `JwtAuthGuard` | Per-resolver/controller | Requires a valid JWT. Throws 401 if missing or invalid. |
| `LocalAuthGuard` | Login endpoint | Runs `LocalStrategy` (bcrypt credential check). |
| `DynamicOAuthGuard` | OAuth callback | Dispatches to the correct Passport OAuth strategy by provider name. |
| `AppRoleGuard` | Per-resolver/controller | Enforces `@RequireAppRole(...)`. Requires `JwtAuthGuard` to run first. |

---

## Cross-context ports

The registration and OAuth-login flows provision a user and a default space; the
delete-account flow deprovisions the user. These cross-context calls go through
**ports** (`application/ports/`) implemented by **adapters**
(`infrastructure/adapters/`) that dispatch the foreign commands via `CommandBus`.
The handlers never import `@contexts/users` or `@contexts/spaces` directly.

| Port | Adapter | Dispatches | Used by |
|------|---------|-----------|---------|
| `IUserProvisioningPort` (`createUser` / `deleteUser`) | `UserProvisioningAdapter` | `CreateUserCommand` / `DeleteUserCommand` (users) | register-account, login-with-oauth, delete-account |
| `ISpaceProvisioningPort` (`createDefaultSpace`) | `SpaceProvisioningAdapter` | `CreateSpaceCommand` (spaces) | register-account, login-with-oauth |

> Boundary rule: cross-context imports are allowed **only** from
> `infrastructure/adapters/` (enforced by the `boundaries/element-types` ESLint
> rule). Note the inverse exemption — auth's own transversal infrastructure
> (`JwtAuthGuard`, `AppRoleGuard`, `@CurrentUser`, the `AppRole` enum) is the
> allowlisted surface other contexts may import directly.

---

## Running tests

```bash
# Unit tests for this context only
pnpm test src/contexts/auth

# Full suite
pnpm test

# With coverage
pnpm test:cov

# E2E (requires Docker)
docker compose -f docker-compose.test.yml up -d
pnpm test:e2e --testPathPattern=auth
```

---

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | Yes | — | Signs access tokens |
| `JWT_EXPIRES_IN` | No | `1d` | Access token TTL |
| `JWT_REFRESH_EXPIRES_IN` | No | — | Refresh token TTL in days (`auth.refreshTokenTtlDays`) |
| `GOOGLE_CLIENT_ID` | OAuth | — | Google OAuth app credentials |
| `GOOGLE_CLIENT_SECRET` | OAuth | — | |
| `GITHUB_CLIENT_ID` | OAuth | — | GitHub OAuth app credentials |
| `GITHUB_CLIENT_SECRET` | OAuth | — | |
| `APPLE_CLIENT_ID` | OAuth | — | Apple OAuth app credentials |
| `APPLE_PRIVATE_KEY` | OAuth | — | |

---

## Key dependencies

| Package / class | Used for |
|-----------------|----------|
| `@sisques-labs/nestjs-kit` `BaseAggregate` | `AccountAggregate`, `AuthSessionAggregate` base |
| `@sisques-labs/nestjs-kit` `EnumValueObject` | `AppRoleValueObject` base |
| `@sisques-labs/nestjs-kit` `UuidValueObject` | `_userId` field |
| `@nestjs/cqrs` | `CommandBus`, `QueryBus`, handlers |
| `@nestjs/jwt` | `JwtService` (used by `TokenService`) |
| `@nestjs/passport` | Passport integration |
| `passport-local` | Email/password strategy |
| `passport-jwt` | JWT extraction + validation |
| `bcrypt` | Password hashing + comparison |
