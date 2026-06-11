# Proposal: App-Level RBAC (ADMIN / USER)

**Change**: app-rbac
**Phase**: proposal
**Date**: 2026-06-11
**Artifact store**: openspec

---

## Intent

The platform has space-scoped roles (`MembershipRoleEnum { OWNER, MEMBER }`) but no app-wide identity role. There is no way to distinguish a platform ADMIN from a regular USER, so admin-only operations (e.g. managing plant species, moderation, future internal tooling) cannot be authorized. We need a global identity role decided at the account level, enforced at the transport boundary.

Success means: every account carries an app role, the role travels in the JWT, and any resolver/controller can require `ADMIN` declaratively without a per-request DB hit.

## Scope

### In Scope
- `AppRoleEnum { ADMIN = 'admin', USER = 'user' }` in the auth domain.
- `appRole` on `AccountAggregate` + `AccountPrimitives`, modeled as an `EnumValueObject`.
- DB migration: `app_role` column on `accounts` (NOT NULL, default `'user'`).
- `appRole` claim in the JWT (`TokenService.sign`), extracted in `JwtStrategy.validate`.
- `appRole` exposed on `CurrentUserPayload`.
- `AppRoleGuard` + `@RequireAppRole(...roles)` decorator, applied per-resolver (NOT global).
- New account registration defaults to `USER`.

### Out of Scope
- Space-level roles (untouched — different concern).
- Role-management UI/admin endpoints to mutate a user's app role (future change).
- Fine-grained permissions / multi-role / role tables.
- Immediate role revocation beyond existing `logoutAll`.
- Seeding/promoting the first ADMIN (handled operationally, separate task).

## Capabilities

### New Capabilities
- `app-rbac`: app-wide identity role model (`ADMIN`/`USER`), JWT propagation, and the `AppRoleGuard` + `@RequireAppRole` authorization mechanism.

### Modified Capabilities
- `auth`: account now carries `appRole`; JWT payload and `JwtStrategy.validate` gain the role claim; registration assigns the default role.

## Approach

Adopt exploration Approach 1 — role on the **identity aggregate**, propagated via the JWT (stateless authorization):

1. Account is the identity aggregate → role is an identity concern, kept inside the auth context (users context stays profile-only).
2. Role is signed into the JWT at login → guards stay stateless, mirroring the existing `OptionalJwtAuthGuard` → `SpaceGuard` chain. No DB lookup per request.
3. `JwtStrategy.validate` reads `payload.role ?? AppRoleEnum.USER` for backward compatibility with already-issued tokens.
4. `AppRoleGuard` is opt-in per-resolver via `@RequireAppRole(AppRoleEnum.ADMIN)`, not an `APP_GUARD` — default behavior is unchanged for all current endpoints.
5. `AppRoleValueObject` reuses the kit `EnumValueObject` pattern (same as `MembershipRoleValueObject`).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `auth/domain/enums/app-role.enum.ts` | New | Role enum |
| `auth/domain/value-objects/app-role/` | New | `AppRoleValueObject` |
| `auth/domain/aggregates/account.aggregate.ts` | Modified | Add `appRole` |
| `auth/domain/primitives/account.primitives.ts` | Modified | Add `appRole` |
| `auth/application/services/token.service.ts` | Modified | Sign role claim |
| `auth/infrastructure/strategies/jwt.strategy.ts` | Modified | Extract role (default USER) |
| `auth/infrastructure/decorators/current-user.decorator.ts` | Modified | Expose `appRole` |
| `auth/infrastructure/guards/app-role.guard.ts` | New | Role enforcement |
| `shared/decorators/require-app-role.decorator.ts` | New | `@RequireAppRole` |
| Account TypeORM entity + migration | New/Modified | `app_role` column |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Stale role in JWT after change (~15min) | Med | Rare admin op; existing `logoutAll` forces refresh |
| Pre-existing tokens lack role claim | Med | `payload.role ?? AppRoleEnum.USER` default |
| Account TypeORM entity path unconfirmed | Low | Verify exact entity/migration path during apply |
| Enum source confusion (kit vs local) | Low | `AppRoleEnum` is domain-specific → keep local |

## Rollback Plan

Guard is opt-in, so reverting carries no behavioral risk to existing endpoints. Revert the code commits and run the down migration (`DROP COLUMN app_role`). JWTs with a stray `role` claim are ignored by the prior `validate` signature — no token invalidation needed.

## Dependencies

- `@sisques-labs/nestjs-kit` `EnumValueObject` (already used).

## Delivery Strategy

Single PR. Estimated change is small and cohesive (one bounded context, ~10 files, one migration), comfortably under the 400-line review budget. No chained PRs needed.

## Success Criteria

- [ ] Every account persists an `app_role`; new accounts default to `USER`.
- [ ] JWT carries the role claim; `CurrentUserPayload.appRole` is populated.
- [ ] `@RequireAppRole(AppRoleEnum.ADMIN)` rejects non-admins (403) and allows admins.
- [ ] Pre-existing tokens (no claim) resolve to `USER` without error.
- [ ] Existing non-annotated endpoints behave exactly as before.
