# Exploration: resolve-jwt-tenant-conflict

## Current State

Gardenia's own JWT (`src/contexts/auth/infrastructure/strategies/jwt.strategy.ts`): HS256, payload `{sub, email, role?}`, `validate()` returns `{userId, email, appRole}` — no space/tenant claim, matching the locked decision.

Space resolution is entirely out-of-band from the JWT today: `SpaceGuard` (`src/contexts/spaces/transport/guards/space.guard.ts`) reads the `X-Space-ID` header, runs a `MembershipFindByUserAndSpaceQuery` via QueryBus against the `spaces` bounded context, then sets `req['spaceId']`; `SpaceContext` (`src/shared/space-context/space-context.service.ts`) is an AsyncLocalStorage populated per-request by `SpaceInterceptor`. Zero coupling to JWT claims.

Archived locked decision (`openspec/changes/archive/2026-05-29-multitenant/specs/auth/spec.md`, §2.2 + §4) — read verbatim, not re-derived from memory:

- §2.2: "The JWT payload MUST remain `{sub: userId, email}`. `spaceId` MUST NOT be embedded in the JWT." — this is about `TokenService.sign()`, gardenia's own issuance.
- §4: "`auth_sessions` table MUST NOT include a `spaceId` column... `SpaceGuard` resolves Space context from the `X-Space-ID` header... This decision is final and MUST NOT be re-opened without a new proposal." — the "final" clause is scoped to gardenia's own session-table shape and its own header-based resolution mechanism, not to the general question of whether any externally-issued JWT gardenia merely verifies may carry a tenant claim.

**Key finding: the letter of the locked decision does not actually forbid trusting an externally-minted JWT that carries a tenant claim, as long as gardenia's own `TokenService.sign()` output and `auth_sessions` schema stay claim-free.** The conflict as stated in the platform doc is real at the level of "spirit / policy intent," but the archived spec text is narrower than the platform's framing suggests.

Sisques Account's token model (platform repo, read fresh — postdates the account-api-only exploration in prior Engram obs #208):

- ADR-0002: Account issues its own short-lived `access_token` JWT (10–15 min) + opaque `refresh_token`, both `httpOnly` cookies on `Domain=.sisqueslabs.com`.
- ADR-0005 / `sessions-and-tokens.md`: verification via **JWKS** (`GET /.well-known/jwks.json`), asymmetric — not the shared-HS256-secret model the prior exploration (obs #208) found in account-api's current code. This is a discrepancy between the platform ADR (design of record, dated 2026-09-10) and the previously-observed account-api implementation; worth a spot-check before design, not a blocker for this decision.
- ADR-0004 (two-layer tenancy): platform (Layer 1) owns membership mechanics and returns role labels in the token; each app (Layer 2) owns what those roles mean. The platform-level noun is fixed as "tenant," deliberately not "space," specifically to avoid conflating it with an app's own terminology — this already implies apps are expected to keep their own tenancy noun (Gardenia's "Space") distinct from the platform's "Tenant".
- `status-and-mvp.md`: gardenia's migration to Sisques Account is explicitly OUT of MVP scope and "planned separately, later" — any option here must not presuppose gardenia has adopted Sisques Account as its login system yet, only that it may need to accept/interoperate with a Sisques Account token at some boundary.

Existing extensibility precedent in gardenia-api's auth context: native OAuth providers (Google/GitHub/Apple) are wired via `OAuthProviderRegistry` + `DynamicOAuthGuard` + `OAuthIdentity` aggregate + `login-with-oauth` command handler — an established "external identity → local Account" seam that already discards everything from the external provider except identity (never imports provider-specific role/tenant data into gardenia's own JWT).

---

## Gaps

- The archived decision's text scope (gardenia's own issuance) vs. its stated intent (avoid tenant-in-JWT generally) is ambiguous and needs explicit user confirmation before design proceeds on that reading.
- Sisques Account's real verification mechanism (JWKS vs. shared HS256 secret) is unconfirmed against `account-api`'s current `develop` branch.
- No token-exchange (RFC 8693) or introspection-endpoint client exists anywhere in this stack today.

---

## Approaches

