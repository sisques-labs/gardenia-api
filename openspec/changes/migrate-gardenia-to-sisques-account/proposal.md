# Proposal: Migrate Gardenia to Sisques Account (Full Auth + Tenancy Delegation)

**Change**: migrate-gardenia-to-sisques-account
**Phase**: proposal
**Date**: 2026-09-10
**Artifact store**: openspec

---

## Intent

Gardenia owns its whole identity stack today: password credentials on `accounts`, native Google/GitHub/Apple OAuth, its own `TokenService.sign()` JWT, and its own `auth_sessions` refresh rotation. ADR-0001/0002 place identity in Sisques Account, whose MVP (JWKS endpoint, own JWT + refresh, `POST /tenants`, membership add) is implemented and archived. A second identity authority means duplicated credential storage, duplicated IdP coupling, and a second session lifetime to revoke.

Success: gardenia is a **resource server** — verifies Sisques Account access tokens via JWKS, mints nothing, stores no credentials, and its Space model is layer-2 over platform tenants — with `X-Space-ID` + DB membership lookup still the only current-tenant selector.

## Sequencing Override (stated plainly, not softened)

`platform/docs/architecture/sisques-account/status-and-mvp.md` lists **"Migration of `gardenia-api` to delegate its current auth/tenancy to Sisques Account"** under **Deferred / out of MVP scope**, "planned separately, later". The user was shown the narrower alternative (Option A: Sisques Account as a 4th OAuth-style login method, additive, compatible with that deferral) and **explicitly chose this full migration instead, knowing it contradicts the platform's own documented sequencing**. A deliberate, informed override — not an oversight. Consequence: gardenia leads the platform roadmap, account-api gains a hard consumer before it planned one, and platform-side gaps become gardenia's blockers.

## Scope Decisions

| # | Decision | Rationale |
|---|---|---|
| 1 | **Full delegation, not hybrid.** Retire `TokenService.sign()`, `auth_sessions`, refresh rotation, and `POST /auth/{register,login,refresh,logout,logout-all,password}`. Gardenia only *verifies* Sisques Account JWTs via JWKS. Retire `accounts.password` and the native OAuth stack (`oauth_identities`, `DynamicOAuthGuard`, `OAuthProviderRegistry`). | A hybrid (verify-then-remint) keeps two session stores and stacks two TTLs on revocation, contradicting ADR-0002's "apps validate locally via JWKS". Keeping passwords keeps two credential authorities — exactly what ADR-0001 rejects. Keeping native OAuth re-couples gardenia to IdPs that ADR-0003 puts behind the platform's adapter. |
| 2 | **Link by verified email, do not migrate credentials.** `accounts` is demoted to a local identity projection (`userId`, `email`, `appRole`, new unique `external_subject`). Existing users re-authenticate once at Sisques Account with the same email; first authenticated request links subject→account. Native OAuth identities are not migrated — the same Google/GitHub/Apple account federated through the platform yields the same verified email. `password_hash` and `oauth_identities` drop after the cutover window. | Bcrypt hashes cannot be moved: account-api's MVP has no user-import path. Email linking reuses the auto-link-by-verified-email rule already live in `login-with-oauth.handler.ts`. Unverified or non-matching emails need operator linking (see Risks). |
| 3 | **Space ↔ tenant 1:1, split authority.** Each gardenia Space corresponds to one platform tenant (`app_id = gardenia`); gardenia adopts the tenant UUID as `space.id` (no mapping table). The platform is the **write** authority for layer-1 membership; gardenia persists a local membership **projection** that remains the **read** authority `SpaceGuard` consults. Role *meaning* stays gardenia's (layer 2). | ADR-0004 / `tenancy.md` name Gardenia spaces as the motivating tenant example, so a fully separate model would fork tenancy permanently. A projection keeps Decision 5 literally true — `SpaceGuard` still does a gardenia DB lookup, never a token read. |
| 4 | **Phased dual-running, not big-bang.** P1: accept both token issuers, link subjects, remove nothing (fully revertable). P2: tenant mirroring + backfill; Space creation routed through the platform. P3: cutover — delete local issuance, credentials, OAuth, `auth_sessions`. | Big-bang invalidates every live session and every credential at once with no rollback but a DB restore, and existing users need a window to self-register at the platform. Phases are independently revertable and slice cleanly under the 400-line review budget. |
| 5 | **`tenant-resolution-policy` is inherited unchanged, not superseded.** The current space is resolved ONLY from `X-Space-ID` + DB membership lookup. A Sisques Account token's `tenants` claim is identity metadata only and MUST NOT select, satisfy, or override the current space, in any phase. | Binding spec from the in-flight `resolve-jwt-tenant-conflict` change, whose §"Policy Binds Future External-Identity Integrations" targets this migration by name. |

