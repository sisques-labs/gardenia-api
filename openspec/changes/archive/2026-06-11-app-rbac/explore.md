# Exploration: app-rbac

## Current State

**Auth model — what exists today:**

- `AccountAggregate`: id, userId, email, passwordHash. **No role field.**
- `TokenService.sign(userId, email)`: embeds only `{ sub: userId, email }` in JWT. **No role claim.**
- `JwtStrategy.validate(payload)`: returns `{ userId, email }`. **No role.**
- `CurrentUserPayload`: `{ userId: string; email: string }`. **No role.**
- Global guards: `OptionalJwtAuthGuard` → `SpaceGuard` via `APP_GUARD`. No role guard.

**User model:**

- `UserAggregate` fields: id, status, username, firstName, lastName, avatarUrl, bio, locale, timezone. **No role.**
- `UserStatusEnum { ACTIVE, INACTIVE, BLOCKED }` — separate from role.

**Space-level roles (NOT app-level, but good reference pattern):**

- `MembershipRoleEnum { OWNER, MEMBER }` in `spaces` context.
- `SpaceMembership` carries role per `(userId, spaceId)` — scoped, not global.
- Pattern used: `EnumValueObject<typeof EnumType>` via `@sisques-labs/nestjs-kit`.

**Transport:** GraphQL (Apollo, code-first) primary + REST. Guards branch on `context.getType<string>() === 'graphql'`.

---

## Gaps

- No app-level role concept exists anywhere
- JWT claims carry no role — every token is treated equally
- No `RoleGuard` or `@Roles()` / `@RequireAppRole()` decorator
- No migration for role column

---

## Approaches

| Approach | Pros | Cons |
|----------|------|------|
| **`appRole` on AccountAggregate + JWT claim** ✅ | Stateless, no DB hit per request, identity concern lives in auth, mirrors existing pattern | ~15min stale window after role change |
| `appRole` on UserAggregate + DB lookup | Immediate changes | DB hit per request, cross-context violation |
| Separate `app_roles` entity | Max flexibility | Over-engineered for 2 roles |

---

## Recommendation

**`appRole` on `AccountAggregate` + JWT claim.**

- Account = identity aggregate → role is an identity concern, not a profile concern
- Stateless auth: no DB hit per protected request
- Mirrors `MembershipRoleValueObject` + `EnumValueObject` pattern exactly
- `AppRoleGuard` applied per-resolver (NOT global) to avoid breaking public routes
- Existing tokens without role claim: graceful default `payload.role ?? AppRoleEnum.USER`

---

## Affected Files

- `src/contexts/auth/domain/enums/app-role.enum.ts` — new
- `src/contexts/auth/domain/value-objects/app-role/` — new VO
- `src/contexts/auth/domain/aggregates/account.aggregate.ts` — add `appRole`
- `src/contexts/auth/domain/primitives/account.primitives.ts` — add `appRole`
- `src/contexts/auth/application/services/token.service.ts` — add role to JWT
- `src/contexts/auth/infrastructure/strategies/jwt.strategy.ts` — extract role from payload
- `src/contexts/auth/infrastructure/decorators/current-user.decorator.ts` — add `appRole`
- `src/contexts/auth/infrastructure/guards/app-role.guard.ts` — new
- `src/shared/decorators/require-app-role.decorator.ts` — new
- DB migration for `app_role` column on accounts table

---

## Risks

- **JWT stale role** (~15min): mitigated by existing `logoutAll` endpoint
- **Existing tokens**: `payload.role ?? AppRoleEnum.USER` default in JwtStrategy
- **Account TypeORM entity path**: not found in glob — needs verification during apply
