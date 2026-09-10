# Space-Tenant Mapping Specification

## Purpose

Each gardenia Space corresponds 1:1 to a platform tenant (`app_id = gardenia`). Gardenia adopts the platform tenant UUID as `space.id`. The platform becomes the **write** authority for layer-1 membership; gardenia keeps a local membership **projection** that remains the sole **read** authority `SpaceGuard` consults, per the binding `tenant-resolution-policy`. This spec covers P2 only.

## Requirements

### Requirement: Space Id Adopts Platform Tenant Id

For every Space backed by a platform-linked account, `space.id` MUST equal the corresponding platform tenant's UUID. No separate Space↔tenant mapping table MUST be introduced.

#### Scenario: New Space created via platform provisioning
- GIVEN a platform-linked account with no existing gardenia Space
- WHEN a Space is provisioned for that account
- THEN the created Space's `id` MUST equal the platform tenant id returned by tenant provisioning

#### Scenario: Existing Space backfilled
- GIVEN an existing gardenia Space predating this change
- WHEN the backfill migration runs
- THEN the Space MUST be associated with exactly one newly-created platform tenant (`app_id = gardenia`), with a one-time id reconciliation if the platform does not accept the existing Space UUID as the tenant id

### Requirement: Platform Write Authority for Membership

Adding or removing a Space membership for a platform-linked Space MUST be performed by calling the platform's tenant-membership API. Gardenia's own membership command handlers MUST NOT write membership rows directly for platform-linked Spaces; they MUST delegate the write to the platform and update the local projection only from the platform's confirmed result.

#### Scenario: Adding a member calls the platform
- GIVEN an owner of a platform-linked Space adds a member
- WHEN the add-member command is processed
- THEN the system MUST call the platform's membership API before the local projection is updated
- AND the local projection MUST reflect the platform's confirmed membership, not a locally-invented one

### Requirement: Local Membership Projection Remains the Read Authority

`SpaceGuard` MUST continue to resolve membership exclusively from the local database projection, never from a platform API call or a JWT claim, on every request. This mechanism is unchanged from the pre-existing `SpaceGuard` contract.

#### Scenario: SpaceGuard reads the local projection
- GIVEN a request with a valid `X-Space-ID` header for a platform-linked Space
- WHEN `SpaceGuard` evaluates membership
- THEN it MUST query the local membership projection table
- AND MUST NOT call any platform API or inspect any JWT claim to make that decision

### Requirement: Membership Projection Sync Mechanism

The system MUST synchronize the local membership projection via an on-demand, per-tenant, token-relayed refresh — never by writing projection rows from a JWT's `tenants` claim.

**Finding (documented, not invented):** account-api's published API surface exposes no membership-list, membership-query, or webhook/event-feed endpoint — only `POST /tenants` (create), a direct member-add operation, and `GET /v1/tenants/{tenantId}/members` (requires `VIEW_TENANT`, granted to all three platform roles, with no `platformAdmin` bypass). A claim-driven refresh (upserting projection rows from the token's `tenants[]` claim) was considered and REJECTED: it launders an unverified-by-gardenia claim through the database, which is the same "claim as hint + DB verification" shape the binding `tenant-resolution-policy` already rejects, and would let a minted claim silently widen a user's reach. The chosen mechanism instead relays the CALLER'S OWN raw bearer token (read from the `Authorization` header, never from a decoded claim) to `GET /v1/tenants/{tenantId}/members`, and reconciles that tenant's rows from the platform's response — including deletions. This sync fires on-demand (immediately before `SpaceGuard`, only when the local row is missing or stale past a TTL), not on every login.

#### Scenario: Sync refreshes the projection from the platform, token-relayed
- GIVEN a platform-linked request whose local membership row for `(userId, X-Space-ID)` is missing or older than the sync TTL
- WHEN the sync mechanism fires
- THEN it MUST relay the caller's own raw bearer token to `GET /v1/tenants/{tenantId}/members`
- AND MUST NOT construct or infer membership from the token's `tenants` claim

#### Scenario: Platform confirms membership
- GIVEN the platform responds `200` and the caller is present in the returned member list
- WHEN the projection is reconciled
- THEN the local row MUST be upserted and its `synced_at` MUST be updated

#### Scenario: Platform denies membership — immediate local revocation
- GIVEN the platform responds `403` (the caller is no longer a member)
- WHEN the projection is reconciled
- THEN the caller's local membership row MUST be deleted
- AND the next `SpaceGuard` check MUST deny access immediately, without waiting for any login event

#### Scenario: Platform unreachable — fail-closed unless a fresh-enough row already exists
- GIVEN the platform sync call times out or returns `5xx`
- WHEN a local row already exists for that user/Space
- THEN the existing row MUST be left untouched and access MUST be allowed, bounded by TTL staleness
- GIVEN the platform sync call times out or returns `5xx` and no local row exists
- WHEN `SpaceGuard` evaluates the request
- THEN access MUST be denied (`403`) — the system MUST fail closed, never open, on sync failure

#### Scenario: Claim never selects a current tenant, even during sync
- GIVEN a platform token carrying a `tenants` claim
- WHEN the membership projection is synced or evaluated in any way
- THEN the claim MUST NOT be used to write projection rows directly, nor to determine or override the request's current Space (see `tenant-resolution-policy` compliance below)

### Requirement: Fail-Closed Consistency

If the local membership projection has no row for a requested Space/user pair, the system MUST deny access (`403`), never fall back to platform-inferred or claim-inferred membership.

#### Scenario: Stale or missing projection denies access
- GIVEN a user's platform membership was revoked but the local projection has not yet synced
- WHEN the user requests a platform-linked Space via `X-Space-ID`
- THEN `SpaceGuard` MUST reject with `403 Forbidden` once the projection is stale, and MUST NOT grant access based on the token alone

### Requirement: Tenant-Resolution-Policy Compliance Restated

This capability MUST comply with the binding `tenant-resolution-policy` spec unchanged: the current Space is resolved ONLY from `X-Space-ID` plus the local membership lookup; a token's `tenants` claim, from either issuer, MUST NOT select, satisfy, or override the current Space in any phase.

#### Scenario: Missing header rejected even with a single-tenant token
- GIVEN a platform token whose `tenants` claim lists exactly one tenant
- AND the request has no `X-Space-ID` header
- WHEN the request is processed
- THEN it MUST be rejected with `400 Bad Request`, never defaulted to that one tenant

## Note: P3 Deferred (Out of Scope)

Irreversible cutover of gardenia's tenant/membership write path (removing any local fallback) is P3 and out of scope for this spec; see `external-identity-delegation`'s deferral note.