## Scope

### In Scope
- JWKS-based verification of Sisques Account access tokens (new strategy/guard; `@sisques-labs/nestjs-kit` bump or direct `jwks-rsa` dependency).
- `accounts.external_subject` + subject→account linking by verified email.
- Retirement of local JWT issuance, `auth_sessions`, password storage, native OAuth (phase 3).
- `appRole` resolved per-request from the local account projection instead of a self-signed `role` claim.
- Space↔tenant 1:1 mapping, platform-authored membership, local membership projection + backfill.
- Migration scripts, phase feature flag, and E2E coverage for the dual-running window.

### Out of Scope
- Any change to `tenant-resolution-policy` (explicitly preserved).
- `account-web` / cross-domain cookie SSO (platform-side, deferred).
- Email invitation flows (platform MVP defers them).
- gardenia-web / client changes beyond the token source.
- Platform-side work in `account-api` (membership event feed, user import) — a dependency, not this change's deliverable.
- Space deletion/rename lifecycle, billing, quotas.

## Capabilities

### New Capabilities
- `external-identity-delegation`: gardenia as resource server — JWKS verification, subject linking, retirement of local session/credential issuance, dual-running window.
- `space-tenant-mapping`: Space↔platform-tenant 1:1 identity, platform write authority, local membership projection and its consistency contract.

