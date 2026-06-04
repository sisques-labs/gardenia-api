# Delta Spec: auth — auth-improvement

**Change**: auth-improvement
**Phase**: spec
**Date**: 2026-06-04
**Status**: done

---

## Change

This delta corrects four concrete bugs in the existing `auth` bounded context: a silent no-op in `logoutAll`, missing cookie-clear attributes, a race condition in refresh-token rotation, and direct `process.env` reads for auth configuration. No new domain concepts are introduced; all changes are confined to existing command handlers, repository methods, the cookie helper, and config wiring.

---

## Requirements

### REQ-AUTH-001: logoutAll MUST revoke all sessions

`logoutAll` MUST call `revokeAllByUserId(userId)` directly on the write repository. It MUST NOT traverse a `findByCriteria` stub path that silently returns 0 revocations.

If no sessions exist for the authenticated user, `logoutAll` MUST still succeed (200 / no-content) — a user with no active sessions revoking all sessions is a valid idempotent operation. The prior behavior (silent no-op due to the stub) is the bug; the fix is the direct repository call, not adding an error for zero sessions.

**Scenarios:**

- Given an authenticated user with two active sessions  
  When they call `POST /auth/logout-all`  
  Then both sessions MUST be revoked  
  And the response MUST be 200/204

- Given an authenticated user with no active sessions  
  When they call `POST /auth/logout-all`  
  Then the response MUST be 200/204 (idempotent success)  
  And no error MUST be thrown

- Given a user calls `POST /auth/logout-all` after the previous call already revoked all sessions  
  When the second call is processed  
  Then the response MUST still be 200/204 (idempotency maintained)

---

### REQ-AUTH-002: Cookie clear MUST include full attributes

When the refresh cookie is cleared (on logout, logout-all, or rotation failure), the `Set-Cookie` header MUST include all of the following attributes, with values matching what was used when the cookie was originally set:

| Attribute | Required Value |
|-----------|---------------|
| `httpOnly` | `true` |
| `secure` | `true` (production) / configurable |
| `sameSite` | `strict` |
| `path` | `/` (or the path used on set) |
| `expires` / `maxAge` | Past date / `0` to force expiry |

Omitting any of these attributes causes browsers to treat the clear as a different cookie and leave the original intact.

**Scenarios:**

- Given a valid refresh cookie is present in the request  
  When the user calls `POST /auth/logout`  
  Then the response `Set-Cookie` header MUST include `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/`  
  And `Max-Age=0` or an expiry date in the past MUST be present

- Given a refresh token rotation fails  
  When the rotation error handler clears the cookie  
  Then the `Set-Cookie` header MUST include the same full set of attributes as above

- Given the cookie was set with `Path=/auth`  
  When the cookie is cleared  
  Then the clear MUST also use `Path=/auth` (path mismatch would leave the cookie alive)

---

### REQ-AUTH-003: Refresh token rotation MUST be atomic under concurrency

Refresh token rotation MUST acquire a pessimistic write lock on the session row before reading the current token. Only the first concurrent request that acquires the lock MUST succeed with a new token pair. All subsequent concurrent requests using the same (now-consumed) token MUST receive 401 Unauthorized.

This prevents two simultaneous rotation requests with the same token from both succeeding and issuing two valid token pairs from a single use.

**Scenarios:**

- Given a valid refresh token T1 exists for a session  
  When two concurrent requests both send T1 to `POST /auth/refresh`  
  Then exactly one request MUST return 200 with a new token pair  
  And the other request MUST return 401  
  And the session record MUST contain only one new token (no split-brain state)

- Given a valid refresh token T1 exists  
  When a single sequential request sends T1 to `POST /auth/refresh`  
  Then the response MUST be 200 with a new token pair T2  
  And T1 MUST be invalidated (subsequent use of T1 returns 401)

- Given a rotation is in progress under a pessimistic lock  
  When a second request attempts to acquire the lock on the same row  
  Then the second request MUST wait until the lock is released, then fail validation (token already rotated)  
  And no deadlock or timeout error MUST surface to the client (clean 401)

---

### REQ-AUTH-004: Auth configuration MUST be sourced via ConfigService

`REFRESH_TOKEN_TTL_DAYS` and `REFRESH_COOKIE_NAME` MUST be read from `ConfigService`, not from `process.env` directly. No direct `process.env` access is permitted in any auth handler, service, or helper.

**Scenarios:**

- Given `REFRESH_TOKEN_TTL_DAYS=7` is set in the environment  
  When a refresh token is issued  
  Then the token expiry MUST equal `now + 7 days` (sourced via ConfigService, not a hardcoded default)

- Given `REFRESH_COOKIE_NAME=gardenia_refresh` is set in the environment  
  When the refresh cookie is set or cleared  
  Then the cookie name MUST match `gardenia_refresh` exactly  
  And no fallback to a hardcoded string is permitted if the env var is missing (ConfigService throws on missing required keys)

---

## Non-Goals

- This delta does NOT change the JWT payload structure.
- This delta does NOT add new auth endpoints.
- This delta does NOT change password hashing, login, or registration flows.
- `SpaceGuard` exemptions and `@IdentityOnly()` behavior established in the multitenant spec remain unchanged.
