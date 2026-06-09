# Proposal: Space Invitations (Phase 1 — QR & Code)

## Why

Space owners need a self-serve way to invite others without manually sharing internal `userId` values. The UI mockup shows QR scan and human-readable codes; email invites are deferred. `spaces` spec §11 explicitly excludes invitation flows — this change adds them using existing `qr` infrastructure and `@IdentityOnly()` accept semantics.

## What Changes

- New **`SpaceInvitation`** aggregate + `space_invitations` table (role, code, `qrId`, `expiresAt`, audit fields).
- **`CreateSpaceInvitationCommand`** — owner-only; role `MEMBER` | `OWNER`; default expiry 24h; generates display code + QR via `CreateQrCommand` port.
- **`AcceptSpaceInvitationCommand`** — `@IdentityOnly()` REST + GraphQL; global lookup by code; adds membership until `expiresAt`.
- **`AddMemberCommand`** — optional `role` param (default `MEMBER`); reuse from accept handler.
- **`SpaceQrPort` + `SpaceQrAdapter`** — spaces → qr cross-context (mirror `PlantQrAdapter`).
- Invite code service — human-readable `WORD · YEAR · XX` display; normalized unique lookup key.
- Transport: create + accept mutations/endpoints; response includes `code`, `displayCode`, `qrId`, `expiresAt`.

**Phase 2 (deferred):** email delivery, plot assignment, revoke/list invitations.

**Not in scope:** max-use counters, anonymous/public accept without JWT, cross-space account linking redesign.

**Confirmed (product):**

- Invitations are **multi-use until `expiresAt`** — the same code/QR may be accepted by multiple distinct users until expiry. No use counter.
- **Role is configurable** at creation: `member` (default) or `owner`. The invitee receives the role chosen by the space owner.

## Capabilities

### New Capabilities

_None — invitations live inside the `spaces` bounded context._

### Modified Capabilities

- `spaces`: invitation create/accept, invite code + QR, `AddMemberCommand` role parameter, remove §11 invitation exclusion.

## Impact

| Area | Impact |
|------|--------|
| `src/contexts/spaces/` | New aggregate, commands, queries, port/adapter, transport, migration |
| `src/contexts/qr/` | Consumed via `CreateQrCommand` only (no qr module changes) |
| `openspec/specs/spaces/spec.md` | Delta merged on archive — invitations in scope |
| APIs | `POST /spaces/:id/invitations`, `POST /invitations/accept` (+ GraphQL parity) |

### Delivery

| PR | Scope | Est. lines |
|----|-------|------------|
| 1 | Domain + migration + persistence + unit tests | ~350–450 |
| 2 | Application commands + QR port + code generator | ~200–280 |
| 3 | REST + GraphQL transport + e2e | ~200–300 |

Chained PRs recommended: **Yes** (400-line budget risk: **High**).

### Rollback plan

1. Revert transport → application → domain PRs in reverse order.
2. Down-migration: drop `space_invitations`; orphaned `qrs` rows from invitations may be deleted manually or left (no FK from `qrs` to invitations if `qr_id` nullable on invitation only).
3. Revert `AddMemberCommand` role param if needed (backward compatible default).

## Success Criteria

- [ ] Owner creates invitation with role + expiry; receives display code and linked QR.
- [ ] Authenticated user accepts via code or QR deep link before `expiresAt` and gains membership with invited role.
- [ ] Expired or unknown codes return domain errors; duplicate membership rejected.
- [ ] `AddMemberCommand` accepts optional role; default unchanged (`MEMBER`).
- [ ] Integration test: invitation persistence + global code lookup; e2e: create → accept flow.
- [ ] E2E: two distinct users accept the same non-expired code and both become members.
- [ ] E2E: invitation created with `role: owner` grants owner membership on accept.

## Open Questions

1. **Cross-space user provisioning:** JWT `userId` is global; `users`/`accounts` rows are per-space. Accept MUST call `CreateUserCommand(userId)` inside target `SpaceContext` — confirm account replication/login semantics for invited space (may need auth follow-up).
2. **QR target URL shape:** propose `{QR_BASE_URL}/invite?code={displayCode}` — confirm with frontend.
