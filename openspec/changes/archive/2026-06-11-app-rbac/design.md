# Design: App-Level RBAC (ADMIN / USER)

## Technical Approach

Role lives on the identity aggregate (`AccountAggregate`, auth context), is signed into the JWT at token issuance, and enforced statelessly at the transport boundary by an opt-in `AppRoleGuard` consuming `@RequireAppRole()` metadata. No per-request DB hit; mirrors the existing `JwtAuthGuard → SpaceGuard` GraphQL/REST branching pattern. Realizes exploration Approach 1 and the proposal scope. Backward compatible: `payload.role ?? USER`.

## Architecture Decisions

### Decision: Role on AccountAggregate (auth), not Users
**Choice**: `appRole` field on `AccountAggregate` + `IAccountPrimitives`.
**Alternatives**: role on `UserAggregate`; separate `roles` table.
**Rationale**: Account IS the identity/credential aggregate; auth already owns JWT signing/validation. Users stays profile-only. A table is over-engineered for a 2-value enum (out of scope per proposal).

### Decision: Stateless JWT-propagated role, opt-in guard
**Choice**: sign `role` claim; `AppRoleGuard` applied per-resolver via `@RequireAppRole`, NOT `APP_GUARD`.
**Alternatives**: global guard; per-request role lookup from DB.
**Rationale**: Global guard would force every endpoint to declare a role and risk regressions. Per-request DB lookup defeats stateless auth. Opt-in keeps all existing non-annotated endpoints byte-for-byte unchanged. Tradeoff: stale role up to access-token TTL (~15min) — acceptable, mitigated by logoutAll.

### Decision: AppRoleEnum local to auth domain
**Choice**: define `AppRoleEnum` in auth domain; `AppRoleValueObject extends EnumValueObject` (kit).
**Alternatives**: import an enum from `@sisques-labs/nestjs-kit`.
**Rationale**: The role set is domain-specific to gardenia. Mirror `MembershipRoleValueObject` (reuses kit `EnumValueObject`, local enum). Consistent with established VO pattern.

### Decision: VO file suffix follows auth-context convention
**Choice**: `app-role.vo.ts` (auth uses `.vo.ts`), not `.value-object.ts` (spaces convention).
**Rationale**: Follow the local context's existing naming. Auth VOs are all `*.vo.ts`.

## Data Flow

    Login/Refresh ─→ TokenService.sign(userId,email,role) ─→ JWT{sub,email,role}
                                                                    │
    Request ─→ JwtAuthGuard ─→ JwtStrategy.validate ─→ req.user{userId,email,appRole}
                   │                (role ?? USER)              │
                   └─→ AppRoleGuard (reads @RequireAppRole metadata) ─→ 401/403/pass
                                                                    │
                                              @CurrentUser() ─→ {userId,email,appRole}

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/contexts/auth/domain/enums/app-role.enum.ts` | Create | `enum AppRoleEnum { ADMIN='admin', USER='user' }` |
| `src/contexts/auth/domain/value-objects/app-role/app-role.vo.ts` | Create | `AppRoleValueObject extends EnumValueObject<typeof AppRoleEnum>`, `isAdmin()` |
| `src/contexts/auth/domain/primitives/account.primitives.ts` | Modify | add `appRole: string` |
| `src/contexts/auth/domain/aggregates/account.aggregate.ts` | Modify | `_appRole` field, constructor, getter, `toPrimitives` |
| `src/contexts/auth/domain/interfaces/account.interface.ts` | Modify | add `appRole: AppRoleValueObject` |
| `src/contexts/auth/domain/builders/account.builder.ts` | Modify | `withAppRole()`, default USER in `build()` |
| `src/contexts/auth/infrastructure/persistence/typeorm/account.entity.ts` | Modify | `@Column({name:'app_role',type:'varchar',default:'user'})` |
| `src/contexts/auth/infrastructure/persistence/typeorm/account-typeorm.mapper.ts` | Modify | map `app_role` ↔ aggregate both directions |
| `src/contexts/auth/application/services/token.service.ts` | Modify | `sign(userId,email,role)`, include `role` claim |
| `src/contexts/auth/infrastructure/strategies/jwt.strategy.ts` | Modify | extract `role`, default USER, return `appRole` |
| `src/contexts/auth/infrastructure/decorators/current-user.decorator.ts` | Modify | add `appRole` to `CurrentUserPayload` |
| `src/contexts/auth/infrastructure/guards/app-role.guard.ts` | Create | opt-in guard, GraphQL/REST branch |
| `src/shared/decorators/require-app-role.decorator.ts` | Create | `@RequireAppRole(...roles)` metadata setter |
| `src/contexts/auth/application/commands/register-account/register-account.handler.ts` | Modify | `.withAppRole(AppRoleEnum.USER)` |
| `src/contexts/auth/application/commands/login-account/login-account.handler.ts` | Modify | pass `account.appRole.value` to sign |
| `src/contexts/auth/application/commands/refresh-token/refresh-token.handler.ts` | Modify | pass `account?.appRole.value ?? USER` to sign |
| `src/contexts/auth/application/commands/oauth/login-with-oauth/login-with-oauth.handler.ts` | Modify | pass role to sign |
| `src/database/migrations/{ts}-AddAppRoleToAccounts.ts` | Create | column migration |

## Interfaces / Contracts

```ts
// require-app-role.decorator.ts
export const APP_ROLE_KEY = 'appRole';
export const RequireAppRole = (...roles: AppRoleEnum[]) =>
  SetMetadata(APP_ROLE_KEY, roles);