| Approach | Pros | Cons | Effort |
|----------|------|------|--------|
| **1. Edge exchange / identity-only adapter** — gardenia keeps issuing its own JWT; Sisques Account's `access_token` is accepted only at a login/link boundary (new adapter mirroring the OAuth-provider pattern) to assert `{sub, email}`; `X-Space-ID` + `SpaceGuard` + `spaces` context remain the sole tenant-resolution path | Zero change to `SpaceGuard`/`SpaceContext`/JWT shape; respects both letter and spirit of the locked decision; reuses the proven OAuth-provider-registry seam; smallest blast radius; does not presuppose or block the deferred full migration | Gardenia's "Space" and Sisques Account's "Tenant" stay two unsynced concepts until a later change bridges them (acceptable — that's the deferred migration's job) | Medium (new adapter + command handler, no guard/schema changes) |
| **2. Resource-server adapter, bearer-trust with claim-stripping** — wire `@sisques-labs/nestjs-kit/auth-client`'s `JwtAuthGuard` to verify Sisques Account tokens as ongoing bearer auth for some/all requests, but never populate `request.user.tenants` from it; `X-Space-ID`+DB lookup stays the sole tenant source | Technically respects the archived decision's letter (the claim in question isn't gardenia's own `TokenService.sign()` output); off-the-shelf verify-only library already exists in the monorepo; JWKS-based verification is a better technical fit for a multi-app trust model than shared secrets | If scoped broadly (replacing gardenia's own session issuance for ongoing requests, not just login), reopens the same "does gardenia adopt Sisques Account as its running auth system" question the platform's own MVP sequencing explicitly defers; requires a `nestjs-kit` bump (1.8.0 → ≥1.10.0, exact minimum unconfirmed); two guard/claims models would coexist unless carefully scoped | Medium if scoped narrowly (one service-to-service or admin-only route) / High if scoped broadly (ongoing session replacement) |
| **3. Formal scoping clarification of the locked decision (no code)** — record explicitly, in this change's proposal/design, that the archived decision governs gardenia's own token-issuance and session schema, not the general question of trusting a claim inside a JWT gardenia did not issue | Cheapest possible unblock; grounded in the archived text itself; removes a procedural obstacle without touching code or any existing guarantee | Still a favorable-to-integration reading; needs explicit user sign-off rather than unilateral assertion; must not be used to justify Option 2's broad variant | Low (documentation only) — this is a precondition/complement to Options 1/2, not a 4th independent path |

No independent 4th technical option was found: nothing in `nestjs-kit`, `nestjs-template`'s resource-server wiring, or gardenia's own `JwtModule`/guards suggests a materially different mechanism.

---

## Recommendation

Treat **Option 3** (scoping clarification) as a prerequisite finding to carry into `sdd-propose`, not a standalone choice. Present the real fork to the user as **Option 1 (identity-only edge exchange, narrow, zero guard changes) vs. Option 2 (resource-server bearer-trust with claim-stripping, narrow-scoped only)**:

- Option 1 is lower-risk and sufficient to give the eventual gardenia migration an unblocked starting point, without presupposing session-model replacement.
- Option 2 is only worth it if the user wants gardenia to start behaving as a Sisques Account resource server ahead of the platform's own deferred migration timeline.

---

## Risks

- The scoping-clarification reading (Option 3) is favorable to unblocking integration; must be explicitly confirmed by the user in `sdd-propose`, not silently assumed.
- Sisques Account's actual token-verification mechanism (JWKS per today's ADR-0005 vs. HS256-shared-secret per the account-api code read previously) has an unconfirmed discrepancy — should be spot-checked against account-api's current `develop` before any design that depends on the verification mechanism.
- Choosing Option 2's broad variant would conflict with the platform doc's own explicit MVP sequencing (`status-and-mvp.md`) — a product-sequencing risk independent of the JWT/tenant technical question.
- No external research gap identified: both systems are already fully documented and internally consistent enough to decide from.

---

## Affected Areas

(If/when a chosen option is implemented — none touched by this explore phase.)

- `src/contexts/auth/infrastructure/adapters/` — would host a new external-identity adapter (Sisques Account token verification), same seam as existing OAuth adapters.
- `src/contexts/auth/application/commands/oauth/login-with-oauth/` — existing pattern to mirror for "login/link via Sisques Account."
- `src/contexts/auth/domain/aggregates/oauth-identity.aggregate.ts` — potential precedent/extension point for linking a Sisques Account identity, or a new sibling concept if OAuth semantics don't fit cleanly.
- `src/contexts/spaces/transport/guards/space.guard.ts`, `src/shared/space-context/space-context.service.ts` — must NOT change under any option that keeps the spirit of the decision; tenant/space resolution stays header + DB-membership based.
- `openspec/changes/archive/2026-05-29-multitenant/specs/auth/spec.md` — archived, immutable; any clarification is new proposal/design text, not an edit to the archive.
- `package.json` — only Option 2 would need `@sisques-labs/nestjs-kit` bumped from 1.8.0 to ≥1.10.0 for `auth-client`/`rbac` entrypoints.

---

## Ready for Proposal

Yes — technical grounding is sufficient to run `sdd-propose` directly. No external research is needed (`sdd-research` would only re-confirm facts already read verbatim from the archived spec and the platform's own docs/ADRs). The orchestrator should present the Option 1 vs. Option 2 fork (with Option 3's scoping finding as shared context) as one clean decision to the user before `sdd-propose` runs.
