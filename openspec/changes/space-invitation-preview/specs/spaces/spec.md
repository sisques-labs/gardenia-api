# Spaces Spec Delta: Space Invitation Preview & Structured Errors

**Change**: space-invitation-preview
**Base**: `openspec/specs/spaces/spec.md` (as modified by `space-invitations`)

---

## ADDED Requirements

### Requirement: GetSpaceInvitationPreviewByCode Query

The system MUST expose a public, read-only query that returns a projection of a `SpaceInvitation` by its `code`, without requiring authentication and without mutating any state.

The projection MUST include: `spaceName` (string), `role` (`owner` | `member`), `expiresAt` (timestamp), `isExpired` (boolean).

The projection MUST NOT include: `code`, `qrId`, `createdByUserId`, or any other invitation field not listed above.

#### Scenario: Preview a valid, non-expired invitation

- **GIVEN** a `SpaceInvitation` with a future `expiresAt` for Space S (name "Greenhouse A")
- **WHEN** `GetSpaceInvitationPreviewByCodeQuery` is dispatched with its code, with no `Authorization` header
- **THEN** the response contains `spaceName: "Greenhouse A"`, the invitation's `role`, its `expiresAt`, and `isExpired: false`

#### Scenario: Preview an expired invitation does not throw

- **GIVEN** a `SpaceInvitation` whose `expiresAt` is in the past
- **WHEN** `GetSpaceInvitationPreviewByCodeQuery` is dispatched with its code
- **THEN** the response is returned successfully with `isExpired: true`
- **AND** no exception is raised

#### Scenario: Preview an unknown code

- **GIVEN** no `SpaceInvitation` matches the given code
- **WHEN** `GetSpaceInvitationPreviewByCodeQuery` is dispatched
- **THEN** `InvitationNotFoundException` is raised

---

### Requirement: Invitation Preview Transport APIs

The system MUST expose:

- **Preview:** `GET /api/invitations/:code` (public, `@SkipSpace()`, no `JwtAuthGuard`) and GraphQL query `spaceInvitationPreview(code: String!)`.

Both MUST be reachable without an `Authorization` header and without `X-Space-ID`.

#### Scenario: Preview via REST without credentials

- **GIVEN** a valid, non-expired invitation code
- **WHEN** `GET /api/invitations/:code` is called with no `Authorization` header
- **THEN** HTTP 200 is returned with the preview payload

#### Scenario: Preview via GraphQL without credentials

- **GIVEN** a valid, non-expired invitation code
- **WHEN** the GraphQL query `spaceInvitationPreview(code: "...")` is executed with no `Authorization` header
- **THEN** the preview payload is returned without error

---

### Requirement: GraphQL Domain Exception Error Codes

Every `BaseException` raised through a GraphQL resolver MUST be serialized with `extensions.code` equal to the exception's class name (`exception.name`), matching the discriminator already exposed to REST clients via the `error` response field.

#### Scenario: Expired invitation surfaces a structured GraphQL error

- **GIVEN** an expired `SpaceInvitation`
- **WHEN** the GraphQL mutation `spaceAcceptInvitation` is dispatched with its code
- **THEN** the GraphQL response's `errors[0].extensions.code` equals `"InvitationExpiredException"`

#### Scenario: Not-found invitation surfaces a structured GraphQL error

- **GIVEN** no `SpaceInvitation` matches a given code
- **WHEN** the GraphQL mutation `spaceAcceptInvitation` is dispatched with that code
- **THEN** the GraphQL response's `errors[0].extensions.code` equals `"InvitationNotFoundException"`

#### Scenario: Non-owner create surfaces a structured GraphQL error

- **GIVEN** an authenticated user who is not owner of Space S
- **WHEN** the GraphQL mutation `spaceCreateInvitation` is dispatched for Space S
- **THEN** the GraphQL response's `errors[0].extensions.code` equals `"NotSpaceOwnerException"`

---

## MODIFIED Requirements

_None — `AcceptSpaceInvitationCommand` and `CreateSpaceInvitationCommand` behavior is unchanged; only their GraphQL error serialization gains a structured `extensions.code`._

---

## REMOVED Requirements

_None._
