# External Identity Delegation Specification

## Purpose

Gardenia accepts Sisques Account (the platform) as an additional, verified identity source alongside its own native login/OAuth. A platform-issued access token is verified per request via JWKS and mapped to a local `AccountAggregate` by a linked `external_subject`. This spec covers **P1 (dual-issuer accept + link) and P2 (tenant mirroring, covered in `space-tenant-mapping`)** only. Native gardenia login, native OAuth, and local session/credential storage remain fully operational and unmodified in this scope.

## Requirements

### Requirement: Platform JWT Verification via JWKS

The system MUST verify any platform-issued access token's signature against the platform's published JWKS endpoint, with cached signing keys, before trusting any claim in that token.

#### Scenario: Valid platform token accepted
- GIVEN a request bears an access token signed by the platform's current JWKS key
- WHEN the token is verified
- THEN the request MUST be authenticated using the token's verified claims

#### Scenario: Invalid signature rejected
- GIVEN a request bears a token that fails JWKS signature verification
- WHEN the token is verified
- THEN the request MUST be rejected with `401 Unauthorized`

### Requirement: Dual-Issuer Acceptance

The system MUST accept both a native gardenia-issued JWT and a verified platform-issued JWT as valid authentication for any endpoint, gated by a phase flag that can disable platform-token acceptance without code changes.

#### Scenario: Native token still works
- GIVEN a valid native gardenia JWT
- WHEN it is presented to a protected endpoint
- THEN the request MUST be authenticated exactly as before this change

#### Scenario: Platform token accepted when flag is on
- GIVEN the phase flag enables platform-token acceptance
- AND a valid, verified platform JWT is presented
- WHEN the request reaches a protected endpoint
- THEN the request MUST be authenticated using the linked local account

### Requirement: Subject Linking by Verified Email

On the first successfully verified platform-token request for a subject with no existing link, the system MUST link that subject to an existing local account by exact match of the platform token's verified email against an existing account's email, using the same auto-link-by-verified-email rule already applied to native OAuth logins. The system MUST NOT import or migrate any password or credential.

#### Scenario: Existing account linked by email
- GIVEN a verified platform token whose email matches an existing unlinked account
- WHEN the first platform-authenticated request from that subject is processed
- THEN the account's `external_subject` MUST be set to the token's subject
- AND subsequent requests from that subject MUST resolve to the same account without re-linking

#### Scenario: Already-linked subject resolves directly
- GIVEN a subject already linked to an account
- WHEN a new platform-authenticated request arrives from that subject
- THEN the system MUST resolve the existing linked account without any additional linking step

### Requirement: Auto-Provisioning New Accounts

When a verified platform token's email matches no existing account, the system MUST auto-provision a new local account and default Space using the same provisioning behavior used for native OAuth logins today, and set `external_subject` on the new account at creation time.

#### Scenario: No matching account triggers provisioning
- GIVEN a verified platform token whose email matches no existing account
- WHEN the request is processed
- THEN a new account MUST be created with `external_subject` set and `appRole = USER`
- AND a default Space MUST be provisioned for the new account exactly as native OAuth provisioning does today

### Requirement: No Local Re-Minting (Full Delegation)

After verifying a platform-issued token, the system MUST NOT sign, mint, or return a gardenia-issued JWT or session for that request. The request MUST be authenticated directly from the verified platform token's claims plus the linked local account, for the lifetime of that token.

(This is a deliberate rejection of a hybrid "verify-then-remint" model: gardenia neither owns nor extends the platform token's session lifetime.)

#### Scenario: Platform-authenticated request issues no gardenia token
- GIVEN a verified platform token used to authenticate a request
- WHEN the request completes
- THEN no gardenia-signed JWT or `auth_sessions` row MUST be created as a result

## Note: P3 Deferred (Out of Scope)

Retiring native gardenia login, `TokenService`, `auth_sessions`, password storage, and native OAuth (`oauth_identities`, `DynamicOAuthGuard`, `OAuthProviderRegistry`) is **P3 — irreversible cutover** and is explicitly deferred to a future change requiring an explicit go/no-go. Nothing in this spec, or in downstream design/tasks/apply for this change, may remove, disable, or force migration off native login/OAuth/local sessions.
