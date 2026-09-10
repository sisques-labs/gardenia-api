# Delta for Auth

Scope: P1/P2 only. Retirement of native login, `TokenService`, `auth_sessions`, password storage, and native OAuth is P3 and explicitly deferred (see `external-identity-delegation`'s deferral note) — none of that is modified or removed here.

## ADDED Requirements

### Requirement: `accounts.external_subject` Column

The `accounts` table MUST include a nullable `external_subject` column holding the platform subject id, with a unique constraint (allowing multiple `NULL`s, one linked subject per account). The column MUST be added via a named migration.

#### Scenario: Column enforces one link per subject
- GIVEN two different accounts
- WHEN both attempt to be linked to the same platform `external_subject`
- THEN the second link MUST fail with a uniqueness violation

#### Scenario: Unlinked accounts remain valid
- GIVEN an account that has never authenticated via the platform
- WHEN its row is read
- THEN `external_subject` MUST be `NULL` without violating any constraint

### Requirement: Linking Does Not Touch Password or Role

Linking an existing account to a platform `external_subject` MUST NOT modify that account's `password_hash` or `appRole`. Linking is additive metadata only.

#### Scenario: Password survives linking
- GIVEN an existing account with a password set
- WHEN it is linked to a platform subject via verified-email match
- THEN `password_hash` MUST remain unchanged and native login MUST continue to work

## MODIFIED Requirements

### Requirement: No Change to JWT Payload

The JWT payload for a **gardenia-issued** token MUST remain `{ sub: userId, email }` (plus the existing `role` claim per `app-rbac`, which is being superseded by that capability's per-request lookup — see `app-rbac`'s delta). `spaceId` MUST NOT be embedded in the JWT. This requirement applies only to gardenia-issued tokens; platform-issued tokens are verified and never re-signed (see `external-identity-delegation`).
(Previously: this requirement did not need to distinguish issuers, since gardenia was the only issuer.)

#### Scenario: Gardenia-issued token unaffected
- GIVEN a native gardenia login
- WHEN the resulting JWT is decoded
- THEN it MUST NOT contain `spaceId`, exactly as before this change

#### Scenario: Platform-issued token is never re-signed by gardenia
- GIVEN a verified platform-issued token
- WHEN the request it authenticates completes
- THEN gardenia MUST NOT produce a new JWT for that request
