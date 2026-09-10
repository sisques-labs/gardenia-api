# Auth Specification

## Purpose

Defines the `auth` bounded context: account registration and Space bootstrap, JWT payload shape and app-level RBAC, auth route exemptions from `SpaceGuard`, the `accounts`/`auth_sessions` table schemas, and identity-scoped endpoints that operate on the authenticated user rather than a specific Space.

---

## Requirements

### Requirement: Space Bootstrap on Registration

When an account is registered, a Space MUST be created and linked to it atomically, in order, with no partial state permitted on failure.

#### Scenario: Registration creates account, Space, and membership atomically

- GIVEN a new user submits a valid registration request
- WHEN the `RegisterAccountCommand` is processed
- THEN an `Account` is created with a valid `spaceId` referencing the new Space
- AND a `Space` is created with a system-generated default name
- AND a `SpaceMembership` (role: `owner`) is created linking the new user to the new Space
- AND if any step fails, the entire operation MUST roll back — no partial state is permitted
- AND the auto-created Space MUST count toward `MAX_SPACES_PER_USER` for the user
- AND on success, the response MUST include the new `spaceId` so the client can set `X-Space-ID` on subsequent requests

---

### Requirement: No Change to JWT Payload

The JWT payload gardenia issues via `TokenService.sign()` MUST remain `{ sub: userId, email }` (plus any already-approved claims such as `role`); it MUST NOT embed `spaceId` or any other current-tenant selector. No claim inside ANY JWT, regardless of issuer, MUST ever act as or substitute for the current-tenant selector; a JWT MAY carry a list of tenant/space memberships as identity-only metadata, never as a current-tenant selector. The active Space MUST continue to be resolved per-request only via the `X-Space-ID` header plus a database membership lookup, per the `tenant-resolution-policy` spec.
(Previously: JWT payload MUST remain `{ sub: userId, email }`; `spaceId` MUST NOT be embedded in the JWT; active Space resolved via `X-Space-ID` header, not the token — silent on other issuers or claim shapes.)

#### Scenario: Gardenia's own token stays selector-free

- GIVEN a call to `TokenService.sign()`
- WHEN the resulting JWT is decoded
- THEN the payload MUST NOT contain `spaceId` or any other current-tenant field

#### Scenario: External or membership-list claim never becomes the current tenant

- GIVEN a JWT (any issuer) contains a `spaceId`, `tenantId`, or membership-list claim, with or without an `X-Space-ID` header
- WHEN `SpaceGuard` resolves the current Space for the request
- THEN the claim MUST be ignored
- AND a missing header MUST cause rejection rather than falling back to the claim

---

### Requirement: Auth Routes Exempt from SpaceGuard

`POST /auth/register` and `POST /auth/login` MUST be exempt from `SpaceGuard`, declared explicitly in the transport layer.

#### Scenario: Register and login bypass SpaceGuard

- GIVEN a request to `POST /auth/register` or `POST /auth/login` with no `X-Space-ID` header
- WHEN the request is processed
- THEN `SpaceGuard` MUST NOT reject the request
- AND the exemption MUST be declared explicitly in the transport layer (e.g. a decorator or guard-skip marker)

---

### Requirement: accounts Table Has a Required spaceId Column

The `accounts` table MUST include a `spaceId` UUID column that is NOT NULL and references the `spaces` table.

#### Scenario: No account row may omit spaceId

- GIVEN the `accounts` table schema
- WHEN a row is inspected
- THEN `spaceId` MUST be present and NOT NULL
- AND MUST reference the `spaces` table (enforced at application level)

---

### Requirement: accounts Uniqueness Is Scoped by Space

The scalar `UNIQUE (email)` constraint on `accounts` MUST be replaced by a composite `UNIQUE (spaceId, email)` constraint.

#### Scenario: Same email allowed across different Spaces

- GIVEN two users in different Spaces attempt to register with the same email
- WHEN both registrations are processed
- THEN both MUST succeed without a uniqueness violation

#### Scenario: Same email rejected within the same Space

- GIVEN a user attempts to register with an email already registered in the same Space
- WHEN the registration is processed
- THEN it MUST fail with a conflict error equivalent to the "email already taken" behavior

---

### Requirement: auth_sessions Table Has No spaceId Column

The `auth_sessions` table MUST NOT include a `spaceId` column; sessions remain user-global. `SpaceGuard` MUST continue to resolve Space context from the `X-Space-ID` header plus a database membership lookup on every request, never from the session record or any JWT claim. This finality clause governs gardenia's own session schema and resolution mechanism; it does not itself authorize a future, separately-scoped integration to derive the current tenant from a token claim — any such integration MUST instead comply with the `tenant-resolution-policy` spec.
(Previously: `auth_sessions` MUST NOT include a `spaceId` column; `SpaceGuard` resolves Space from the `X-Space-ID` header; "this decision is final and MUST NOT be re-opened without a new proposal" — silent on scope relative to externally-issued tokens.)

#### Scenario: Session table remains schema-unchanged

- GIVEN the `auth_sessions` table
- WHEN its schema is inspected
- THEN it MUST NOT contain a `spaceId` column

#### Scenario: Future external-identity integration must still comply

