# Delta for App-RBAC

Scope: applies to any request, regardless of which issuer's token authenticated it (native gardenia JWT or verified platform token). `AppRoleEnum`, `AppRoleValueObject`, `AccountAggregate.appRole`, `AppRoleGuard`, and `@RequireAppRole` are unchanged.

## MODIFIED Requirements

### Requirement: JWT appRole Claim

`TokenService.sign()` MUST include the account's `appRole` value as a claim named `role` in the signed JWT payload. The claim MUST be present in every token issued after this change.

#### Scenario: JWT contains role claim
- GIVEN a valid login for any account
- WHEN `TokenService.sign()` is called
- THEN the resulting JWT payload MUST contain `role` equal to the account's `appRole` string value

(Previously: this was the ONLY source of `appRole` at request time. It now applies only to gardenia-issued tokens; it is superseded as the resolution mechanism by "Per-Request appRole Resolution" below, which applies uniformly to both issuers.)

### Requirement: Per-Request appRole Resolution

`appRole` MUST be resolved per request from the local account projection (looked up by the authenticated user's local account id), not read from any JWT `role` claim, regardless of which issuer authenticated the request. A gardenia-issued token's `role` claim (see "JWT appRole Claim") MUST NOT be trusted as the source of truth at request time; it MAY remain present in the token for backward-compatible clients but MUST be ignored by request-time resolution.

(Previously: `JwtStrategy.validate()` read `payload.role`, defaulting to `USER` when absent. That claim-based resolution is replaced by a per-request account lookup.)

#### Scenario: appRole resolved from account projection for a native token
- GIVEN a valid native gardenia JWT for an account with `appRole = 'admin'`
- WHEN the request is authenticated
- THEN `CurrentUserPayload.appRole` MUST be resolved by looking up the local account
- AND MUST equal `AppRoleEnum.ADMIN` regardless of the token's `role` claim value

#### Scenario: appRole resolved from account projection for a platform token
- GIVEN a verified platform token linked to an account with `appRole = 'user'`
- WHEN the request is authenticated
- THEN `CurrentUserPayload.appRole` MUST be resolved from the linked local account
- AND MUST equal `AppRoleEnum.USER`

#### Scenario: Stale or tampered role claim has no effect
- GIVEN a token whose `role` claim does not match the account's current `appRole` in the local projection
- WHEN the request is authenticated
- THEN `CurrentUserPayload.appRole` MUST reflect the local projection's current value, not the token's claim

### Requirement: CurrentUserPayload appRole Field

`CurrentUserPayload` MUST include `appRole: AppRoleEnum`. The field MUST always be populated after authentication, from the per-request account-projection lookup; it MUST never be `undefined` at runtime.

#### Scenario: Payload includes appRole after validation
- GIVEN a valid, verified token from either issuer
- WHEN the request passes authentication
- THEN `@CurrentUser()` MUST return a payload with `appRole` set to a value from `AppRoleEnum`, resolved from the local account
(Previously: same guarantee, but resolved from the JWT's `role` claim rather than a per-request lookup.)
