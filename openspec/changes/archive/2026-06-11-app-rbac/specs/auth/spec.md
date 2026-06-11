# Delta for Auth

## ADDED Requirements

### Requirement: TokenService Includes appRole in JWT

`TokenService.sign()` MUST embed the account's `appRole` as a `role` claim in every JWT it signs. The claim value MUST be the string representation of `AppRoleEnum` (e.g. `'admin'` or `'user'`).

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

`JwtStrategy.validate()` MUST include `appRole` in the object it returns. The value MUST be taken from `payload.role` when present, defaulting to `AppRoleEnum.USER` when absent.

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

## MODIFIED Requirements

### Requirement: No Change to Existing JWT Sub and Email Claims

The JWT payload MUST continue to contain `sub: userId` and `email`. The addition of the `role` claim MUST NOT alter or remove these fields. `spaceId` MUST NOT be embedded in the JWT.
(Previously: JWT payload MUST remain `{ sub: userId, email }` — no other claims. Now also carries `role`.)

#### Scenario: JWT retains sub and email

- GIVEN a valid login
- WHEN `TokenService.sign()` is called
- THEN the JWT payload MUST contain `sub` (userId), `email`, and `role`
- AND MUST NOT contain `spaceId`

---

### Requirement: CurrentUserPayload Interface

`CurrentUserPayload` MUST expose `userId: string`, `email: string`, and `appRole: AppRoleEnum`. The `appRole` field MUST always be populated; it MUST NOT be optional or undefined.
(Previously: `CurrentUserPayload` only contained `userId` and `email`.)

#### Scenario: Payload has all three fields

- GIVEN a request with a valid JWT
- WHEN `@CurrentUser()` is resolved in a handler
- THEN the payload MUST have `userId`, `email`, and `appRole` all populated
