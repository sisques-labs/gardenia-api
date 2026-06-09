# Design: Space Invitations (Phase 1)

> Composes `spaces` + `qr` bounded contexts. Product scope in `proposal.md`; requirements in `specs/spaces/spec.md`.

---

## Context

- **Spaces** has `SpaceMembership` (OWNER/MEMBER), owner-gated `AddMemberCommand` (hardcoded `MEMBER`), no invitation flow.
- **QR** module supports `CreateQrCommand({ targetUrl, spaceId, expiresAt })`, PNG persistence, tenant-scoped reads — no redemption logic.
- **Auth** JWT carries global `userId` (`sub`); `users` and `accounts` are tenant-scoped (`space_id`).
- **Identity bypass:** `@IdentityOnly()` skips `SpaceGuard` but requires JWT (auth spec §5.2). Accept endpoint uses identity-scoped repository for global code lookup (spaces spec §5).

---

## Goals / Non-Goals

**Goals:**

- `SpaceInvitation` aggregate with expiry-only validity (no use counter).
- Owner creates invitation → human-readable code + QR deep link.
- Authenticated invitee accepts by code → membership with configured role.
- Hexagonal QR integration via `ISpaceQrPort` / `SpaceQrAdapter` (CommandBus to `CreateQrCommand`).
- Extend `AddMemberCommand` with optional `role`.

**Non-Goals:**

- Email delivery, plot assignment, list/revoke invitations (phase 2).
- Max-use / remaining-uses tracking.
- Public/anonymous accept without JWT.
- Full cross-space account linking redesign.

---

## Decisions

### ADR-1: `SpaceInvitation` as aggregate in `spaces`

**Decision:** `src/contexts/spaces/domain/aggregates/space-invitation.aggregate.ts` — not a child of `Space`.

**Rationale:** Invitations have independent lifecycle (create, expire, accept) and global code uniqueness. Keeps `Space` aggregate focused on memberships.

**Fields (VOs in aggregate):** `id`, `spaceId`, `createdByUserId`, `role`, `code` (normalized lookup key), `displayCode`, `qrId`, `expiresAt`, `createdAt`, `updatedAt`.

---

### ADR-2: Multi-use until expiry (confirmed)

**Decision:** Same code may be accepted by multiple distinct users until `expiresAt`. No `remainingUses` field.

**Rationale:** Product confirmed multi-use until expiry (in-person sharing UX). Simpler model; no use counter.

**Mitigation:** Owners rotate by creating a new invitation; phase 2 adds revoke.

---

### ADR-3: Invite code format

**Decision:**

- **Display:** `{WORD} · {YEAR} · {SUFFIX}` — e.g. `LIM · 2026 · K0` (3-letter word + current UTC year + 2–3 char Crockford base32).
- **Stored `code`:** normalized uppercase alphanumeric, no separators — e.g. `LIM2026K0`.
- **Uniqueness:** DB `UNIQUE` on `code`; generator retries on collision.

**Service:** `InviteCodeGeneratorService` in `spaces/application/services/write/`.

---

### ADR-4: QR via port + adapter (PlantQr pattern)

**Decision:** `ISpaceQrPort.createInvitationQr({ targetUrl, spaceId, expiresAt }) → qrId` implemented by `SpaceQrAdapter` dispatching `CreateQrCommand`.

**Target URL:** `{QR_BASE_URL}/invite?code={encodeURIComponent(displayCode)}` built by `SpaceInvitationTargetUrlBuilderService`.

```text
CreateSpaceInvitationHandler          QrModule (via bus)
      │                                      │
      ├─ generate code                       │
      ├─ build targetUrl                     │
      ├─ SpaceQrPort.createInvitationQr ──────►│ CreateQrCommand
      │◄──────────── qrId ───────────────────┤
      ├─ save SpaceInvitation                │
      └─ return invitation view model
```

`SpacesModule` does **not** import `QrModule`.

---

### ADR-5: Accept flow + cross-space provisioning

**Decision:** `AcceptSpaceInvitationCommandHandler`:

