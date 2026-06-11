# App-RBAC Specification

## Purpose

Defines the app-wide identity role model (`ADMIN` / `USER`) and the authorization mechanism (`AppRoleGuard` / `@RequireAppRole`) that enforces it at the transport boundary.

---

## Requirements

### Requirement: AppRoleEnum Values

The system MUST define `AppRoleEnum` with exactly two values: `ADMIN = 'admin'` and `USER = 'user'`. No other values are valid. The enum MUST live in the auth domain at `auth/domain/enums/app-role.enum.ts`.

#### Scenario: Enum defines ADMIN and USER only

- GIVEN the auth domain enum file is loaded
- WHEN `AppRoleEnum` is inspected
- THEN it MUST contain `ADMIN` with value `'admin'` and `USER` with value `'user'`
- AND no other members MUST be present

---

### Requirement: AppRoleValueObject Behavior

`AppRoleValueObject` MUST extend `EnumValueObject<typeof AppRoleEnum>` from `@sisques-labs/nestjs-kit`. It MUST reject any value not present in `AppRoleEnum`.

#### Scenario: Valid role accepted

- GIVEN a string `'admin'` or `'user'`
- WHEN `AppRoleValueObject` is constructed with that string
- THEN the value object MUST be created without error

#### Scenario: Invalid role rejected

- GIVEN a string not in `AppRoleEnum` (e.g. `'superadmin'`)
- WHEN `AppRoleValueObject` is constructed with that string
- THEN it MUST throw a domain validation error

---

### Requirement: AccountAggregate appRole Field

`AccountAggregate` MUST include an `appRole` field of type `AppRoleValueObject`. The field MUST be set at construction time and MUST NOT be mutable after creation (no setter or mutation method). `toPrimitives()` MUST include `appRole` as the string value.

#### Scenario: appRole present in primitives

- GIVEN an `AccountAggregate` instance
- WHEN `toPrimitives()` is called
- THEN the result MUST include `appRole` as a string matching `AppRoleEnum`

---

### Requirement: AccountPrimitives appRole Field

`AccountPrimitives` MUST include `appRole: string`. The field MUST be present in serialized form for persistence and inter-layer transfer.

#### Scenario: Primitives include appRole

- GIVEN a serialized account primitive
- WHEN the `appRole` field is read
- THEN it MUST be a string value from `AppRoleEnum`

---

### Requirement: Default Role for New Accounts

Every newly registered account MUST be assigned `AppRoleEnum.USER` as its `appRole`. No registration flow MAY produce an account with `AppRoleEnum.ADMIN` as the initial role.

#### Scenario: Registration assigns USER role

- GIVEN a valid registration request
- WHEN `RegisterAccountCommand` is processed
- THEN the persisted account MUST have `appRole = 'user'`

---

### Requirement: app_role DB Column

The `accounts` table MUST have an `app_role` column of type `varchar` (or equivalent), `NOT NULL`, with a default value of `'user'`. The column MUST be added via a named migration.

#### Scenario: Column exists and defaults to user

- GIVEN the migration has run
- WHEN a row is inserted into `accounts` without specifying `app_role`
- THEN the column value MUST be `'user'`

---

### Requirement: JWT appRole Claim

`TokenService.sign()` MUST include the account's `appRole` value as a claim named `role` in the signed JWT payload. The claim MUST be present in every token issued after this change.

#### Scenario: JWT contains role claim

- GIVEN a valid login for any account
- WHEN `TokenService.sign()` is called
- THEN the resulting JWT payload MUST contain `role` equal to the account's `appRole` string value

---

### Requirement: JwtStrategy Backward Compatibility

`JwtStrategy.validate()` MUST read `payload.role` to populate `appRole` on the resolved user payload. If `payload.role` is absent (pre-existing tokens), `JwtStrategy.validate()` MUST default to `AppRoleEnum.USER` without throwing.

#### Scenario: Token with role claim resolves correctly

- GIVEN a JWT with `role = 'admin'`
- WHEN `JwtStrategy.validate()` processes the token
- THEN `CurrentUserPayload.appRole` MUST equal `AppRoleEnum.ADMIN`

#### Scenario: Token without role claim defaults to USER

- GIVEN a JWT without a `role` claim (legacy token)
- WHEN `JwtStrategy.validate()` processes the token
- THEN `CurrentUserPayload.appRole` MUST equal `AppRoleEnum.USER`
- AND the request MUST NOT be rejected with an auth error

---

### Requirement: CurrentUserPayload appRole Field

`CurrentUserPayload` MUST include `appRole: AppRoleEnum`. The field MUST always be populated after JWT validation; it MUST never be `undefined` at runtime.

#### Scenario: Payload includes appRole after validation

- GIVEN a valid JWT (with or without role claim)
- WHEN the request passes `JwtAuthGuard`
- THEN `@CurrentUser()` MUST return a payload with `appRole` set to a value from `AppRoleEnum`

---

### Requirement: AppRoleGuard Behavior

`AppRoleGuard` MUST be an opt-in guard applied per-resolver or per-controller method. It MUST NOT be registered as a global `APP_GUARD`.

- If the `@RequireAppRole` metadata is absent on the handler, `AppRoleGuard` MUST allow the request to pass without inspection.
- If the authenticated user's `appRole` is in the required roles list, the guard MUST allow the request.
- If the authenticated user's `appRole` is NOT in the required roles list, the guard MUST throw `ForbiddenException` (HTTP 403 / GraphQL FORBIDDEN).

#### Scenario: Guard allows matching role

- GIVEN a handler decorated with `@RequireAppRole(AppRoleEnum.ADMIN)`
- AND the current user has `appRole = 'admin'`
- WHEN the request reaches `AppRoleGuard`
- THEN the guard MUST pass and the handler MUST execute

#### Scenario: Guard rejects insufficient role

- GIVEN a handler decorated with `@RequireAppRole(AppRoleEnum.ADMIN)`
- AND the current user has `appRole = 'user'`
- WHEN the request reaches `AppRoleGuard`
- THEN the guard MUST throw `ForbiddenException`
- AND the handler MUST NOT execute

#### Scenario: Guard passes when no metadata present

- GIVEN a handler with no `@RequireAppRole` decoration
- WHEN the request reaches `AppRoleGuard`
- THEN the guard MUST allow the request regardless of the user's appRole

---

### Requirement: @RequireAppRole Decorator Contract

`@RequireAppRole(...roles: AppRoleEnum[])` MUST be a custom decorator that sets `Reflector` metadata on the handler. It MUST accept one or more `AppRoleEnum` values. Applying it to a resolver method requires `AppRoleGuard` to be present on that resolver or globally on the module.

#### Scenario: Decorator metadata readable by guard

- GIVEN a handler decorated with `@RequireAppRole(AppRoleEnum.ADMIN, AppRoleEnum.USER)`
- WHEN `AppRoleGuard` reads metadata via `Reflector`
- THEN it MUST receive `[AppRoleEnum.ADMIN, AppRoleEnum.USER]`
