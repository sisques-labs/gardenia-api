# Spec: Users Bounded Context — Multi-Tenancy Delta

**Change**: multitenant
**Phase**: spec
**Date**: 2026-05-29
**Status**: done

---

## 1. Overview

This spec describes only the delta — what MUST change in the `users` bounded context after multi-tenancy is applied. It does not re-specify existing user behavior unless it is modified.

---

## 2. `users` Table Schema

### 2.1 `spaceId` Column

- The `users` table MUST include a `spaceId` UUID column that is NOT NULL.
- `spaceId` MUST match the Space in which the user was created — a user record is always Space-scoped.
- No existing row may omit `spaceId`; the migration MUST apply this constraint on the fresh schema (alpha data discarded, no backfill needed).

### 2.2 Unique Constraint Change

| Before | After |
|--------|-------|
| `UNIQUE (username)` | `UNIQUE (spaceId, username)` |

- The scalar `UNIQUE (username)` constraint MUST be dropped.
- A composite `UNIQUE (spaceId, username)` constraint MUST replace it.
- Two users in different Spaces MAY share the same username without conflict.
- Two users within the same Space MUST NOT share the same username.

**Given** two Spaces each contain a user with the username `alice`  
**When** both records exist in the database simultaneously  
**Then** no uniqueness violation MUST occur

**Given** a Space already contains a user with username `alice`  
**When** a second user in the same Space attempts to register with username `alice`  
**Then** it MUST fail with a conflict error equivalent to the current "username already taken" behavior

---

## 3. Query Scoping

- All user queries MUST be scoped to the active Space from `SpaceContext`.
- This applies to every read operation: `findById`, `findByUsername`, `findAll`, and any future query method.
- Repositories MUST obtain `spaceId` from `SpaceContext.get()` before constructing any query. If `SpaceContext` is empty, the repository MUST throw `SpaceContextMissingException` and MUST NOT execute the query (fail-closed contract, defined in the spaces spec).
- The `User` domain aggregate MUST NOT contain `spaceId` as a domain property — tenant scoping is an infrastructure concern only.

**Given** a request authenticated as user U, with `X-Space-ID: S1`  
**When** a query for users is executed  
**Then** only users belonging to Space S1 MUST be returned, regardless of how many total users exist  
**And** users from Space S2, S3, etc. MUST NOT appear in results

**Given** a request authenticated as user U, with `X-Space-ID: S2` (a Space U is NOT a member of)  
**When** `SpaceGuard` evaluates the request  
**Then** the request MUST be rejected with HTTP 403 before any repository call is made  
**And** no user data from any Space MUST be returned

**Given** a request with no `X-Space-ID` header that reaches a user query  
**When** `BaseTenantRepository` attempts to resolve `SpaceContext`  
**Then** `SpaceContextMissingException` MUST be thrown and no query MUST execute  
(Note: in normal flow this case is prevented by `SpaceGuard`; the repository fail-closed is a defense-in-depth guarantee)

---

## 4. No Other Users Behavior Changes

- User creation, profile update, and deletion logic MUST remain unchanged beyond the addition of `spaceId` scoping in the repository layer.
- The `User` aggregate interface, commands, and queries MUST NOT gain `spaceId` parameters — tenant context is injected by the repository, not passed down from the application layer.