- GIVEN a future change proposes accepting an externally-issued token
- WHEN that change is scoped
- THEN it MUST NOT store a tenant claim in `auth_sessions`
- AND it MUST NOT use any token claim as the current-tenant selector
### Requirement: Identity-Scoped Auth Endpoints Skip SpaceGuard's Header Check

Endpoints that operate on the authenticated user's identity rather than a specific Space (`GET /auth/me`, `DELETE /auth/account`, `PATCH /auth/password`, `POST /auth/logout-all`) MUST be decorated with `@IdentityOnly()` and MUST NOT require an `X-Space-ID` header, while still requiring a valid JWT.

#### Scenario: Identity-scoped endpoint succeeds without X-Space-ID

- GIVEN an authenticated user calls `GET /auth/me` without an `X-Space-ID` header
- WHEN the request is processed
- THEN the response status MUST be `200` with the account data
- AND `SpaceGuard` MUST NOT reject the request

#### Scenario: Identity-scoped endpoint still requires a valid JWT

- GIVEN a request with no or invalid JWT calls `GET /auth/me`
- WHEN the request is processed
- THEN the response status MUST be `401 Unauthorized`

#### Scenario: IdentityOnly is distinct from SkipSpace

- GIVEN an endpoint decorated with `@IdentityOnly()`
- WHEN a request reaches it without a JWT
- THEN it MUST still be rejected, because `@IdentityOnly()` MUST NOT suppress JWT validation
- AND `@IdentityOnly()` MUST NOT be confused with `@SkipSpace()`, which skips both `SpaceGuard` and JWT validation (used for `register`, `login`, `refresh`)

---

### Requirement: Tenant Isolation Bypass in Auth/User Repositories

Because identity-scoped endpoints run without ALS Space context, UUID-based repository operations on `accounts` and `users` MUST bypass the tenant proxy, since UUID uniqueness guarantees the correct row regardless of Space. `save()` on all repositories MUST continue to use the tenant proxy.

#### Scenario: ID-based lookups bypass the tenant proxy

- GIVEN `AccountTypeOrmReadRepository.findById` / `findByCriteria`, `AccountTypeOrmWriteRepository.delete`, or `UserTypeOrmWriteRepository.findById` / `delete` is called
- WHEN the operation executes
- THEN it MUST use the raw (non-proxied) repository, not the tenant-scoped proxy

#### Scenario: save() always uses the tenant proxy

- GIVEN any repository's `save()` method is called for an account or user
- WHEN the operation executes
- THEN it MUST use the tenant proxy, since Space context is required when creating accounts and users

---

### Requirement: TokenService Includes appRole in JWT

`TokenService.sign()` MUST embed the account's `appRole` as a `role` claim in every JWT it signs, as the string representation of `AppRoleEnum`.

#### Scenario: Signed JWT carries role claim

- GIVEN a call to `TokenService.sign()` with an account that has `appRole = 'user'`
- WHEN the resulting token is decoded
- THEN the payload MUST contain `role: 'user'`

#### Scenario: Admin account produces admin claim

- GIVEN a call to `TokenService.sign()` with an account that has `appRole = 'admin'`
- WHEN the resulting token is decoded
- THEN the payload MUST contain `role: 'admin'`

---

### Requirement: JwtStrategy Exposes appRole on CurrentUserPayload

`JwtStrategy.validate()` MUST include `appRole` in the object it returns, taken from `payload.role` when present and defaulting to `AppRoleEnum.USER` when absent.

#### Scenario: Valid token with role claim populates appRole

- GIVEN a JWT with `role = 'admin'` in the payload
- WHEN `JwtStrategy.validate()` processes it
- THEN the returned payload MUST have `appRole = AppRoleEnum.ADMIN`

#### Scenario: Legacy token without role claim defaults to USER

- GIVEN a JWT missing the `role` claim
- WHEN `JwtStrategy.validate()` processes it
- THEN the returned payload MUST have `appRole = AppRoleEnum.USER`
- AND the validation MUST NOT throw or reject the token

---

### Requirement: JWT Payload Structure Includes sub, email, and role

The JWT payload MUST contain `sub: userId`, `email`, and `role`. It MUST NOT contain `spaceId`.

#### Scenario: JWT retains sub and email alongside role

- GIVEN a valid login
- WHEN `TokenService.sign()` is called
- THEN the JWT payload MUST contain `sub` (userId), `email`, and `role`
- AND MUST NOT contain `spaceId`

---

### Requirement: CurrentUserPayload Always Populates appRole

`CurrentUserPayload` MUST expose `userId: string`, `email: string`, and `appRole: AppRoleEnum`, with `appRole` always populated and never optional or undefined.

#### Scenario: Payload has all three fields

- GIVEN a request with a valid JWT
- WHEN `@CurrentUser()` is resolved in a handler
- THEN the payload MUST have `userId`, `email`, and `appRole` all populated

---

### Requirement: No Other Auth Behavior Changes

Password hashing, token signing/refresh logic (aside from the `appRole` claim), and logout MUST remain unchanged. `TokenService.sign()` MUST NOT embed `spaceId`. Existing identity-scoped endpoints do not require any RBAC changes at the endpoint level.

#### Scenario: Core auth mechanics are unaffected

- GIVEN the auth bounded context after the `appRole` and multi-tenancy changes
- WHEN password hashing, refresh, or logout are exercised
- THEN their behavior MUST match the pre-existing implementation, unaffected by those changes
