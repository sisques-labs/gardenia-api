# Delta Spec: oauth — auth-improvement

**Change**: auth-improvement
**Phase**: spec
**Date**: 2026-06-04
**Status**: done

---

## Change

This delta introduces the `oauth` capability — social login via Google, GitHub, and Apple using discrete self-hosted Passport strategy adapters. It defines OAuth identity persistence, account linking rules, session issuance after OAuth login, and all error cases. The existing `auth` domain model gains only additive fields (`OAuthIdentity`); no existing auth aggregate behavior is rewritten.

---

## Requirements

### REQ-OAUTH-001: OAuth login flow MUST redirect through provider and return a session

A user navigating to an OAuth login endpoint MUST be redirected to the provider's authorization page. After successful authorization at the provider, the callback MUST issue the same session format as local login: an access JWT in the response body and a refresh token in an httpOnly cookie.

Supported providers: `google`, `github`, `apple`.

**Scenarios:**

- Given a user navigates to `GET /auth/oauth/:provider` where provider is `google`  
  When the request is processed  
  Then the response MUST be a 302 redirect to Google's authorization URL  
  And the redirect MUST include a `state` parameter (CSRF token) bound to the session

- Given Google redirects the user to `GET /auth/oauth/google/callback?code=AUTH_CODE&state=STATE`  
  When the callback is processed  
  Then the system MUST exchange the code for provider tokens  
  And MUST create or link a local account (see REQ-OAUTH-002)  
  And MUST issue an access JWT and set the refresh cookie (same format as local login)  
  And MUST redirect or respond with 200 containing the access token

- Given GitHub redirects the user to `GET /auth/oauth/github/callback`  
  When the callback is processed  
  Then the same session issuance flow MUST apply as for Google

- Given Apple redirects the user to `POST /auth/oauth/apple/callback` (Apple uses POST)  
  When the callback is processed  
  Then the same session issuance flow MUST apply  
  And the handler MUST accept a POST body (Apple Sign In sends form-encoded data)

---

### REQ-OAUTH-002: Account linking MUST key on provider-verified email

When an OAuth callback is processed the system MUST:

1. Check if an `oauth_identity` record already exists for `(provider, provider_user_id)`. If yes → retrieve the linked local account and issue a session (existing user, returning OAuth login).
2. If no existing `oauth_identity` exists, check if a local account exists with the same email AND the provider has marked the email as verified. If yes → link the new `oauth_identity` to that account (merge flow).
3. If no local account matches, create a new account and `oauth_identity` together.

Linking via unverified provider email is explicitly forbidden. If the provider returns an email that is not marked verified, the system MUST reject the login with a descriptive error.

**Scenarios:**

- Given user@example.com already has a local account  
  And the user signs in with Google providing verified email user@example.com  
  When the callback is processed  
  Then a new `oauth_identity` record MUST be created linking Google's identity to the existing account  
  And the user MUST receive a valid session for their existing account  
  And a duplicate account MUST NOT be created

- Given user@example.com already has a local account  
  And the user signs in with Google providing unverified email user@example.com  
  When the callback is processed  
  Then the login MUST be rejected with 400 or 403  
  And an error MUST indicate the provider email is not verified  
  And no session MUST be issued

- Given a completely new email with no existing local account  
  When the OAuth callback is processed with that email  
  Then a new account AND a new `oauth_identity` MUST be created atomically  
  And the user MUST receive a valid session

- Given user@example.com already has a local account linked to Google  
  When the same user signs in with Google again  
  Then the existing account MUST be found via the `oauth_identity` lookup  
  And no duplicate account or duplicate `oauth_identity` MUST be created  
  And the user MUST receive a valid session

---

### REQ-OAUTH-003: OAuth identity model — `oauth_identities` table

The system MUST persist OAuth identities in an `oauth_identities` table with the following schema:

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `user_id` | UUID | FK → accounts.id, NOT NULL |
| `provider` | ENUM (`google`, `github`, `apple`) | NOT NULL |
| `provider_user_id` | VARCHAR | NOT NULL |
| `email` | VARCHAR | NOT NULL |
| `access_token` | VARCHAR | NOT NULL, encrypted at rest |
| `refresh_token` | VARCHAR | nullable, encrypted at rest |
| `created_at` | TIMESTAMP | NOT NULL |
| `updated_at` | TIMESTAMP | NOT NULL |

MUST have a unique constraint on `(provider, provider_user_id)` — one provider identity maps to exactly one local account.

MUST have an index on `(user_id)` for reverse lookup (all OAuth identities for a user).

