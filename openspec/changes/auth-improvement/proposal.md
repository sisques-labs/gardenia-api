# Proposal: Auth Improvement — Fix Foundation + OAuth Readiness

## Intent

The hand-rolled auth context is architecturally sound (DDD + CQRS + Hexagonal, properly layered) but ships with concrete bugs and lacks social login the roadmap needs. We must (1) fix the broken foundation so existing auth behaves correctly, then (2) extend Passport with discrete OAuth strategies — preserving full hexagonal purity and ZERO vendor lock-in (no Supabase, no SaaS, self-hosted).

## Scope

### In Scope
- **Phase 1 — Bug fixes:** `logoutAll` no-op (call `revokeAllByUserId` directly, drop the `findByCriteria` stub path); cookie clear with full attributes (httpOnly, secure, sameSite, path); pessimistic write lock on refresh-token rotation; route `REFRESH_TOKEN_TTL_DAYS` / `REFRESH_COOKIE_NAME` through `ConfigService`.
- **Phase 2 — OAuth foundation:** abstract `OAuthProviderStrategy` adapter contract; `oauth_identities` table + persistence; new application command handlers (`LinkOAuthIdentity`, `LoginWithOAuth`); domain extension via new value objects/fields only — no rewrite of the auth aggregate model.
- **Phase 3 — Providers:** Google, GitHub, Apple as isolated Passport strategy adapters wired through the Phase 2 contract.

### Out of Scope
- Password reset and email verification — both require SMTP/transactional email infra not yet provisioned.
- MFA / 2FA — longer-term roadmap.
- Migrating to Better Auth or an external OIDC IdP (Keycloak/Authentik) — explored, rejected for now (body-parser breakage / operational cost / domain restructuring).
- Session read-model / "list active sessions" view.

## Capabilities

### New Capabilities
- `oauth`: social login via discrete self-hosted Passport strategies (Google, GitHub, Apple), identity linking to existing accounts, and OAuth-initiated session issuance.

### Modified Capabilities
- `auth`: corrected logout-all revocation, cookie-clear attributes, refresh-token rotation concurrency lock, and config sourced via `ConfigService`.

## Approach

Option C (Extend Passport) from exploration. Bug fixes land first as the stable base. OAuth slots into the existing hexagonal model: each provider is an INFRASTRUCTURE adapter (Passport strategy implementing `OAuthProviderStrategy`), orchestration lives in new APPLICATION command handlers, and the DOMAIN gains only new fields/value-objects (`OAuthIdentity`) — no behavioral rewrite of `AuthSessionAggregate` or `AccountAggregate`. Transport (REST + GQL) adds callback routes only; no logic. Account linking keys on verified provider email or explicit link.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `application/commands/logout-all/logout-all.handler.ts` | Modified | Call `revokeAllByUserId` directly |
| `infrastructure/persistence/typeorm/repositories/auth-session-typeorm-write.repository.ts` | Modified | Remove stub `findByCriteria`; add pessimistic lock path |
| `transport/shared/cookie.helper.ts` | Modified | Full cookie attributes on clear |
| `auth` constants / config module | Modified | Route TTL + cookie name via `ConfigService` |
| `domain/` (OAuthIdentity VO + fields) | New | OAuth identity model |
| `infrastructure/strategies/oauth/*` | New | Google / GitHub / Apple adapters |
| `application/commands/oauth/*` | New | Link + login OAuth handlers |
| `oauth_identities` table + migration | New | Provider identity persistence |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| logoutAll silent no-op already in prod | High | Ship Phase 1 first; add regression test |
| Cookie-on-rotation-failure (prior revert) | Med | Explicit decision in design phase; cover with test |
| Concurrent refresh double-success | Med | Pessimistic `pessimistic_write` lock in same tx |
| OAuth account-linking hijack via unverified email | Med | Require provider-verified email or explicit link step |
| Per-provider passport package maintenance | Low | Isolated adapter per strategy; swappable |

## Rollback Plan

Phase 1 is small, isolated edits — revert per file/PR. Phase 2/3 are additive: OAuth strategies and `oauth_identities` table are not referenced by existing flows, so dropping the new module + reverting the migration restores prior behavior with no data loss to core auth tables.

## Dependencies

- Phase 1 has none.
- Phase 2/3: per-provider OAuth credentials (client id/secret, callback URLs) supplied via config.
- No SMTP dependency (password reset / verification deferred).

## Success Criteria

- [ ] `logoutAll` revokes all sessions for a user (verified by test).
- [ ] Logout clears the refresh cookie reliably across browsers (full attributes).
- [ ] Concurrent refresh on the same token cannot both succeed.
- [ ] All auth config flows through `ConfigService` (no direct `process.env`).
- [ ] A user can sign in with Google/GitHub/Apple and receive a valid session.
- [ ] Hexagonal boundaries preserved; zero new SaaS/vendor dependency.
