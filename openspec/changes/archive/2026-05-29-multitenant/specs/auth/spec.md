# Spec: Auth Bounded Context — Multi-Tenancy Delta

**Change**: multitenant
**Phase**: spec
**Date**: 2026-05-29
**Status**: done

---

## 1. Overview

This spec describes only the delta — what MUST change in the `auth` bounded context after multi-tenancy is applied. It does not re-specify existing auth behavior unless it is modified.

---

## 2. `register-account` Flow

### 2.1 Space Bootstrap on Registration

**Given** a new user submits a valid registration request  
**When** the `RegisterAccountCommand` is processed  
**Then** the following MUST happen atomically, in order:
1. An `Account` is created with a valid `spaceId` referencing the new Space.
2. A `Space` is created with a system-generated default name.
3. A `SpaceMembership` (role: `owner`) is created linking the new user to the new Space.

**And** if any step fails, the entire operation MUST roll back — no partial state is permitted  
**And** the auto-created Space MUST count toward `MAX_SPACES_PER_USER` for the user  
**And** on success, the response MUST include enough information for the client to set `X-Space-ID` on subsequent requests (i.e., the new `spaceId` MUST be returned)

### 2.2 No Change to JWT Payload

- The JWT payload MUST remain `{ sub: userId, email }`.
- `spaceId` MUST NOT be embedded in the JWT.
- The active Space is resolved per-request via the `X-Space-ID` header, not from the token.

### 2.3 Auth Routes Exempt from `SpaceGuard`

- `POST /auth/register` MUST be exempt from `SpaceGuard` (no Space exists yet at registration time).
- `POST /auth/login` MUST be exempt from `SpaceGuard` (authentication precedes Space context).
- These exemptions MUST be explicitly declared in the transport layer (e.g., via a decorator or guard skip marker).

---

## 3. `accounts` Table Schema

### 3.1 `spaceId` Column

- The `accounts` table MUST include a `spaceId` UUID column that is NOT NULL.
- `spaceId` MUST reference the `spaces` table (enforced at application level; DB-level FK is a design decision).
- No existing row may omit `spaceId` — the migration MUST ensure this constraint is applied on the fresh schema (alpha data discarded, no backfill needed).

### 3.2 Unique Constraint Change

| Before | After |
|--------|-------|
| `UNIQUE (email)` | `UNIQUE (spaceId, email)` |

- The scalar `UNIQUE (email)` constraint MUST be dropped.
- A composite `UNIQUE (spaceId, email)` constraint MUST replace it.
- Two accounts in different Spaces MAY share the same email address without conflict.
- Two accounts within the same Space MUST NOT share the same email address.

**Given** two users in different Spaces attempt to register with the same email  
**When** both registrations are processed  
**Then** both MUST succeed without a uniqueness violation

**Given** a user attempts to register with an email already registered in the same Space  
**When** the registration is processed  
**Then** it MUST fail with a conflict error equivalent to the current "email already taken" behavior

---

## 4. `auth_sessions` Table Schema

- The `auth_sessions` table MUST NOT include a `spaceId` column.
- Sessions are user-global: a session identifies a user, not a user-in-a-space.
- `SpaceGuard` resolves Space context from the `X-Space-ID` header on every request; it does not consult the session record for Space information.
- This decision is final and MUST NOT be re-opened without a new proposal.

---

## 5. No Other Auth Behavior Changes

- Password hashing, token signing, refresh logic, and logout MUST remain unchanged.
- `JwtStrategy.validate()` continues to return `{ userId, email }` — the `CurrentUserPayload` interface MUST NOT gain a `spaceId` field.
- `TokenService.sign()` MUST NOT embed `spaceId`.
