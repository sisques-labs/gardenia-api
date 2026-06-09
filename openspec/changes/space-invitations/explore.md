# Exploration: space-invitations — gardenia-api

> Discovery phase for inviting users to a space via QR + human-readable code. Grounded in codebase inspection and UI mockup ("Comparte tu huerta"). Email invites deferred to phase 2.

---

## Current State

### `spaces` bounded context

| Layer | Status |
|-------|--------|
| Domain | `SpaceAggregate`: `create()`, `addMember(userId, role)`, `removeMember(userId)`. `SpaceMembership` with `MembershipRoleEnum` (`owner` \| `member`). |
| Application | `CreateSpaceCommand`, `AddMemberCommand` (owner-only, **hardcoded `MEMBER`**), `RemoveMemberCommand`, `SpaceFindByIdQuery`, `SpacesFindByUserQuery`. |
| Infrastructure | `spaces` + `space_memberships` tables (`UNIQUE(space_id, user_id)`). |
| Transport | REST `POST/GET /api/spaces`, `POST/DELETE .../members`. GraphQL `spaceCreate`, `spaceAddMember`, `spaceRemoveMember`. |

**Missing for invitations:** no invite aggregate, no code generation, no accept/redeem flow, no email infrastructure.

### `qr` bounded context

| Capability | Status |
|------------|--------|
| `QrAggregate` | `id`, `spaceId`, `targetUrl`, `generation`, `expiresAt`, PNG in `bytea` |
| Create | `CreateQrCommand` via `CommandBus` from other contexts (no public create REST/GraphQL) |
| Read | `GET /api/qrs/:id`, `GET /api/qrs/:id/image` — tenant-scoped (JWT + `X-Space-ID`) |
| Redemption | **None** — QR encodes a URL; frontend resolves the deep link |

**Reference integration:** `PlantQrAdapter` dispatches `CreateQrCommand` with `PlantQrTargetUrlBuilderService` → `{QR_BASE_URL}/plants/{id}?spaceId={spaceId}`.

### Auth / identity

- JWT `sub` = global `userId`.
- `users` and `accounts` are **tenant-scoped** (`space_id`).
- Registration creates a new `userId` + new space per signup; same email across spaces is allowed.
- `@IdentityOnly()` bypasses `SpaceGuard` but requires JWT (used by `auth/me`).

### OpenSpec baseline

`openspec/specs/spaces/spec.md` §11 explicitly lists **invitation flows as out of scope** ("membership is programmatic only at this stage").

---

## UI Requirements (from mockup)

| Panel | Requirement | Phase |
|-------|-------------|-------|
| BY CODE | QR + human-readable code + expiry (e.g. 24h) | **1** |
| BY CODE | "Remaining uses" counter | **Ignored** — expiry only |
| BY EMAIL | Email + role + plot assignment + note | **2** |

Roles in UI: Admin, Hortelana, Miembro, Sólo lectura. **API today:** only `owner` and `member` — map UI roles in frontend or extend enums later.

---

## Gaps

| Requirement | Status |
|-------------|--------|
| Generate invite with configurable role (`member` \| `owner`) | ❌ (confirmed for phase 1) |
| QR with matching `expiresAt` | ⚠️ QR module supports expiry; no invite flow |
| Human-readable code (`LIM · 2026 · K0`) | ❌ |
| Accept by code / QR deep link | ❌ |
| Email delivery | ❌ No mail provider in codebase |
| Revoke / list active invites | ❌ (phase 2) |

---

## Recommended Approach

Introduce **`SpaceInvitation` aggregate** in `spaces` (not inside `QrAggregate` — keeps QR spec clean, no entity refs in `qrs` table).

```text
Owner                          Invitee
  │                               │
  ├─ CreateSpaceInvitation        │
  │    ├─ generate code           │
  │    ├─ SpaceQrPort → CreateQr  │
  │    └─ persist invitation      │
  │                               │
  │    share code / QR ──────────►│ scan or type code
  │                               ├─ login if needed (JWT)
  │                               └─ AcceptSpaceInvitation (@IdentityOnly)
  │                                    ├─ global findByCode
  │                                    ├─ validate expiresAt
  │                                    └─ addMember(role)
```

**Multi-use until expiry (confirmed):** same code can join multiple distinct users until `expiresAt` (matches in-person sharing UX; no use counter).

---

## Integration Options Considered

| Option | Verdict |
|--------|---------|
| A — `SpaceInvitation` aggregate + QR port adapter | **Recommended** |
| B — Extend `QrAggregate` with payload/role/code | Rejected — violates QR spec, mixes concerns |
| C — QR deep link only (no human code) | Rejected — UI requires readable code |
| D — Reuse `AddMemberCommand` with known `userId` | Insufficient — no invite UX |

---

## Architecture Placement

Per `.claude/skills/architecture/SKILL.md`:

- Aggregate: `spaces/domain/aggregates/space-invitation.aggregate.ts`
- Commands: `create-space-invitation/`, `accept-space-invitation/`
- Port: `ISpaceQrPort` + `SpaceQrAdapter` (mirror `PlantQrAdapter`)
- Accept transport: `@IdentityOnly()` — global code lookup via identity-scoped read repo
- Do **not** put invitation logic in `qr/domain`

---

## Risks

1. **Cross-space identity** — accept may need `CreateUserCommand` in target space; `Account` row gap for login-with-`X-Space-ID` TBD.
2. **Duplicate email login** — `findByEmail` without space scope can be ambiguous.
3. **OWNER invitations** — **confirmed:** owner may choose `member` or `owner` when creating the invite.
4. **Code entropy** — suffix must be unguessable; rate limiting at gateway (out of scope).

---

## Next Step

Proposal, design, specs delta, and tasks captured in this change folder. Ready for `sdd-apply` (multi-use and role selection confirmed).
