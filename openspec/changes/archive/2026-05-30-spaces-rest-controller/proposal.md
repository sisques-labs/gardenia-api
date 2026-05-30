# Proposal: Spaces REST Controller

## Intent

`SpacesModule` ships 5 fully-implemented use cases (3 commands, 2 queries) but exposes zero HTTP endpoints. Frontend integration is blocked: there is no way to create a space, list a user's spaces, fetch one, or manage members over REST. This change adds the missing transport layer and fixes two pre-existing application-layer defects that surface once the endpoints are live.

## Scope

### In Scope

- REST controller exposing 5 endpoints (POST /spaces, GET /spaces/me, GET /spaces/:id, POST /spaces/:id/members, DELETE /spaces/:id/members/:userId).
- Request DTOs (`create-space.dto`, `add-member.dto`) and response DTO (`space-rest-response.dto`) with validation + Swagger.
- REST mapper `SpaceViewModel` → `SpaceRestResponseDto`.
- Register `SpacesController` in `SpacesModule`.
- **Bug fix 1**: `SpacesFindByUserQuery` filters by `ownerId` only; members can't see their spaces in GET /spaces/me. Fix to filter by membership (owner OR member).
- **Bug fix 2**: `AddMemberCommand` / `RemoveMemberCommand` handlers lack owner-only authorization at the application layer. Add owner check before executing.

### Out of Scope

- Update space (rename) and delete space lifecycle.
- GraphQL resolver changes for spaces.
- Invitation flows, billing/quotas, cross-space admin bypass.

## Capabilities

### New Capabilities
- None — REST endpoints surface behavior already covered by the `spaces` spec (sections 3–6).

### Modified Capabilities
- `spaces`: Two requirement clarifications. (1) Section 4.3 "Non-Owner Attempt" — the owner-only authorization MUST be enforced in the `AddMember`/`RemoveMember` command handlers (currently unenforced). (2) Add a requirement that a user lists spaces where they hold ANY `SpaceMembership` (owner or member), not only owned spaces, via `SpacesFindByUserQuery`.

## Approach

Transport-only additions plus two handler fixes, following the established `auth.controller.ts` pattern:
- Controller dispatches via `CommandBus`/`QueryBus` only — no direct service injection.
- `@CurrentUser()` supplies the authenticated user; `JwtAuthGuard` on all routes.
- `@SkipSpace()` on POST /spaces and GET /spaces/me (no space context yet); global `SpaceGuard` covers `:id`-scoped routes.
- DTOs use class-validator + `@nestjs/swagger` decorators; mapper isolates view-model → response shaping.
- Bug fixes live in the application layer (query handler + 2 command handlers), keeping authorization decisions out of transport.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/contexts/spaces/transport/rest/controllers/spaces.controller.ts` | New | 5 endpoints |
| `src/contexts/spaces/transport/rest/dtos/*.dto.ts` | New | 2 request + 1 response DTO |
| `src/contexts/spaces/transport/rest/mappers/space/space.mapper.ts` | New | view-model → response |
| `src/contexts/spaces/spaces.module.ts` | Modified | add `controllers: [SpacesController]` + mapper provider |
| `spaces-find-by-user` query handler | Modified | filter by membership, not ownerId |
| `add-member` / `remove-member` handlers | Modified | enforce owner-only authorization |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Changing `SpacesFindByUserQuery` filter alters existing GraphQL/consumer results | Med | Existing behavior was a bug (members excluded); cover new filter with handler unit tests + e2e |
| Owner-check added to handlers breaks existing callers that relied on missing enforcement | Low | Section 4.3 already mandates this; verify no internal caller bypasses ownership |
| `@SkipSpace()` misapplied — leaking space-scoped routes or over-skipping | Med | Mirror auth controller usage; e2e assert 400/403 from `SpaceGuard` on `:id` routes |

## Rollback Plan

Revert the change branch. New files are additive; the only behavioral reverts are the two handler fixes (query filter + owner check), which restore prior behavior. No DB migrations, so no schema rollback needed.

## Dependencies

- None new. `SpacesModule` is already registered in `AppModule`; `JwtAuthGuard`, `SpaceGuard`, `@SkipSpace()`, `@CurrentUser()` already exist.

## Success Criteria

- [ ] All 5 endpoints reachable, guarded as specified, documented in Swagger.
- [ ] GET /spaces/me returns spaces where the user is owner OR member.
- [ ] Non-owner AddMember/RemoveMember requests rejected with an authorization error.
- [ ] Unit + e2e tests green; coverage ≥ 80%.
