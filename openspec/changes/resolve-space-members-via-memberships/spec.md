# Spec: Resolve Space Members via Memberships

**Source change:** resolve-space-members-via-memberships
**Modifies capability:** users

---

## Requirements

### Requirement: Space-Scoped User Queries Resolve via Membership

`userFindById` and `usersFindByCriteria` MUST return a user if and only if a
`space_memberships` row exists for that user in the active space (the space
identified by `X-Space-ID`). The user's own `users.space_id` (home space)
MUST NOT be used to determine inclusion in these results.

#### Scenario: Home-space member is returned

- GIVEN a user whose `users.space_id` equals the active space, with a matching `space_memberships` row in that space
- WHEN `userFindById` is called for that user's id in the active space
- THEN the user is returned

#### Scenario: Invited member is returned regardless of home space

- GIVEN a user whose `users.space_id` points to a different, unrelated space, but who has a `space_memberships` row in the active space
- WHEN `userFindById` is called for that user's id in the active space
- THEN the user is returned

#### Scenario: Non-member is not returned

- GIVEN a user with no `space_memberships` row in the active space (regardless of their `users.space_id`)
- WHEN `userFindById` is called for that user's id in the active space
- THEN `null` is returned

#### Scenario: Listing includes invited members

- GIVEN a space with two members: one whose home space matches it, and one who only holds a `space_memberships` row in it (invited)
- WHEN `usersFindByCriteria` is called in that space
- THEN both members appear in the results

---

### Requirement: findByUsername Resolves via Membership

`findByUsername` (used internally, e.g. for username-availability checks
scoped to a space) MUST apply the same membership-based scoping as
`findById`/`findByCriteria` — it MUST NOT match a user solely because
`users.space_id` equals the active space.

#### Scenario: Username lookup honors membership scoping

- GIVEN a user with a matching username but no `space_memberships` row in the active space
- WHEN `findByUsername` is called with that username in the active space
- THEN `null` is returned

---

### Requirement: Write Path Is Unaffected

`UserTypeOrmWriteRepository` and the `users.space_id` column MUST NOT be
modified by this change. Creating, updating, or deleting a user continues to
operate exactly as before.

#### Scenario: User creation still sets home space_id

- GIVEN a new user is created while the active space is S
- WHEN the user is persisted
- THEN `users.space_id` is set to S, unchanged from prior behavior

---

### Requirement: No New Public API Surface

The GraphQL/REST/MCP shapes of `usersFindByCriteria`, `userFindById`,
`userUpdate`, and `userDelete` MUST NOT change as part of this fix — only
which rows the read queries match changes.

#### Scenario: Response shape unchanged

- GIVEN the `usersFindByCriteria` GraphQL query
- WHEN its selection set is inspected before and after this change
- THEN the available fields on `UserResponseDto` are identical
