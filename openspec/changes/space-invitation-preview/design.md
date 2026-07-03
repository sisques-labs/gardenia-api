# Design: Space Invitation Preview & Structured Errors

> Extends `spaces` bounded context (invitations, added in `space-invitations`). Product scope in `proposal.md`; requirements in `specs/spaces/spec.md`.

---

## Context

- `SpaceInvitation` lookup by code is already identity-scoped (bypasses tenant `SpaceContext` filters) — reused as-is for preview (`AssertSpaceInvitationViewModelExistsByCodeService`).
- `SpaceGuard` (global `APP_GUARD`) returns `true` immediately when either `@SkipSpace()` or `@IdentityOnly()` metadata is present — **neither requires `req.user` to exist** on its own. `req.user` is only enforced when a controller/resolver additionally applies `@UseGuards(JwtAuthGuard)` (as `InvitationsController.acceptInvitation` does). This means `@SkipSpace()` without `JwtAuthGuard` is already a fully public route — no new guard/decorator needed.
- `SpaceContext.run(spaceId, fn)` (used by `ResolveInvitationSpaceContextService` and inside `AcceptSpaceInvitationCommandHandler`) is the established pattern for entering a target space's tenant context from an identity-scoped starting point (invitation code) — reused to fetch `SpaceViewModel.name`.
- `BaseExceptionFilter` (`src/core/filters/base-exception.filter.ts`) computes `status` for every `BaseException` via chained `resolveXxxExceptionStatus()` functions, but for GraphQL it only does `throw Object.assign(exception, { statusCode: status })` — Apollo's default formatter never reads that `statusCode`, so it serializes as `extensions.code: "INTERNAL_SERVER_ERROR"` for every domain exception. REST already exposes a de facto stable discriminator: `error` = `exception.name`.

---

## Goals / Non-Goals

**Goals:**

- Public, read-only, non-mutating preview of an invitation by code (space name, role, expiry state).
- Reliable, transport-symmetric error discrimination: GraphQL callers get the same `exception.name` discriminator REST callers already get.

**Non-Goals:**

- Revocation, listing, rate limiting (separate changes).
- Changing accept behavior (idempotency, multi-use-until-expiry) — untouched.
- A formal error-code taxonomy (`INVITATION_EXPIRED` style enum) — reusing `exception.name` is the minimal fix; a symbolic enum can be a later refinement if the frontend needs it.

---

## Decisions

### ADR-1: Preview as a new query, not a field on the existing invitation view model

**Decision:** `GetSpaceInvitationPreviewByCodeQuery` in `spaces/application/queries/get-space-invitation-preview-by-code/`, separate from any internal invitation view model.

**Rationale:** The internal `SpaceInvitationViewModel` (`code`, `qrId`, `createdByUserId`, ...) is an implementation detail of accept/create; the public preview response is a deliberately narrow projection (`spaceName`, `role`, `expiresAt`, `isExpired`) that must never leak `code`/`qrId`/`createdByUserId` to an unauthenticated caller.

**Response shape:**
```ts
interface SpaceInvitationPreview {
  spaceName: string;
  role: MembershipRoleEnum;
  expiresAt: Date;
  isExpired: boolean;
}
```

---

### ADR-2: Fully public transport — `@SkipSpace()`, no `JwtAuthGuard`

**Decision:** REST `GET /invitations/:code` and GraphQL `spaceInvitationPreview(code: String!)` apply `@SkipSpace()` only. No `@UseGuards(JwtAuthGuard)`.

**Rationale:** The frontend needs invite context (space name, role) available *before* the login redirect, so the login screen itself can say "You're joining {spaceName}". Requiring auth here would defeat that purpose. This is a strictly weaker exposure than accept: read-only, no state change, same code-guessability profile as the already-public accept-by-code flow (`space-invitations` proposal already accepted "codes are unguessable" as the mitigation for that surface — see its `Risks` table).

**Does not throw on expiry:** unlike `AcceptSpaceInvitationCommand`, preview MUST NOT throw `InvitationExpiredException` — it returns `isExpired: true` so the frontend can render "this invite has expired, ask the owner for a new one" instead of a generic error page. It DOES throw `InvitationNotFoundException` for unknown codes (nothing meaningful to preview).

---

### ADR-3: Query handler flow

```text
GetSpaceInvitationPreviewByCodeHandler
  │
  ├─ AssertSpaceInvitationViewModelExistsByCodeService.execute(code)   (existing, identity-scoped)
  │     → throws InvitationNotFoundException if absent
  │
  ├─ isExpired = invitation.expiresAt <= now   (inline check, no throw — reuses
  │     the same comparison as AssertSpaceInvitationNotExpiredService without its throwing behavior)
  │
  └─ SpaceContext.run(invitation.spaceId, () => spaceReadRepository.findById(invitation.spaceId))
        → SpaceViewModel.name
```

Reuses `ResolveInvitationSpaceContextService`-equivalent pattern (entering `SpaceContext` from the identity-scoped invitation) but only for a read, not wrapping a full command.

---

### ADR-4: GraphQL `extensions.code` fix

**Decision:** In `BaseExceptionFilter.catch()`, the GraphQL branch constructs a `GraphQLError` with `extensions: { code: exception.name, statusCode: status }` instead of relaunching the raw exception via `Object.assign`.

**Rationale:** Minimal, symmetric with REST's existing `error` field (`exception.name`), no new taxonomy to maintain, no risk of drifting REST/GraphQL discriminators apart. Frontend can `switch` on `extensions.code` (GraphQL) / `error` (REST) using the exact same string set.

**Scope of blast radius:** This filter is global (`app.useGlobalFilters(new BaseExceptionFilter())`), so the fix applies to every `BaseException` across every context, not just `spaces` — flagged in `Impact` in `proposal.md`. No behavioral change for REST; additive for GraphQL (unknown-extension-field-tolerant clients are unaffected).

---

## File structure (new/modified)

```
src/contexts/spaces/
├── application/
│   └── queries/get-space-invitation-preview-by-code/
│       ├── get-space-invitation-preview-by-code.query.ts
│       ├── get-space-invitation-preview-by-code.handler.ts
│       └── get-space-invitation-preview-by-code.handler.spec.ts
├── domain/
│   └── view-models/space-invitation-preview.view-model.ts   (or plain interface — no persistence, read projection only)
└── transport/
    ├── rest/
    │   ├── controllers/invitations.controller.ts   (+ GET :code)
    │   └── dtos/space-invitation-preview-response.dto.ts
    └── graphql/
        ├── resolvers/space/space-queries.resolver.ts   (+ spaceInvitationPreview)
        └── dtos/space-invitation-preview-response.dto.ts

src/core/filters/base-exception.filter.ts   (GraphQL branch: extensions.code)
```

---

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Public endpoint reveals space name to anyone with a code | Same trust boundary as existing public accept-by-code; no new secret exposed (name is the only new field, no PII) |
| Global `extensions.code` change affects other contexts' GraphQL error consumers | Additive-only (extensions is designed for exactly this); no existing test asserts on the previous `INTERNAL_SERVER_ERROR` fallback for domain exceptions (verified — no e2e coverage found) |
| Preview endpoint becomes an unthrottled probe for code guessing | Out of scope for this change (rate limiting tracked separately); no worse than existing accept endpoint |

---

## Migration Plan

1. Deploy query + transport (additive, no migration).
2. Deploy `extensions.code` filter fix.
3. Rollback: revert both PRs independently — no schema/data impact.

---

## Open Questions

See `proposal.md` §Open Questions.
