# Delta for Spaces

Scope: P2 only, and only for platform-linked Spaces (Spaces belonging to an account with a linked `external_subject`). Spaces belonging to accounts that have never authenticated via the platform are unaffected by this delta.

## MODIFIED Requirements

### Requirement: Adding a Member

**Given** an authenticated owner of Space S
**When** `AddMemberCommand` is dispatched with a valid `userId` and Space S's `spaceId`
**Then** a new `SpaceMembership` (role: `member`) is persisted on Space S
**And** a `MemberAddedEvent` MUST be emitted
**And** the added user MUST immediately have access to Space S data via `SpaceGuard`

**Given** the target user already holds a `SpaceMembership` for that Space
**When** `AddMemberCommand` is dispatched again
**Then** a domain exception MUST be raised and no duplicate membership is created

**Given** Space S is platform-linked (its `id` equals a platform tenant id)
**When** `AddMemberCommand` is dispatched for Space S
**Then** the system MUST call the platform's tenant-membership API to add the member BEFORE persisting the local `SpaceMembership` row
**And** the persisted `SpaceMembership` MUST reflect the platform's confirmed result, not a locally-invented one
**And** if the platform call fails, no local `SpaceMembership` MUST be persisted
(Previously: `SpaceMembership` rows were written directly with no external authority; this requirement now splits by whether the Space is platform-linked.)

#### Scenario: Adding a member to a platform-linked Space
- GIVEN an authenticated owner of a platform-linked Space S
- WHEN `AddMemberCommand` is dispatched with a valid target `userId`
- THEN the platform's membership-add API MUST be called first
- AND the local `SpaceMembership` MUST be persisted only after the platform confirms

#### Scenario: Adding a member to a non-platform-linked Space is unaffected
- GIVEN an authenticated owner of a Space that is not platform-linked
- WHEN `AddMemberCommand` is dispatched
- THEN the local `SpaceMembership` MUST be persisted directly, exactly as before this change

### Requirement: Removing a Member

**Given** an authenticated owner of Space S
**When** `RemoveMemberCommand` is dispatched with a valid `userId` that holds a `member` role
**Then** the `SpaceMembership` is removed
**And** a `MemberRemovedEvent` MUST be emitted
**And** the removed user MUST NOT be able to access Space S data after removal

**Given** the target user holds the only `owner` membership of Space S
**When** `RemoveMemberCommand` is dispatched for that user
**Then** a `LastOwnerRemovalException` domain exception MUST be raised and no membership is removed

**Given** Space S is platform-linked
**When** `RemoveMemberCommand` is dispatched for Space S
**Then** the system MUST call the platform's tenant-membership API to remove the member BEFORE removing the local `SpaceMembership` row
**And** if the platform call fails, the local `SpaceMembership` MUST NOT be removed
(Previously: membership removal was a purely local write; this requirement now splits by whether the Space is platform-linked.)

#### Scenario: Removing a member from a platform-linked Space
- GIVEN an authenticated owner of a platform-linked Space S
- WHEN `RemoveMemberCommand` is dispatched for a `member`-role user
- THEN the platform's membership-remove API MUST be called first
- AND the local `SpaceMembership` MUST be removed only after the platform confirms

## Note

`SpaceGuard`'s read-side membership lookup (spaces spec §5–§7) is unchanged: it continues to query the local database projection exclusively, per the binding `tenant-resolution-policy`. See `space-tenant-mapping` for the full read/write split contract and the projection sync mechanism. P3 (removing any non-platform-linked code path) is out of scope for this spec.
