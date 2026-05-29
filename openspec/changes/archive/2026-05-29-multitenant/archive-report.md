# Archive Report: multitenant

**Archived**: 2026-05-29  
**Status**: COMPLETE  
**PRs**: #84 · #85 · #86 · #87 · #88 · #89 (all merged to main)

---

## Summary

Row-level multi-tenancy via Spaces is fully delivered. Every user now belongs to one or more Spaces; all domain data (accounts, users) is isolated per Space at the infrastructure layer via a tenant repository proxy and AsyncLocalStorage. All 55 tasks complete, 427 unit tests pass, 8 E2E suites pass.

---

## Delivery Chain

| PR | Scope | Status |
|----|-------|--------|
| #84 | Migrations (spaces, space_memberships, spaceId on accounts/users) | ✅ merged |
| #85 | `spaces` bounded context — domain + application | ✅ merged |
| #86 | `spaces` infra + cross-cutting (SpaceContext, tenant repo factory) | ✅ merged |
| #87 | SpaceGuard + SpaceInterceptor + SpacesModule | ✅ merged |
| #88 | Adapt auth + users contexts | ✅ merged |
| #89 | E2E isolation tests + final app wiring + bug fixes | ✅ merged |

---

## Artifacts Archived

| Artifact | Path |
|----------|------|
| Exploration | `openspec/changes/archive/2026-05-29-multitenant/exploration.md` |
| Proposal | `openspec/changes/archive/2026-05-29-multitenant/proposal.md` |
| Spec (spaces) | `openspec/changes/archive/2026-05-29-multitenant/specs/spaces/spec.md` |
| Spec (auth) | `openspec/changes/archive/2026-05-29-multitenant/specs/auth/spec.md` |
| Spec (users) | `openspec/changes/archive/2026-05-29-multitenant/specs/users/spec.md` |
| Design | `openspec/changes/archive/2026-05-29-multitenant/design.md` |
| Tasks | `openspec/changes/archive/2026-05-29-multitenant/tasks.md` |
| Verify report | `openspec/changes/archive/2026-05-29-multitenant/verify-report.md` |
| State | `openspec/changes/archive/2026-05-29-multitenant/state.yaml` |

## Main Specs Synced

| Delta | Canonical |
|-------|-----------|
| `specs/spaces/spec.md` | `openspec/specs/spaces/spec.md` |
| `specs/auth/spec.md` | `openspec/specs/auth/spec.md` |
| `specs/users/spec.md` | `openspec/specs/users/spec.md` |

---

## Key Design Decisions (for traceability)

- **Tenant isolation via Proxy**: `createTenantRepository` wraps `Repository<E>` with a JS Proxy that injects `spaceId` into every `findOne`, `find`, `findAndCount`, `save`, and `delete` call. The domain layer is completely unaware of tenancy.
- **ALS via SpaceInterceptor**: `SpaceContext` backed by `AsyncLocalStorage`. `SpaceInterceptor` (APP_INTERCEPTOR) wraps `next.handle()` — ensuring the ALS frame covers the full async handler chain. `SpaceGuard` validates membership and sets `req.spaceId`; the interceptor picks it up.
- **OptionalJwtAuthGuard**: Global APP_GUARD that uses `Reflector` to bypass JWT validation entirely on `@SkipSpace` routes. Avoids passport-jwt wrapping "No auth token" as `JsonWebTokenError` (which would cause false 401s on public routes).
- **`@SkipSpace()`**: Dual-purpose: (1) SpaceGuard skips membership check, (2) OptionalJwtAuthGuard skips JWT validation. Routes: register, login, refresh, logout, logoutAll.
- **Space auto-created on registration**: `RegisterAccountCommandHandler` dispatches `CreateSpaceCommand` first, then wraps account + user creation in `SpaceContext.run(newSpaceId)`. Returns `{ spaceId }` to client.
- **Email uniqueness**: `UNIQUE(spaceId, email)` replaces `UNIQUE(email)`. Same email can register across Spaces.

---

## Verify: PASS (0 CRITICAL, 0 WARNING, 2 SUGGESTION)

See `verify-report.md` for full matrix. Suggestions are non-blocking design notes.
