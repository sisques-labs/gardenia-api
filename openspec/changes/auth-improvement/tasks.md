# Tasks: auth-improvement

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~900–1200 total (PR1: ~100, PR2: ~550, PR3: ~450) |
| 400-line budget risk | PR 1: Low · PR 2: High · PR 3: Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (bug fixes) → PR 2 (OAuth foundation) → PR 3 (provider adapters) |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Four auth bug fixes; existing tests updated | PR 1 | Base: main; fully shippable standalone |
| 2 | OAuth domain model, DB migration, infra plumbing, command handlers, services | PR 2 | Base: PR 1 branch; no live provider yet |
| 3 | Google / GitHub / Apple strategy adapters + OAuthController + module wiring | PR 3 | Base: PR 2 branch; depends on PR 2 types |

---

## PR 1 — Phase 1: Auth Bug Fixes

### REQ-AUTH-001 — logoutAll fix

- [x] 1.1 **Modify** `src/contexts/auth/application/commands/logout-all/logout-all.handler.ts` — replace `findByCriteria` loop with `await this.sessionRepo.revokeAllByUserId(command.userId.value)`; remove unused `Criteria` import. Unit test: verify `revokeAllByUserId` called once; `findByCriteria` NOT called. (Spec REQ-AUTH-001)

### REQ-AUTH-002 — cookie clear fix

- [x] 1.2 **Modify** `src/contexts/auth/transport/shared/cookie.helper.ts` — `clearRefreshCookie` must destructure `maxAge` out of `refreshCookieOptions()` and pass remaining options to `res.clearCookie`. Unit test: assert `clearCookie` receives `httpOnly`, `secure`, `sameSite`, `path`. (Spec REQ-AUTH-002)

### REQ-AUTH-003 — pessimistic rotation lock

- [x] 1.3 **Modify** `src/contexts/auth/domain/repositories/write/auth-session-write.repository.ts` — add `rotate(tokenHash, fn): Promise<RotateResult>` method signature to `IAuthSessionWriteRepository`; define `RotateResult` discriminated union in same file.
- [x] 1.4 **Modify** `src/contexts/auth/infrastructure/persistence/typeorm/repositories/auth-session-typeorm-write.repository.ts` — implement `rotate()` using `manager.transaction` + `pessimistic_write` lock; save both old (revokedAt) and new session inside the same tx. Unit test: mock `manager.transaction`; assert lock mode and both saves.
- [x] 1.5 **Modify** `src/contexts/auth/application/commands/refresh-token/refresh-token.handler.ts` — rewrite `execute()` to call `sessionRepo.rotate(hash, callback)`; move expiry/reuse domain checks into the callback; remove `TODO(ADR-5)` comment; remove separate `findByTokenHash` + `save` calls.
- [x] 1.6 **Modify** `src/contexts/auth/transport/rest/controllers/auth.controller.ts` — wrap `commandBus.execute(new RefreshTokenCommand(...))` in try/catch; on catch call `clearRefreshCookie(res)` before re-throwing. Unit test: assert cookie cleared on `InvalidRefreshTokenException` and `RefreshTokenReuseDetectedException`. (Spec REQ-AUTH-003, REQ-AUTH-004 design note on revert)

### REQ-AUTH-004 — ConfigService migration

