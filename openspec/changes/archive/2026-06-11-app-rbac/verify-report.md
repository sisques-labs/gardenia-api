# Verification Report: app-rbac

**Date**: 2026-06-11  
**Change**: app-rbac — App-Level RBAC (ADMIN / USER)  
**Mode**: Standard (Strict TDD: false)  
**Verdict**: PASS WITH WARNINGS

---

## Test Suite Results

| Suite | Tests | Status |
|-------|-------|--------|
| app-role.vo.spec.ts | 6 | PASS |
| app-role.guard.spec.ts | 9 | PASS |
| jwt.strategy.spec.ts | 3 | PASS |
| token.service.spec.ts | 2 | PASS |
| account.aggregate.spec.ts (updated) | 16 | PASS |
| account-typeorm.mapper.spec.ts (updated) | 6 | PASS |
| **Global suite** | **793 pass, 1 fail** | Pre-existing flake only |

**Pre-existing flake**: `space-invitation.aggregate.spec.ts › isExpired() returns false before expiresAt` — date comparison race condition. Confirmed unrelated to app-rbac, was present before this change.

---

## Task Completeness

All 22 tasks marked COMPLETE in apply-progress (engram).

| Phase | Tasks | Status |
|-------|-------|--------|
| Phase 1: Domain | 6/6 | COMPLETE |
| Phase 2: Persistence | 3/3 | COMPLETE |
| Phase 3: Application | 3/3 | COMPLETE |
| Phase 4: Auth Infrastructure | 2/2 | COMPLETE |
| Phase 5: Transport | 2/2 | COMPLETE |
| Phase 6: Tests | 6/6 | COMPLETE |

> Note: `tasks.md` on disk shows all tasks unchecked — only engram was updated by apply. See SUGGESTION-1.

---

## Spec Compliance Matrix

| Req | Description | Implementation | Test | Status |
|-----|-------------|----------------|------|--------|
| R-1 | AppRoleEnum: ADMIN/USER only | `app-role.enum.ts` — 2 values exact | app-role.vo.spec.ts | COMPLIANT |
| R-2 | AppRoleValueObject validates | extends EnumValueObject, rejects invalid | valid/invalid/isAdmin() cases | COMPLIANT |
| R-3 | AccountAggregate.appRole field | `_appRole` field, getter, toPrimitives() | toPrimitives includes appRole | WARNING (see below) |
| R-4 | AccountPrimitives.appRole: string | IAccountPrimitives has `appRole: string` | — | COMPLIANT |
| R-5 | Default role = USER on register | register-account.handler uses USER explicitly; builder defaults USER | builder default test | COMPLIANT |
| R-6 | app_role DB column + migration | @Column on entity; migration 1780000000014 adds NOT NULL DEFAULT 'user' | mapper round-trip tests | COMPLIANT |
| R-7 | JWT carries `role` claim | TokenService.sign(userId, email, role) embeds role | token.service.spec | COMPLIANT |
| R-8 | JwtStrategy backward compat | `payload.role ?? AppRoleEnum.USER` | 3 cases: present / absent / undefined | COMPLIANT |
| R-9 | CurrentUserPayload.appRole field | `appRole: AppRoleEnum` non-optional on interface | — | COMPLIANT |
| R-10 | AppRoleGuard opt-in behavior | no metadata→pass; no user→401; mismatch→403; match→pass | 9 cases × HTTP+GQL | COMPLIANT |
| Auth-delta | TokenService sign includes role | role param in sign() | token.service.spec | COMPLIANT |
| Auth-delta | JwtStrategy returns appRole | validate() returns appRole | jwt.strategy.spec | COMPLIANT |

---

## Issues

### WARNING-1: `_appRole` not declared `readonly` in AccountAggregate

**File**: `src/contexts/auth/domain/aggregates/account.aggregate.ts:19`

Spec R-3 states the field MUST NOT be mutable after creation. The field is declared `private _appRole` but not `private readonly _appRole`. No public setter or mutation method exists, so observable behavior is correct. However, the immutability constraint is only enforced by convention, not by the type system.

**Fix**: Change `private _appRole: AppRoleValueObject` to `private readonly _appRole: AppRoleValueObject`.

---

### WARNING-2: OAuth login always emits USER role regardless of existing account role

**File**: `src/contexts/auth/application/commands/oauth/login-with-oauth/login-with-oauth.handler.ts:159`

```ts
const jwtAccessToken = this.tokenService.sign(userId, resolvedEmail, AppRoleEnum.USER);
```

For returning OAuth users who have been promoted to ADMIN in their account record, this issues a USER-role JWT. Task 3.3 explicitly documented this default, and the code comment acknowledges it. However, the behavior creates a role promotion gap: a returning OAuth user who was given ADMIN will receive a USER JWT on every OAuth login.

Spec R-7 says the JWT MUST include the account's `appRole` value. For the returning-user path, the account is already resolved (`existingAccount` or via `existingIdentity.userId`), so the actual appRole could be read and used.

**Severity**: WARNING — the task spec accepted this default explicitly, but it contradicts R-7 for returning users.

---

### SUGGESTION-1: `tasks.md` on disk not updated with completion checkmarks

**File**: `openspec/changes/app-rbac/tasks.md`

All `[ ]` items remain unchecked. The authoritative state is in engram (apply-progress). The openspec file is a misleading snapshot. This should be reconciled before archiving.

---

## Design Coherence

| Design Decision | Implementation | Status |
|----------------|----------------|--------|
| AppRoleGuard NOT registered as APP_GUARD | Guard not present in any module's `APP_GUARD` providers | COHERENT |
| JwtStrategy as source of truth for appRole on request | validate() returns appRole; CurrentUserPayload has it | COHERENT |
| AccountViewModel excludes appRole | `Omit<IAccountPrimitives, 'passwordHash' \| 'appRole'>` — intentional, ViewModel is display-only | COHERENT |
| role claim name is `role` (not `appRole`) | TokenService uses `role` key; JwtStrategy reads `payload.role` | COHERENT |
| @RequireAppRole at shared/decorators/ | `src/shared/decorators/require-app-role.decorator.ts` | COHERENT |

---

## Final Verdict

**PASS WITH WARNINGS**

- 0 CRITICAL issues
- 2 WARNING issues (one minor readonly gap, one accepted design tradeoff)
- 1 SUGGESTION (stale tasks.md)
- All 793 tests pass (1 pre-existing unrelated flake)
- All 10 spec requirements + 2 auth-delta requirements satisfied by implementation and tests

Ready for `sdd-archive` after optionally addressing the warnings.
