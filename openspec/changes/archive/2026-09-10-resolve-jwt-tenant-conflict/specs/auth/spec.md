# Delta for Auth

## MODIFIED Requirements

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