- [x] 1.7 **Create** `src/contexts/auth/transport/shared/refresh-cookie.service.ts` — `@Injectable() RefreshCookieService` injecting `ConfigService`; exposes `setRefreshCookie(res, token)`, `clearRefreshCookie(res)`, `get cookieName()`; reads `auth.refreshCookieName`, `auth.refreshTokenTtlDays`, `app.nodeEnv`. Unit test: spy on `ConfigService.get`; assert correct cookie name and options.
- [x] 1.8 **Modify** `src/core/config/auth.config.ts` — add `oauthTokenEncKey` placeholder (`process.env.OAUTH_TOKEN_ENC_KEY`). Also add `oauthStateSecret` (`process.env.OAUTH_STATE_SECRET`). No breaking changes to existing keys.
- [x] 1.9 **Modify** `src/core/config/app.config.ts` — expose `nodeEnv: process.env.NODE_ENV ?? 'development'` so `RefreshCookieService` reads it via config.
- [x] 1.10 **Modify** `src/contexts/auth/application/commands/login-account/login-account.handler.ts` — inject `ConfigService`; replace `REFRESH_TOKEN_TTL_MS` import with `config.get<number>('auth.refreshTokenTtlDays')! * 86_400_000`.
- [x] 1.11 **Modify** `src/contexts/auth/application/commands/refresh-token/refresh-token.handler.ts` — same `ConfigService` injection; replace `REFRESH_TOKEN_TTL_MS` with config-derived value.
- [x] 1.12 **Modify** `src/contexts/auth/transport/rest/controllers/auth.controller.ts` — inject `RefreshCookieService`; replace all `setRefreshCookie`, `clearRefreshCookie`, `REFRESH_COOKIE_NAME` free-function usages with `this.cookies.*`.
- [x] 1.13 **Modify** `src/contexts/auth/auth.module.ts` — add `RefreshCookieService` to `APPLICATION_SERVICES` array; ensure `ConfigModule` is available (already imported globally — verify).
- [x] 1.14 **Delete or keep** `src/contexts/auth/application/constants/refresh-token.constants.ts` — remove `process.env` reads; retain only pure derivation helpers or delete if no consumer remains after 1.10–1.11.

---

## PR 2 — Phase 2: OAuth Foundation

### Domain layer

- [x] 2.1 **Create** `src/contexts/auth/domain/value-objects/oauth-provider/oauth-provider.vo.ts` — `OAuthProviderValueObject extends EnumValueObject`; values `google | github | apple`. Unit test: valid/invalid construction. (Spec REQ-OAUTH-003)
- [x] 2.2 **Create** `src/contexts/auth/domain/entities/oauth-identity/oauth-identity.entity.ts` — domain entity (NOT TypeORM); fields per design (`id`, `userId`, `provider`, `providerUserId`, `email`, `emailVerified`, `accessTokenEnc`, `refreshTokenEnc`, `tokenExpiresAt`, `createdAt`, `updatedAt`).
- [x] 2.3 **Create** `src/contexts/auth/domain/builders/oauth-identity.builder.ts` — `OAuthIdentityBuilder extends BaseBuilder`; no static `create()` on entity. Unit test: happy path build.
- [x] 2.4 **Create** `src/contexts/auth/domain/repositories/write/oauth-identity-write.repository.ts` — `IOAuthIdentityWriteRepository` port with `findByProviderUserId`, `findByUserId`, plus base `save`/`delete`. Define `OAUTH_IDENTITY_WRITE_REPOSITORY` symbol.
- [x] 2.5 **Create** `src/contexts/auth/domain/exceptions/oauth-identity-already-linked.exception.ts` — `OAuthIdentityAlreadyLinkedException`. (Spec REQ-OAUTH-004)
- [x] 2.6 **Create** `src/contexts/auth/domain/exceptions/oauth-email-not-verified.exception.ts` — `OAuthEmailNotVerifiedException`. (Spec REQ-OAUTH-006)
- [x] 2.7 **Create** `src/contexts/auth/domain/exceptions/oauth-state-mismatch.exception.ts` — `OAuthStateMismatchException`. (Spec REQ-OAUTH-006)

### Application port

- [x] 2.8 **Create** `src/contexts/auth/application/ports/oauth-provider.strategy.ts` — Skipped per design decision (Option B: no intermediate port). Created `oauth-user-profile.ts` with `OAuthUserProfile` type and `OAuthProviderName` union instead. Each Passport strategy (PR 3) will call `CommandBus.execute()` directly.

### Application services

