# Verify Report: multitenant

**Date**: 2026-05-29  
**Status**: PASS  
**Change**: multitenant (PR #84–#89, all merged)

---

## Executive Summary

All 55 tasks complete. 427 unit tests pass (71 suites). TypeScript and ESLint clean. All 6 E2E specs pass in CI after two bug fixes (JWT global guard and tenant-repo delete proxy). Two minor deviations from spec are noted as suggestions — neither is a correctness issue.

---

## Test Results

| Suite | Result |
|-------|--------|
| Unit tests (pnpm test) | ✅ 427/427, 71 suites |
| TypeScript (tsc --noEmit) | ✅ No errors |
| ESLint | ✅ No issues |
| auth.e2e-spec.ts | ✅ PASS |
| users.e2e-spec.ts | ✅ PASS (after delete-proxy fix) |
| e2e/spaces/cross-space-isolation | ✅ PASS |
| e2e/spaces/space-guard | ✅ PASS |
| e2e/spaces/cross-space-email | ✅ PASS |
| e2e/auth/get-me | ✅ PASS |
| e2e/auth/delete-account | ✅ PASS (after delete-proxy fix) |
| app.e2e-spec.ts | ✅ PASS |

---

## Spec Compliance Matrix

### Spaces spec

| Requirement | Status | Notes |
|-------------|--------|-------|
| Space aggregate: hydration-only constructor, named factories | ✅ | `Space.create()`, constructor private |
| SpaceMembership as child entity, not aggregate root | ✅ | Lives in aggregate |
| Last-owner removal blocked | ✅ | `LastOwnerRemovalException` in aggregate |
| Roles limited to owner/member via VO | ✅ | `MembershipRoleVO` rejects other values |
| SpaceCreatedEvent, MemberAddedEvent, MemberRemovedEvent | ✅ | All emitted |
| Auto-creation on registration | ✅ | `register-account.handler.ts` |
| MAX_SPACES_PER_USER cap check before persist | ✅ | `create-space.handler.ts` |
| SpaceGuard: 400 for missing/invalid X-Space-ID | ✅ | E2E verified |
| SpaceGuard: 403 for non-member | ✅ | E2E verified |
| SpaceContext populated before handler via ALS | ✅ | SpaceInterceptor wraps next.handle() |
| SpaceContext.get() returns undefined when empty | ✅ | ALS returns undefined outside run() |
| Fail-closed: SpaceContextMissingException on empty ctx | ✅ | SpaceContext.require() throws |
| Domain exceptions: all 6 defined | ✅ | All in domain/exceptions/ |

### Auth spec

| Requirement | Status | Notes |
|-------------|--------|-------|
| register atomically creates Space + Account + Membership | ✅ | SpaceContext.run() wraps both saves |
| spaceId returned in register response | ✅ | REST and GQL both return spaceId |
| JWT payload unchanged: { sub: userId, email } | ✅ | JwtStrategy.validate() unchanged |
| spaceId NOT in JWT | ✅ | TokenService unchanged |
| accounts.spaceId NOT NULL | ✅ | Migration 0.4 + AccountEntity |
| UNIQUE(spaceId, email) replacing UNIQUE(email) | ✅ | Migration + @Unique(['spaceId','email']) |
| auth_sessions has no spaceId | ✅ | AuthSessionEntity unchanged |
| register and login @SkipSpace | ✅ | REST controller + GQL resolver |

### Users spec

| Requirement | Status | Notes |
|-------------|--------|-------|
| users.spaceId NOT NULL | ✅ | Migration 0.5 + UserEntity |
| UNIQUE(spaceId, username) replacing UNIQUE(username) | ✅ | Migration + @Unique(['spaceId','username']) |
| All user queries scoped to SpaceContext | ✅ | createTenantRepository wraps all read ops |
| SpaceContextMissingException on empty context | ✅ | ctx.require() in proxy |
| User domain aggregate has no spaceId property | ✅ | UserAggregate unchanged |

---

## Bugs Fixed During PR6 (not in original spec/design)

| Bug | Fix |
|-----|-----|
| Global JwtAuthGuard blocked public routes (register → 401) | `OptionalJwtAuthGuard` uses `Reflector` to bypass passport entirely for `@SkipSpace` routes |
| tenant-repo `delete(string)` spread characters as keys | Detect `string\|number` criteria and wrap as `{ id: criteria, spaceId }` |

---

## CRITICAL Issues

None.

---

## WARNING Issues

None.

---

## SUGGESTION (non-blocking)

**S1 — SpaceContext API differs from spec §7**

Spec §7 says `set(spaceId: string): void` and `get(): string | undefined`. Implementation exposes `run(spaceId, fn)` + `get()` + `require()` — no `set()`. The `run()` method is ALS-native and strictly superior (frame-scoped, no setter race conditions). This is the correct design; the spec was underspecified. No action needed.

**S2 — `@SkipSpace` used as both "no space needed" and "no JWT needed"**

The `OptionalJwtAuthGuard` uses `@SkipSpace` metadata to skip JWT validation. This conflates two concerns in one decorator. If a future route needs JWT but no space, a separate `@Public` decorator would be required. For current scope this is acceptable.

---

## Next Step

`sdd-archive` — close the change and persist final archive report.