`access_token` and `refresh_token` MUST be encrypted at rest (application-level encryption; the raw token MUST NOT be stored in plaintext).

**Scenarios:**

- Given a user has signed in with Google  
  When the `oauth_identities` table is queried  
  Then a row MUST exist with `provider = 'google'` and the correct `provider_user_id` and `user_id`  
  And `access_token` column value MUST NOT equal the raw token received from Google

- Given an attempt to insert a second row with the same `(provider, provider_user_id)`  
  When the insert is executed  
  Then it MUST fail with a unique constraint violation  
  And no duplicate identity record MUST exist

---

### REQ-OAUTH-004: Same provider identity MUST NOT link to two different local accounts

A `(provider, provider_user_id)` pair MUST be associated with at most one local account. If a request would create a second association for the same pair (e.g., a user attempts to link a Google account already linked to another local account), the operation MUST be rejected with a conflict error.

**Scenarios:**

- Given provider_user_id=G123 is already linked to account A  
  When account B attempts to link provider_user_id=G123  
  Then the operation MUST return 409 Conflict  
  And account A's link MUST remain intact  
  And account B MUST receive no OAuth identity record for that provider

---

### REQ-OAUTH-005: Session issuance after OAuth login MUST match local login format

After a successful OAuth login (new account, existing account match, or returning OAuth user), the system MUST issue:

- An access JWT (same signing key, same payload shape `{ sub: userId, email }`, same TTL as local login).
- A refresh token stored in an httpOnly cookie (same attributes as local login: httpOnly, secure, sameSite=strict, path=/).

The OAuth flow MUST NOT invent a different session format or skip the refresh token.

**Scenarios:**

- Given a successful OAuth callback for a new user  
  When the session is issued  
  Then the response MUST include a signed access JWT with `{ sub: userId, email }` payload  
  And the response MUST set the refresh cookie with httpOnly, secure, sameSite=Strict, Path=/  
  And the TTL of the access JWT MUST equal the configured access token TTL  
  And the refresh cookie MUST expire according to `REFRESH_TOKEN_TTL_DAYS`

- Given the issued access JWT is decoded  
  When the payload is inspected  
  Then it MUST contain `sub` (userId) and `email`  
  And it MUST NOT contain provider tokens, provider_user_id, or any OAuth-specific claims

---

### REQ-OAUTH-006: OAuth error scenarios MUST produce descriptive, safe responses

**Scenarios:**

- Given the provider returns an error (e.g., user denied access, `?error=access_denied`)  
  When the callback is processed  
  Then the system MUST return 400 Bad Request or redirect to a client error page  
  And no session MUST be issued  
  And the error MUST NOT expose internal stack traces or raw provider error details

- Given the `state` parameter in the callback does not match the stored CSRF token  
  When the callback is processed  
  Then the system MUST return 400 Bad Request  
  And no session MUST be issued  
  And the incident SHOULD be logged as a potential CSRF attempt

- Given the provider callback omits required fields (e.g., no `code`, no email)  
  When the callback is processed  
  Then the system MUST return 400 Bad Request  
  And the response body MUST include a machine-readable error code (e.g., `OAUTH_MISSING_CODE`, `OAUTH_EMAIL_MISSING`)

- Given the provider returns an email that is not marked as verified  
  When the callback is processed  
  Then the system MUST return 403 Forbidden  
  And the response MUST include error code `OAUTH_EMAIL_UNVERIFIED`  
  And no account linking or creation MUST occur

---

## Non-Goals

- OAuth token refresh (using the provider refresh token to re-obtain a new provider access token) is deferred — current scope stores the token but does not implement background refresh.
- Unlinking an OAuth identity from a local account is out of scope for this change.
- OAuth-only accounts (no local password) are supported by this spec, but password reset for such accounts is explicitly out of scope (SMTP not yet provisioned).
- MFA / 2FA is out of scope.
- "List linked providers" endpoint is out of scope.

---

## Hexagonal Boundary Rules

- Passport strategies MUST live in `infrastructure/strategies/oauth/` as adapters implementing the `OAuthProviderStrategy` port.
- New application command handlers (`LoginWithOAuthCommand`, `LinkOAuthIdentityCommand`) MUST live in `application/commands/oauth/` and use `CommandBus` only.
- The `OAuthIdentity` value object and domain fields MUST live in `domain/`.
- Transport (REST callback routes) MUST contain no business logic — delegate entirely to command handlers.
- No SaaS dependency or external OAuth management service is permitted.