1. Load invitation by normalized code via **identity-scoped** read repository (no `SpaceContext`).
2. Assert `expiresAt > now`; else `InvitationExpiredException`.
3. `SpaceContext.run(invitation.spaceId, async () => { ... })`:
   - `AssertSpaceExistsService`
   - If no membership for `acceptingUserId` → `CreateUserCommand(acceptingUserId)` (idempotent if row exists)
   - `space.addMember(acceptingUserId, invitation.role)` + save
4. Return `{ spaceId, role }`.

**Open:** `Account` row in target space for login-with-`X-Space-ID` — not created in phase 1 unless product requires; document operational gap.

```text
Client                    AcceptEndpoint (@IdentityOnly)
  │                              │
  │ POST /invitations/accept     │
  │ { code } + Bearer JWT        │
  │─────────────────────────────►│ AcceptSpaceInvitationCommand
  │                              ├─ findByCode (global repo)
  │                              ├─ validate expiry
  │                              └─ SpaceContext.run(targetSpaceId)
  │                                   ├─ CreateUserCommand?
  │                                   └─ addMember + save
  │◄─────────────────────────────│ { spaceId, role }
```

---

### ADR-6: Extend `AddMemberCommand` role

**Decision:** Add optional `role?: MembershipRoleEnum` to input; default `MEMBER`. Handler passes to `space.addMember(userId, role)`.

**Rationale:** `SpaceAggregate.addMember` already accepts role; accept handler can reuse command or call aggregate directly — prefer **internal service** `AddSpaceMemberService` to avoid owner-check duplication, OR dispatch `AddMemberCommand` with system bypass — **use dedicated accept path** calling `space.addMember` directly after owner check is N/A.

---

### ADR-7: Transport

| Operation | Guard | Bus |
|-----------|-------|-----|
| `POST /spaces/:id/invitations` | JWT + space context (owner) | `CreateSpaceInvitationCommand` |
| `POST /invitations/accept` | JWT + `@IdentityOnly()` | `AcceptSpaceInvitationCommand` |
| GraphQL `spaceCreateInvitation`, `spaceAcceptInvitation` | Same | Same |

Create response: `id`, `displayCode`, `code` (optional), `qrId`, `expiresAt`, `role`. Enrich with QR metadata via port query if needed in read model.

---

## File structure (new/modified)

```
src/contexts/spaces/
├── domain/
│   ├── aggregates/space-invitation.aggregate.ts
│   ├── builders/space-invitation.builder.ts
│   ├── events/space-invitation-created/
│   ├── exceptions/invitation-not-found|expired/
│   ├── repositories/read/space-invitation-read.repository.ts  (+ global findByCode)
│   └── value-objects/invitation-code/
├── application/
│   ├── commands/create-space-invitation/
│   ├── commands/accept-space-invitation/
│   ├── ports/space-qr.port.ts
│   └── services/write/invite-code-generator.service.ts
├── infrastructure/
│   ├── adapters/space-qr.adapter.ts
│   └── persistence/typeorm/entities/space-invitation.entity.ts
└── transport/
    ├── rest/... (invitations controller or extend spaces)
    └── graphql/... (mutations)
```

**Migration:** `space_invitations` — `id`, `space_id`, `created_by_user_id`, `role`, `code` (unique), `display_code`, `qr_id`, `expires_at`, timestamps.

---

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Cross-space `users`/`accounts` gap after accept | `CreateUserCommand` in target space; document account gap; auth follow-up |
| QR create fails after invitation row | Transaction: save invitation only after `qrId` returned, or compensating delete |
| OWNER invite creates multiple owners | **Confirmed:** role is owner-selectable (`member` \| `owner`); `Space` invariant already allows multiple owner memberships |
| Code collision | Retry generator + unique index |
| Global code lookup security | Codes are unguessable (suffix entropy); rate-limit at gateway (out of scope) |

---

## Migration Plan

1. Deploy migration `space_invitations`.
2. Deploy application + transport.
3. Rollback: drop table; revert handlers; default `AddMemberCommand` behavior unchanged.

---

## Open Questions

See `proposal.md` §Open Questions — especially cross-space account provisioning and QR URL shape (frontend alignment).
