# Exploration: migrate-gardenia-to-sisques-account

## Existing Branch Investigation

**Verdict: `JSisques/migrate-auth-to-account` contains ZERO work — fresh start is correct.**

- The branch is local-only, never pushed: `.git/config` has no `remote`/`merge` entry for it, and `packed-refs` has no `origin/JSisques/migrate-auth-to-account` entry. It does not exist on GitHub.
- Its reflog has exactly two entries — `branch: Created from refs/remotes/origin/main` (tip `4c9e9c04`), then a rename from `JSisques/jawfish` → `JSisques/migrate-auth-to-account` — same commit hash both times. Zero commits were ever added.
- The worktree that was set up for it (`/Users/javi/orca/workspaces/gardenia-api/jawfish`) no longer exists on disk; only a sibling worktree remains under that path.
- Conclusion: a reserved branch name / empty scaffold, abandoned before any commit. Nothing to continue or rebase against.

---

## Is This Buildable Today?

**Nuanced — not a flat "pause," but also not "fully migrate now" without qualification.**

- `platform/docs/architecture/sisques-account/status-and-mvp.md`: account-api's own MVP is now **implemented, verified, and archived** (JWKS endpoint, Keycloak-backed login issuing Account's own JWT+refresh, `POST /tenants`, direct membership add, `platform_admin` bootstrap). This is new/complete relative to the earlier account-api-only exploration.
- The same doc, unchanged, still explicitly lists under "Deferred / Out of MVP scope": **"Migration of `gardenia-api` to delegate its current auth/tenancy to Sisques Account" — "planned separately, later."**
- `platform/docs/open-questions.md` still says "Status: Unresolved" for the JWT/tenancy conflict even though gardenia's own side was just confirmed and locked in `resolve-jwt-tenant-conflict` — a stale cross-repo doc, not a technical blocker, but worth flagging to whoever owns the platform docs.
- The deferred item, read literally, is the **FULL migration** — replacing gardenia's own session/JWT issuance and/or tenant model wholesale.
- **Option 1 (identity-only edge adapter, from the `resolve-jwt-tenant-conflict` explore) is NOT that.** It doesn't delegate gardenia's auth/tenancy to Sisques Account — gardenia keeps issuing its own JWT, keeps its own session table, keeps `SpaceGuard`/`X-Space-ID` as the only tenant path. It's architecturally identical to adding a fourth OAuth provider. Additive, not a migration — does not conflict with the deferred sequencing.

**Scope decision presented to the user**: (A) narrow additive edge adapter — compatible with platform sequencing, buildable now — vs. (B) full migration — explicitly contradicts the platform's own stated deferred sequencing.

**User confirmed Option B (full migration), knowingly, having been shown the conflict with the platform's documented sequencing before choosing.**

---

## Concrete Technical Grounding (read fresh from current code)

- `src/contexts/auth/infrastructure/oauth/oauth-provider.registry.ts` — `OAuthProviderRegistry` validates a provider string against `OAuthProviderEnum` (currently Google/GitHub/Apple). The registry pattern is reusable, but it backs Passport OAuth2 redirect strategies via `DynamicOAuthGuard`; Sisques Account's flow (verify a received bearer JWT via JWKS) is fundamentally different and needs its own sibling guard, not a literal drop-in.
- `src/contexts/auth/application/commands/oauth/login-with-oauth/login-with-oauth.handler.ts` — real, current handler. Shape to mirror: find-or-create `OAuthIdentityAggregate` (by `provider`+`providerUserId`), auto-link-by-verified-email, provision `spaceId`+user for new users via `ISpaceProvisioningPort`/`IUserProvisioningPort`, then `TokenService.sign(userId, email, appRole)` mints gardenia's own JWT.
- `src/contexts/auth/domain/aggregates/oauth-identity.aggregate.ts` — real, current. `link()` emits `OAuthIdentityLinkedEvent`; can gain a `SISQUES_ACCOUNT` provider case.
- `package.json` confirms `@sisques-labs/nestjs-kit` is still pinned at `1.8.0` — a JWT/JWKS verification dependency is required regardless of which option is chosen (lightweight direct dependency, e.g. `jwks-rsa` + `jsonwebtoken` verify, or bumping `nestjs-kit` to ≥1.10.0 for `auth-client`).
- The JWKS-vs-HS256 verification-mechanism discrepancy flagged in the `resolve-jwt-tenant-conflict` explore (ADR-0005 JWKS vs. account-api's previously-observed HS256 code) remains unconfirmed against account-api's current code — worth a spot-check before design.

---

## Approaches

1. **Option 1 — Identity-only edge adapter** (compatible with platform sequencing, NOT the chosen scope, documented here for contrast): new `SISQUES_ACCOUNT` OAuth-identity case, one-shot JWKS verify at login/link only, `SpaceGuard`/tenant resolution untouched. Medium effort.
2. **Option B — Full migration** (CHOSEN SCOPE): delegate gardenia's own auth/tenancy to Sisques Account. Not evaluated in technical depth here — the platform side has no product decision or target date for this; `sdd-propose` must scope it explicitly and carry the sequencing-override risk forward visibly, and design must respect the confirmed `tenant-resolution-policy` constraint (current tenant/space always resolved via header + DB lookup, never a JWT claim) regardless of how deep the migration goes.

---

## Risks

- **Sequencing override, done knowingly**: choosing Option B means building against the platform's own stated "planned separately, later" deferral. This is a deliberate user choice, not an oversight — must be carried forward visibly into the proposal and design, not hidden.
- Platform repo's `open-questions.md` is stale (still "Unresolved") relative to gardenia's now-confirmed decision — not a blocker, but a cross-repo doc-sync gap worth flagging back to whoever owns those docs.
- JWKS-vs-HS256 verification-mechanism discrepancy is unconfirmed against account-api's current code — should be spot-checked before design commits to a specific verification approach.
- No Bash/git tool was available during the branch investigation; conclusions were drawn from raw `.git/` plumbing files (ref + reflog, two independent primary sources showing the same unchanged commit hash) rather than `git log` output — considered solid, but cheap to double-confirm with `git log` if tooling is available later.
- Full-migration scope is substantially larger and higher-risk than the `resolve-jwt-tenant-conflict` change: it touches gardenia's own session/JWT issuance and/or tenant model, must still comply with the just-confirmed `tenant-resolution-policy` spec, and needs its own careful proposal-level scoping (e.g. big-bang vs. phased cutover, existing user/password migration path, session invalidation strategy) before design work begins.

---

## Ready for Proposal

Yes, with the scope now explicitly confirmed as Option B (full migration) by the user. `sdd-propose` must carry the sequencing-override risk forward visibly and scope the migration's actual boundaries (what "full" means concretely: session issuance, tenant model, existing-user migration path) rather than leaving it open-ended.