- [x] 2.9 **Create** `src/contexts/auth/application/services/oauth/oauth-state.service.ts` — `OAuthStateService @Injectable()`; `issue(provider): string` signs JWT with `OAUTH_STATE_SECRET`; `verify(state, provider): StatePayload` validates signature + expiry + provider match; throws `OAuthStateMismatchException` on failure. Unit test: issue → verify roundtrip; tampered state → throws. (Spec REQ-OAUTH-006 CSRF scenario)
- [x] 2.10 **Create** `src/contexts/auth/application/services/oauth/token-encryption.service.ts` — `TokenEncryptionService @Injectable()`; `encrypt(plain): string` (AES-256-GCM, iv:authTag:ciphertext base64); `decrypt(enc): string`; key from `auth.oauthTokenEncKey`. Unit test: encrypt → decrypt roundtrip; different key → throws.

### Application commands

- [x] 2.11 **Create** `src/contexts/auth/application/commands/oauth/link-oauth-identity/link-oauth-identity.command.ts` — `LinkOAuthIdentityCommand` with `{ userId, profile: OAuthUserProfile }`.
- [x] 2.12 **Create** `src/contexts/auth/application/commands/oauth/link-oauth-identity/link-oauth-identity.handler.ts` — guard duplicate via `findByProviderUserId`; build + encrypt tokens; persist; emit `OAuthIdentityLinkedEvent`. Unit test: duplicate → throws `OAuthIdentityAlreadyLinkedException`; happy path → save called. (Spec REQ-OAUTH-004)
- [x] 2.13 **Create** `src/contexts/auth/application/commands/oauth/login-with-oauth/login-with-oauth.command.ts` — `LoginWithOAuthCommand` with `{ profile: OAuthUserProfile, deviceInfo?: string }`.
- [x] 2.14 **Create** `src/contexts/auth/application/commands/oauth/login-with-oauth/login-with-oauth.handler.ts` — orchestration per design: lookup existing identity → auto-link by verified email → provision new user; issue session (reuse `AuthSessionBuilder` flow identical to `LoginAccountCommandHandler`); guard unverified email. Unit test: returning user, new user, unverified email, email-link path. (Spec REQ-OAUTH-001, REQ-OAUTH-002, REQ-OAUTH-005)

### Infrastructure persistence

- [x] 2.15 **Create** `src/contexts/auth/infrastructure/persistence/typeorm/entities/oauth-identity.entity.ts` — `OAuthIdentityEntity` with indexes and unique constraint per design.
- [x] 2.16 **Create** `src/contexts/auth/infrastructure/persistence/typeorm/mappers/oauth-identity-typeorm.mapper.ts` — `toAggregate` (decrypt tokens) and `toEntity` (encrypt tokens via `TokenEncryptionService`). Unit test: roundtrip mapping.
- [x] 2.17 **Create** `src/contexts/auth/infrastructure/persistence/typeorm/repositories/oauth-identity-typeorm-write.repository.ts` — `OAuthIdentityTypeOrmWriteRepository` implementing `IOAuthIdentityWriteRepository`. Unit test: `findByProviderUserId` query shape.

### Database migration

- [x] 2.18 **Create** `src/database/migrations/1780000000011-CreateOAuthIdentities.ts` — raw SQL `up` creates `oauth_identities` table with all columns, FK `user_id → users(id) ON DELETE CASCADE`, unique `(provider, provider_user_id)`, index `(user_id)`; `down` drops indexes then table. (Spec REQ-OAUTH-003)

### Module wiring

- [x] 2.19 **Modify** `src/contexts/auth/auth.module.ts` — add `OAuthIdentityEntity` to `INFRASTRUCTURE_ENTITIES`; add `OAuthStateService`, `TokenEncryptionService` to `APPLICATION_SERVICES`; add `OAuthIdentityTypeOrmMapper` to `INFRASTRUCTURE_MAPPERS`; add `OAUTH_IDENTITY_WRITE_REPOSITORY` binding to `INFRASTRUCTURE_REPOSITORIES`; add `LinkOAuthIdentityCommandHandler`, `LoginWithOAuthCommandHandler` to `COMMAND_HANDLERS`.

