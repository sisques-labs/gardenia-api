# Proposal: Space Invitation Preview & Structured Errors

## Why

`space-invitations` (Phase 1) shipped create + accept, but the accept flow is blind: the frontend has no way to show the invitee what they're joining (space name, role) before the accept mutation runs, and no reliable way to render a distinct message for "expired" vs "not found" vs "already a member" — GraphQL callers only get a free-text `message`, since domain exceptions (`BaseException`) are not mapped to `extensions.code` (they currently surface as `INTERNAL_SERVER_ERROR`, confirmed via `test/e2e/plant-species/plant-species-graphql.e2e-spec.ts` and absence of `formatError` in `app.module.ts`). This change is the API half of a cross-repo UX improvement to the invitation acceptance flow (`gardenia-web` counterpart: `space-invite-preview-ux`).

## What Changes

- New **`GetSpaceInvitationPreviewByCode`** query — public (no `JwtAuthGuard`, no `X-Space-ID`), read-only, identity-scoped lookup by code. Returns `{ spaceName, role, expiresAt, isExpired }`. Does NOT mutate state, does NOT require authentication (so the frontend can show invite context *before* forcing login).
- Transport: `GET /invitations/:code` (REST) and GraphQL query `spaceInvitationPreview(code)`.
- **GraphQL error mapping fix**: `BaseExceptionFilter` (`src/core/filters/base-exception.filter.ts`) currently discards the computed `statusCode` for GraphQL (`throw Object.assign(exception, { statusCode: status })`, never read by Apollo). Add `extensions.code = exception.name` (e.g. `"InvitationExpiredException"`) so GraphQL clients get the same discriminator REST clients already get via the `error` field — no free-text message parsing required.

**Not in scope:** revocation/listing of invitations, email notifications, invite code entropy/rate limiting (tracked separately, same audit that produced this proposal). Accept flow behavior (multi-use until expiry, idempotent re-accept) is unchanged.

## Capabilities

### New Capabilities

_None — extends `spaces` bounded context._

### Modified Capabilities

- `spaces`: adds invitation preview query; fixes GraphQL error `extensions.code` for all `BaseException` subclasses globally (not spaces-specific, but this change is what surfaces the gap).

## Impact

| Area | Impact |
|------|--------|
| `src/contexts/spaces/` | New query + handler, view-model reuse, REST controller method, GraphQL resolver method |
| `src/core/filters/base-exception.filter.ts` | GraphQL branch sets `extensions.code`; REST branch unchanged |
| `openspec/specs/spaces/spec.md` | Delta merged on archive — preview capability added |
| APIs | `GET /invitations/:code` (public), GraphQL `spaceInvitationPreview(code)` (public) |

### Delivery

| PR | Scope | Est. lines |
|----|-------|------------|
| 1 | `GetSpaceInvitationPreviewByCode` query + handler + unit tests | ~150–200 |
| 2 | REST + GraphQL transport + `extensions.code` fix + e2e | ~150–220 |

Chained PRs recommended: **No** (both fit under 400-line budget individually; sequential is fine).

### Rollback plan

1. Revert transport PR, then query PR.
2. `extensions.code` fix is additive (existing clients ignore unknown extension fields) — safe to leave or revert independently.

## Success Criteria

- [ ] Unauthenticated client requests a valid, non-expired code → receives `spaceName`, `role`, `expiresAt`, `isExpired: false`.
- [ ] Unauthenticated client requests an expired code → receives the same shape with `isExpired: true` (not an error — preview must not throw on expiry, only accept does).
- [ ] Unauthenticated client requests an unknown code → `InvitationNotFoundException` (404 REST / `extensions.code: "InvitationNotFoundException"` GraphQL).
- [ ] GraphQL accept mutation errors (`InvitationExpiredException`, `InvitationNotFoundException`, `NotSpaceOwnerException`) all carry `extensions.code` matching the exception class name.
- [ ] Existing REST `error` field behavior unchanged (already exposes exception name).

## Open Questions

1. Should `spaceName` for a space the previewer will never join (invitation expired, or they decline) be considered sensitive enough to gate behind rate limiting? Proposing no additional gating for this iteration — same trust level as the existing accept-by-code flow, which is already public-by-code.
