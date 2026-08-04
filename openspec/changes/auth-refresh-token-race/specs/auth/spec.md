# Spec: Auth Bounded Context — Refresh Token Reuse Grace Window Delta

**Change**: auth-refresh-token-race

---

## 1. Overview

This spec describes only the delta to refresh-token rotation behavior. It
does not re-specify existing auth behavior except where explicitly modified.

## 2. Session Persistence

### 2.1 `replacedBySessionId`

- `auth_sessions` MUST gain a nullable `replacedBySessionId` (uuid, FK to
  `auth_sessions.id`).
- `replacedBySessionId` MUST be set to the id of the newly created session
  **only** when a session is revoked as part of the normal rotation flow.
- `replacedBySessionId` MUST remain `null` when a session is revoked via
  explicit logout or via `revokeAllByUserId` (theft response / grace-window
  exhaustion).

## 3. Refresh Rotation — Grace Window

### 3.1 Config

- A new config value `auth.refreshReuseGraceMs` (env `REFRESH_REUSE_GRACE_MS`)
  MUST control the grace window length, in milliseconds. Default: `10000`.
- Setting it to `0` MUST fully restore today's behavior (no grace window).

### 3.2 Benign one-hop race is tolerated

**Given** a refresh token `T1` was rotated into session `S2` (i.e. `S1` is
revoked, `S1.replacedBySessionId = S2.id`, `S2` is unrevoked)
**When** a second request presents `T1` again, within `refreshReuseGraceMs`
of `S1.revokedAt`
**Then** the request MUST succeed, receiving a new valid access/refresh token
pair rotated from `S2` (not from `S1`)
**And** `S2` MUST itself be revoked and replaced by a new session `S3` (same
rotation semantics as the normal path)
**And** no session belonging to the user MUST be revoked as a side effect
beyond the normal one-hop rotation
**And** `RefreshTokenReuseDetectedException` MUST NOT be raised

### 3.3 Second replay is still reuse

**Given** the situation in 3.2 has already occurred once (i.e. `T1` was
already forgiven once and rotated `S2` into `S3`)
**When** `T1` is presented a third time
**Then** the request MUST fail
**And** `RefreshTokenReuseDetectedException` MUST be raised
**And** all of the user's sessions MUST be revoked via `revokeAllByUserId`

*(Mechanism: by the third presentation, `S1.replacedBySessionId` still points
at `S2`, but `S2` is now itself revoked — `S2.revokedAt !== null` — so the
"successor is currently valid" condition in 3.2 no longer holds.)*

### 3.4 Grace window does not apply after expiry

**Given** the situation in 3.2, but the second request arrives **after**
`refreshReuseGraceMs` has elapsed since `S1.revokedAt`
**Then** the request MUST fail with `RefreshTokenReuseDetectedException`
**And** all of the user's sessions MUST be revoked, identical to today's
behavior

### 3.5 Reuse of a session revoked for reasons other than rotation is unaffected

**Given** a session was revoked via explicit logout, or as part of a prior
`revokeAllByUserId` call (`replacedBySessionId IS NULL`)
**When** its (now-invalidated) refresh token is presented again, at any time
**Then** the request MUST fail with `RefreshTokenReuseDetectedException` (if a
session record still exists to match against) or `InvalidRefreshTokenException`
(if no matching non-expired record exists)
**And** the grace-window path in 3.2 MUST NOT apply — it is gated on
`replacedBySessionId IS NOT NULL`

## 4. Observability

- The handler MUST log (at `warn` or higher, structured) every time the
  grace-window path (3.2) is taken, including `userId`, the revoked session
  id, the successor session id, and elapsed milliseconds since revocation.