### Modified Capabilities
- `auth`: local token issuance, `auth_sessions`, password storage, and native OAuth removed; `accounts` becomes an identity projection keyed by `external_subject`. Supersedes archived multitenant §2.2 (which governed gardenia's own signing) and §6 JWT-claim mechanics.
- `app-rbac`: `appRole` no longer travels in a gardenia-signed claim; it is read from the local account projection per request.
- `spaces`: Space id is the platform tenant id; membership creation/removal is platform-authored; `SpaceGuard` reads the local projection (unchanged mechanism, changed write path).

## Approach

1. `SisquesAccountJwtStrategy` (JWKS, cached keys per ADR-0005) alongside the existing `JwtStrategy`; a phase flag selects accept-both vs. accept-platform-only.
2. `accounts.external_subject`, linked on first platform-authenticated request via the existing verified-email rule; `appRole` resolution moves from the token claim to a per-request account lookup.
3. Tenant-provisioning port in `spaces/application/ports/` + `infrastructure/adapters/` HTTP adapter to `POST /tenants`; membership projection stays the read model. No layer crossings.
4. Backfill one platform tenant per existing Space, adopting existing Space UUIDs where account-api permits client-supplied ids (else one remap migration). Phase 3 removes retired code, tables, and endpoints in a dedicated slice.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/contexts/auth/infrastructure/strategies/` | New | `SisquesAccountJwtStrategy` (JWKS) |
| `src/contexts/auth/application/services/token.service.ts` | Removed (P3) | No local signing |
| `src/contexts/auth/domain/aggregates/auth-session.aggregate.ts` + `auth_sessions` | Removed (P3) | Sessions owned by platform |
| `src/contexts/auth/domain/aggregates/account.aggregate.ts` + `accounts` | Modified | `+external_subject`, `-password` |
| `src/contexts/auth/infrastructure/oauth/**`, `oauth_identities` | Removed (P3) | IdP federation moves to platform |
| `src/contexts/auth/transport/rest/**` | Modified | Local auth endpoints retired |
| `src/contexts/spaces/application/ports/`, `infrastructure/adapters/` | New | Tenant provisioning + membership sync |
| `src/contexts/spaces/transport/guards/space.guard.ts` | Unchanged | Policy lock-in preserved |
| `src/core/config/env.validation.ts` | Modified | Account issuer, JWKS URL, phase flag |
| Migrations | New | `external_subject`, tenant-id backfill, P3 drops |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| **Platform sequencing override** (documented above) — account-api gains an unplanned hard consumer | High (accepted) | Stated explicitly here and to be restated in design; phase flag keeps every step revertable; file the roadmap conflict back to platform docs |
| No documented membership event feed in account-api → projection can go stale | High | Open question below; interim: sync-on-login + on-demand refetch; a stale projection fails closed (403), never open |
| Existing users must re-register at the platform (no credential import) | High | Dual-running window with both issuers accepted; in-app prompt; operator linking for unmatched emails |
| Platform becomes a single point of failure for all gardenia auth | Med | Short-TTL local JWKS verification means no per-request platform call (ADR-0002); cache keys |
| account-api may not accept client-supplied tenant ids → Space id remap | Med | Confirm before design; fall back to a one-time id remap migration with FK cascade |
| JWKS-vs-HS256 discrepancy in account-api's actual code (ADR-0005 vs. previously-observed HS256) unconfirmed | Med | Spot-check account-api before design commits to a verification mechanism |
| Scope exceeds one PR by a wide margin | High | Three phases → chained PRs; `sdd-tasks` must forecast against the 400-line budget |
| Revocation lag up to access-token TTL | Low | Accepted per ADR-0002; membership revocation is immediate via the local projection |

## Open Questions (for the orchestrator to raise — not re-asked here)

1. **Membership sync transport**: account-api's MVP documents no webhook/event feed. Decision 3 needs one (webhook, polling, or sync-on-login only). Blocks design of the projection's consistency contract.
2. **Client-supplied tenant ids**: does `POST /tenants` accept a caller-provided UUID? Determines whether Space ids survive the backfill or must be remapped.
3. **Cutover window length** and whether existing gardenia users get a forced-migration deadline — a product decision, not inferable from the docs.

## Rollback Plan

Per phase. P1/P2 are additive behind a phase flag: flip the flag to platform-off, and gardenia's own login/session path is untouched and authoritative again; revert commits, then down-migrate `external_subject`. P2 additionally requires deleting the tenant projection rows (platform tenants may be left orphaned — harmless, `app_id`-scoped). P3 is the irreversible point: local credentials, sessions, and OAuth identities are dropped, so it MUST ship only after the cutover window closes, and its rollback is a DB restore plus forced re-authentication. Gate P3 on an explicit go/no-go.

## Dependencies

- `account-api` MVP endpoints: `GET /.well-known/jwks.json`, `POST /tenants`, membership add (all implemented/archived).
- A membership sync mechanism in `account-api` (Open Question 1) — not yet specified.
- `openspec/changes/resolve-jwt-tenant-conflict/specs/tenant-resolution-policy/spec.md` — binding, must archive to `openspec/specs/` before or with this change.
- JWKS verification dependency: `@sisques-labs/nestjs-kit` ≥1.10.0 `auth-client`, or `jwks-rsa` + `jsonwebtoken` (currently pinned at 1.8.0).

## Delivery Strategy

Chained PRs, one per phase (P1 verification + linking, P2 tenant mapping, P3 cutover/removal), each independently revertable. Auto-chain per session setting; each phase will still exceed the 400-line budget and needs its own internal slicing at `sdd-tasks`.

## Success Criteria

- [ ] A Sisques Account access token authenticates every gardenia endpoint; signature verified via JWKS with cached keys.
- [ ] Gardenia signs zero tokens and stores zero credentials after P3; `auth_sessions`, `accounts.password`, `oauth_identities` are gone.
- [ ] Every existing gardenia account is linked to an `external_subject` or explicitly listed as unlinked before P3.
- [ ] Every gardenia Space has exactly one corresponding platform tenant, and vice versa, for `app_id = gardenia`.
- [ ] `appRole` resolves correctly from the local projection with no `role` claim present.
- [ ] The `tenant-resolution-policy` lock-in tests still pass unmodified; a `tenants` claim never selects a space, in any phase.
- [ ] A missing `X-Space-ID` header is still rejected (400) even when the token carries exactly one tenant.