// token.service.ts
sign(userId: string, email: string, role: string): string

// jwt.strategy.ts
validate(payload: { sub: string; email: string; role?: string }):
  { userId: string; email: string; appRole: AppRoleEnum }   // role ?? USER

// current-user.decorator.ts
interface CurrentUserPayload { userId: string; email: string; appRole: AppRoleEnum }
```

AppRoleGuard logic (mirror SpaceGuard `getRequest` branch): read `APP_ROLE_KEY` via `reflector.getAllAndOverride([handler, class])`; if no metadata → pass; resolve `req.user`; no user → `UnauthorizedException` (401); `user.appRole` not in required roles → `ForbiddenException` (403); else pass.

## Migration / Rollout

`up`: `ALTER TABLE "accounts" ADD COLUMN "app_role" varchar NOT NULL DEFAULT 'user'`. Existing rows backfill to `'user'` via default. `down`: `ALTER TABLE "accounts" DROP COLUMN "app_role"`. Migration name pattern `{timestamp}-AddAppRoleToAccounts.ts` (timestamp > 1780000000013).

## Guard Execution Order

NestJS runs guards in array order. On a resolver: `@UseGuards(JwtAuthGuard, AppRoleGuard)` — JwtAuthGuard must precede so `req.user` (with `appRole`) is populated before AppRoleGuard reads it. AppRoleGuard does NOT re-authenticate; it only authorizes. Document this ordering in the decorator/guard JSDoc. Global chain (`OptionalJwtAuthGuard → SpaceGuard`) is untouched.

## Registration Flow — USER default

`RegisterAccountCommandHandler` adds `.withAppRole(AppRoleEnum.USER)` to the builder chain. Defense-in-depth: `AccountBuilder.build()` also defaults to `AppRoleEnum.USER` when unset, and the DB column default is `'user'`. Three layers guarantee no account lacks a role.

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | AppRoleValueObject (valid/invalid, isAdmin) | mirror membership-role VO spec |
| Unit | AccountAggregate toPrimitives includes appRole; builder default USER | extend account.aggregate.spec / builder.spec |
| Unit | AppRoleGuard: no-metadata pass, no-user 401, wrong-role 403, match pass | mock ExecutionContext + Reflector (GraphQL + REST) |
| Unit | JwtStrategy.validate: role present / absent (USER default) | extend strategy spec |
| Unit | TokenService.sign includes role claim | extend token.service spec |
| Integration | mapper round-trips app_role | extend account-typeorm.mapper.spec |

## Open Questions
- None blocking. `account.entity.ts` already carries `spaceId` not present in primitives/builder (pre-existing drift) — out of scope; do not touch.