---

## PR 3 — Phase 3: Provider Adapters

### Infrastructure strategies

- [ ] 3.1 **Install** `passport-google-oauth20`, `@types/passport-google-oauth20`, `passport-github2`, `@types/passport-github2`, `@nicokaiser/passport-apple` (or `passport-apple`) — add to `package.json`; no build step required now.
- [ ] 3.2 **Create** `src/contexts/auth/infrastructure/strategies/oauth/google-oauth.strategy.ts` — `GoogleOAuthStrategy extends PassportStrategy(Strategy, 'google') implements OAuthProviderStrategy`; reads `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` from config; `validate()` maps to `OAuthUserProfile`; injects `OAuthStateService` for state verification. Unit test: `validate()` maps profile fields correctly.
- [ ] 3.3 **Create** `src/contexts/auth/infrastructure/strategies/oauth/github-oauth.strategy.ts` — `GithubOAuthStrategy`; scope `user:email`; treat email as unverified unless GitHub marks primary+verified; `validate()` maps to `OAuthUserProfile`. Unit test: unverified-email path sets `emailVerified: false`.
- [ ] 3.4 **Create** `src/contexts/auth/infrastructure/strategies/oauth/apple-oauth.strategy.ts` — `AppleOAuthStrategy`; `response_mode=form_post`; generates ES256 client secret JWT from `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`, `APPLE_CLIENT_ID`; `validate()` maps to `OAuthUserProfile`; name/email only on first login. Unit test: client secret generation shape.
- [ ] 3.5 **Create** `src/contexts/auth/infrastructure/oauth/oauth-provider.registry.ts` — `OAuthProviderRegistry @Injectable()`; map of `OAuthProviderName → OAuthProviderStrategy` populated from injected strategy array; exposes `get(provider)`. Unit test: get known provider → returns strategy; unknown → throws.

### Guards

- [ ] 3.6 **Create** `src/contexts/auth/infrastructure/guards/dynamic-oauth.guard.ts` — `DynamicOAuthGuard`; reads `:provider` from route param; dynamically resolves `AuthGuard('google'|'github'|'apple')`; throws `BadRequestException` for unknown provider.

### Transport

- [ ] 3.7 **Create** `src/contexts/auth/transport/rest/controllers/oauth.controller.ts` — `OAuthController @Controller('auth/oauth')`; `GET :provider` (initiate, `@UseGuards(DynamicOAuthGuard)`); `GET :provider/callback` (callback, dispatches `LoginWithOAuthCommand`, sets refresh cookie via `RefreshCookieService`, redirects with access token); `POST apple/callback` (form_post variant). No business logic in controller. Unit test: callback calls `commandBus.execute(LoginWithOAuthCommand)`; sets cookie; redirects.

### Config extension

- [ ] 3.8 **Modify** `src/core/config/auth.config.ts` — add OAuth provider credential keys: `googleClientId`, `googleClientSecret`, `googleCallbackUrl`, `githubClientId`, `githubClientSecret`, `githubCallbackUrl`, `appleClientId`, `appleTeamId`, `appleKeyId`, `applePrivateKey`, `appleCallbackUrl`.

### Module wiring

- [ ] 3.9 **Modify** `src/contexts/auth/auth.module.ts` — add `GoogleOAuthStrategy`, `GithubOAuthStrategy`, `AppleOAuthStrategy` to `STRATEGIES`; add `OAuthProviderRegistry` and `DynamicOAuthGuard` to providers; add `OAuthController` to `TRANSPORT_REST_CONTROLLERS`; verify Apple POST callback route has `urlencoded` body parser available (may require `BodyParser` middleware in `main.ts`).

### Verification

- [ ] 3.10 **Verify** Apple callback route receives form-encoded POST body — check `main.ts` for `app.use(express.urlencoded(...))` or `NestExpressApplication` body parser config; add if missing. (Design open question: confirm Express `urlencoded` parsing enabled for Apple route.)
