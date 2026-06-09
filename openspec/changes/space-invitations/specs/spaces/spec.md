# Spaces Spec Delta: Space Invitations (Phase 1)

**Change**: space-invitations  
**Base**: `openspec/specs/spaces/spec.md`

---

## ADDED Requirements

### Requirement: SpaceInvitation Aggregate

The system MUST persist `SpaceInvitation` records with: `id` (UUID), `spaceId` (UUID), `createdByUserId` (UUID), `role` (`owner` | `member`), `code` (normalized unique lookup key), `displayCode` (human-readable formatted string), `qrId` (UUID, nullable until QR creation succeeds), `expiresAt` (timestamp), `createdAt`, `updatedAt`.

The aggregate constructor MUST be hydration-only; `SpaceInvitation.create()` MUST emit `SpaceInvitationCreatedEvent`.

Validity MUST be determined solely by `expiresAt` — the system MUST NOT track remaining uses or max uses.

#### Scenario: Invitation created with future expiry

- **GIVEN** a space owner and a future `expiresAt`
- **WHEN** `CreateSpaceInvitationCommand` completes
- **THEN** a `SpaceInvitation` row is persisted with a unique `code` and linked `qrId`

#### Scenario: Expired invitation rejected on accept

- **GIVEN** a `SpaceInvitation` whose `expiresAt` is in the past
- **WHEN** `AcceptSpaceInvitationCommand` is dispatched with its `code`
- **THEN** `InvitationExpiredException` is raised and no membership is created

---

### Requirement: Human-Readable Invite Code

The system MUST generate invite codes with:

- A **display** form: `{WORD} · {YEAR} · {SUFFIX}` (3-letter word, UTC year, 2–3 alphanumeric suffix).
- A **normalized** `code` stored for lookup (uppercase alphanumeric, no separators).

The normalized `code` MUST be globally unique across all spaces.

#### Scenario: Display and normalized forms differ cosmetically

- **GIVEN** a generated invitation
- **WHEN** the client receives the create response
- **THEN** `displayCode` contains middle-dot separators
- **AND** acceptance accepts the normalized `code` or a case-insensitive normalized form of the display input

---

### Requirement: CreateSpaceInvitation Command

**Given** an authenticated user who is `owner` of Space S  
**When** `CreateSpaceInvitationCommand` is dispatched with `spaceId` = S, optional `role` (default `member`), and optional `expiresAt` (default now + 24 hours)  
**Then** a `SpaceInvitation` is persisted  
**And** a QR is created via `CreateQrCommand` with `targetUrl` encoding the invite deep link, `spaceId` = S, and `expiresAt` matching the invitation  
**And** `SpaceInvitationCreatedEvent` is emitted  
**And** the handler returns invitation metadata including `displayCode`, `qrId`, and `expiresAt`

**Given** the requesting user is not an owner of Space S  
**When** `CreateSpaceInvitationCommand` is dispatched  
**Then** `NotSpaceOwnerException` is raised

#### Scenario: Default expiry is 24 hours

- **GIVEN** no `expiresAt` in the command
- **WHEN** `CreateSpaceInvitationCommand` completes
- **THEN** `expiresAt` is approximately 24 hours after creation time

#### Scenario: Owner selects invite role

- **GIVEN** a space owner creating an invitation
- **WHEN** `CreateSpaceInvitationCommand` is dispatched with `role: owner`
- **THEN** the persisted invitation has `role` = `owner`
- **AND** users who accept before expiry receive `SpaceMembership` with role `owner`

- **GIVEN** no `role` in the create command
- **WHEN** `CreateSpaceInvitationCommand` completes
- **THEN** the invitation `role` defaults to `member`

---

### Requirement: AcceptSpaceInvitation Command

