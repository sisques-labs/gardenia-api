# Tasks: App-Level RBAC (ADMIN / USER) — app-rbac

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~280–340 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Domain + application + infrastructure + transport + migration | PR 1 | All layers in one shot; under 400-line budget |

---

## Phase 1: Domain (foundation — no deps)

- [x] 1.1 **[S]** Create `src/contexts/auth/domain/enums/app-role.enum.ts` — `AppRoleEnum { ADMIN='admin', USER='user' }`. Req: R-1.
- [x] 1.2 **[S]** Create `src/contexts/auth/domain/value-objects/app-role/app-role.vo.ts` — `AppRoleValueObject extends EnumValueObject`, `isAdmin()` helper. Req: R-2.
- [x] 1.3 **[S]** Add `appRole: string` to `src/contexts/auth/domain/primitives/account.primitives.ts`. Req: R-3.
- [x] 1.4 **[M]** Modify `src/contexts/auth/domain/aggregates/account.aggregate.ts` — add `_appRole: AppRoleValueObject`, constructor param, getter, update `toPrimitives()`. Req: R-3.
- [x] 1.5 **[S]** Add `appRole: AppRoleValueObject` to `src/contexts/auth/domain/interfaces/account.interface.ts` (if it exists). Req: R-3.
- [x] 1.6 **[S]** Add `withAppRole(role: AppRoleValueObject)` to `src/contexts/auth/domain/builders/account.builder.ts`; default `USER` in `build()`. Req: R-5.

## Phase 2: Infrastructure — Persistence

- [x] 2.1 **[S]** Add `@Column({ name: 'app_role', type: 'varchar', default: 'user' })` to the Account TypeORM entity file. Req: R-6.
- [x] 2.2 **[S]** Update `account-typeorm.mapper.ts` — map `app_role` ↔ `appRole` in both `toDomain()` and `toPersistence()`. Req: R-6.
- [x] 2.3 **[M]** Create migration `src/database/migrations/{timestamp>1780000000013}-AddAppRoleToAccounts.ts` — `up`: `ALTER TABLE accounts ADD COLUMN app_role varchar NOT NULL DEFAULT 'user'`; `down`: `DROP COLUMN app_role`. Req: R-6.

## Phase 3: Application — Services & Handlers

- [x] 3.1 **[S]** Update `src/contexts/auth/application/services/token.service.ts` — add `role: string` param to `sign()`; embed `role` claim in JWT payload. Req: R-7.
- [x] 3.2 **[S]** Update `src/contexts/auth/application/handlers/register-account.handler.ts` — call `.withAppRole(new AppRoleValueObject(AppRoleEnum.USER))`. Req: R-5.
- [x] 3.3 **[S]** Update `login-account.handler.ts`, `refresh-token.handler.ts`, `login-with-oauth.handler.ts` — pass `role` to `token.service.sign()`; refresh/oauth default `AppRoleEnum.USER`. Req: R-7.

## Phase 4: Infrastructure — Auth Strategy & Decorator

- [x] 4.1 **[S]** Update `src/contexts/auth/infrastructure/strategies/jwt.strategy.ts` — extract `payload.role`, default to `AppRoleEnum.USER` if absent; include `appRole` in returned payload. Req: R-8.
- [x] 4.2 **[S]** Update `src/contexts/auth/infrastructure/decorators/current-user.decorator.ts` — add `appRole: AppRoleEnum` to `CurrentUserPayload`; never undefined. Req: R-9.

## Phase 5: Transport — Guard & Decorator

- [x] 5.1 **[S]** Create `src/shared/decorators/require-app-role.decorator.ts` — `APP_ROLE_KEY` constant + `RequireAppRole(...roles: AppRoleEnum[])` using `SetMetadata`. Req: R-10.
- [x] 5.2 **[M]** Create `src/contexts/auth/infrastructure/guards/app-role.guard.ts` — implement `CanActivate`; branch GraphQL/REST (mirror SpaceGuard); no metadata→pass; no `req.user`→401; `appRole` not in required roles→403; match→pass. Req: R-10.

## Phase 6: Tests (Standard Mode)

- [x] 6.1 **[S]** Unit test `AppRoleValueObject` — valid values accepted, invalid value throws, `isAdmin()` returns correct result. Spec: S-2.1, S-2.2.
- [x] 6.2 **[S]** Unit test `AccountAggregate` — `toPrimitives()` includes `appRole`, builder `build()` defaults to `user`. Spec: S-3.1, S-5.1.
- [x] 6.3 **[M]** Unit test `AppRoleGuard` — 4 cases: no metadata→pass, no user→401, role match→pass, role mismatch→403; test both GraphQL and REST context branches. Spec: S-10.x.
- [x] 6.4 **[S]** Unit test `JwtStrategy.validate()` — role present in payload→used, role absent→defaults to USER. Spec: S-8.1, S-8.2.
- [x] 6.5 **[S]** Unit test `TokenService.sign()` — JWT payload contains `role` claim. Spec: S-7.1.
- [x] 6.6 **[S]** Integration test `account-typeorm.mapper.ts` — round-trip `app_role` between domain and persistence. Spec: S-6.1.