**Given** an authenticated user U and a valid non-expired invitation for Space S with role R  
**When** `AcceptSpaceInvitationCommand` is dispatched with the invitation `code` and `acceptingUserId` = U  
**Then** U receives a `SpaceMembership` on S with role R  
**And** `MemberAddedEvent` is emitted  
**And** if no `users` row exists for U in Space S, the handler MUST provision one via `CreateUserCommand` inside `SpaceContext.run(S, ...)`

**Given** U already holds a `SpaceMembership` for Space S  
**When** `AcceptSpaceInvitationCommand` is dispatched  
**Then** `DuplicateMembershipException` is raised

**Given** no invitation matches the `code`  
**When** `AcceptSpaceInvitationCommand` is dispatched  
**Then** `InvitationNotFoundException` is raised

#### Scenario: Multi-use until expiry

- **GIVEN** a non-expired invitation I
- **WHEN** distinct users U1 and U2 each dispatch `AcceptSpaceInvitationCommand` with I's code
- **THEN** both users become members of the target space (unless already members)

---

### Requirement: Accept Endpoint Identity Scope

The accept invitation REST and GraphQL endpoints MUST be decorated with `@IdentityOnly()`.

The accept endpoints MUST NOT require `X-Space-ID`.

Invitation lookup by `code` MUST use an identity-scoped repository bypassing tenant `SpaceContext` filters.

#### Scenario: Accept without space header

- **GIVEN** a valid JWT and a valid invitation code
- **WHEN** the client calls the accept endpoint without `X-Space-ID`
- **THEN** the request succeeds and membership is created in the invitation's target space

---

### Requirement: Invitation QR Deep Link

The invitation QR `targetUrl` MUST be built from `QR_BASE_URL` and MUST include the invite `displayCode` (or normalized `code`) as a query parameter so the frontend can route to the accept flow.

The QR `expiresAt` MUST match the invitation `expiresAt`.

#### Scenario: QR encodes accept URL

- **GIVEN** `QR_BASE_URL` is configured
- **WHEN** an invitation is created
- **THEN** the linked QR's `targetUrl` starts with `QR_BASE_URL` and includes the invite code parameter

---

### Requirement: Invitation Transport APIs

The system MUST expose:

- **Create:** `POST /api/spaces/:spaceId/invitations` (owner, space context required) and GraphQL mutation `spaceCreateInvitation`.
- **Accept:** `POST /api/invitations/accept` (`@IdentityOnly()`) and GraphQL mutation `spaceAcceptInvitation`.

Create response MUST include at minimum: `id`, `displayCode`, `qrId`, `expiresAt`, `role`.

#### Scenario: Owner creates via REST

- **GIVEN** an authenticated space owner with valid `X-Space-ID`
- **WHEN** `POST /api/spaces/:spaceId/invitations` is called with `{ "role": "member" }`
- **THEN** HTTP 201 is returned with invitation metadata

---

## MODIFIED Requirements

### Requirement: Adding a Member (section 4.1)

**Given** an authenticated owner of Space S  
**When** `AddMemberCommand` is dispatched with a valid `userId`, Space S's `spaceId`, and optional `role` (default `member`)  
**Then** a new `SpaceMembership` with the given role is persisted on Space S  
**And** a `MemberAddedEvent` MUST be emitted  
**And** the added user MUST immediately have access to Space S data via `SpaceGuard`

**Given** the target user already holds a `SpaceMembership` for that Space  
**When** `AddMemberCommand` is dispatched again  
**Then** a domain exception MUST be raised and no duplicate membership is created

#### Scenario: Add member as owner via command

- **GIVEN** an authenticated owner of Space S
- **WHEN** `AddMemberCommand` is dispatched with `role: owner`
- **THEN** the new `SpaceMembership` has role `owner`

---

## REMOVED Requirements

### Requirement: Invitation flows out of scope (section 11)

**Reason**: Phase 1 implements QR/code invitations.  
**Migration**: Use `CreateSpaceInvitationCommand` and `AcceptSpaceInvitationCommand` instead of programmatic-only membership for invite UX.
