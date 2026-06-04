# Design: auth-improvement

> Technical design (the HOW at architectural level). Tasks come in the next phase.
> Architecture style preserved across all phases: **DDD + CQRS + Hexagonal**. Domain never imports infrastructure. Transport carries no logic. Each OAuth provider is an infrastructure adapter behind a domain/application port.

---

## Phase 1 — Bug Fixes

### logoutAll

**Problem.** `LogoutAllCommandHandler.execute()` calls `sessionRepo.findByCriteria(criteria)`, but the TypeORM repo implements `findByCriteria` as a **stub that always returns an empty `PaginatedResult`** (`auth-session-typeorm-write.repository.ts:36-40`). Result: `sessions` is always `[]`, the loop never runs, and logout-all is a SILENT no-op in production.

**The method already exists.** `IAuthSessionWriteRepository.revokeAllByUserId(userId: string): Promise<number>` is declared on the interface (`auth-session-write.repository.ts:10`) and correctly implemented:

```ts
async revokeAllByUserId(userId: string): Promise<number> {
  const result = await this.repo.update(
    { userId, revokedAt: IsNull() },
    { revokedAt: new Date() },
  );
  return result.affected ?? 0;
}
```

**Design — rewrite the handler to call it directly:**

```ts
async execute(command: LogoutAllCommand): Promise<void> {
  await this.sessionRepo.revokeAllByUserId(command.userId.value);
}
```

**Decisions & rationale:**
- **No per-aggregate hydrate/revoke/save loop.** A bulk `UPDATE ... WHERE userId = ? AND revokedAt IS NULL` is one statement, atomic, and O(1) round-trips. Loading N aggregates to call `.revoke()` on each is wasteful and was never working anyway.
- **Event emission trade-off.** The bulk update bypasses `AuthSessionRevokedEvent` per session. This is ACCEPTABLE: logout-all is a coarse security action; no current subscriber depends on per-session revoke events for logout-all (verify in tasks). If a future audit requirement needs per-session events, emit a single `AllSessionsRevokedEvent(userId, count)` from the handler instead of N events. Keep that out of scope here.
- Drop the unused `Criteria` import and the `findByCriteria` dependency from this handler. The stub `findByCriteria` itself stays on the repo for now (interface contract from `IBaseWriteRepository`) but is no longer on the logout-all path.

**Regression test (drives the fix):** assert `revokeAllByUserId` is called once with the command's `userId.value`; assert handler does NOT call `findByCriteria`.

---

### Cookie clear

**Problem.** `clearRefreshCookie` passes only `{ path: '/' }`:

```ts
res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });
```

Browsers only delete a cookie when the clearing `Set-Cookie` attributes **match the attributes the cookie was set with** (notably `path`, `secure`, `sameSite`, `httpOnly`, and domain). Since `setRefreshCookie` sets `httpOnly`, `secure`, `sameSite: 'strict'`, the partial clear can leave the cookie alive in strict browsers → logout appears to fail.

**Design — clear must MIRROR set, minus `maxAge`:**

```ts
export function clearRefreshCookie(res: Response): void {
  const { maxAge: _maxAge, ...clearOptions } = refreshCookieOptions();
  res.clearCookie(REFRESH_COOKIE_NAME, clearOptions);
}
```

**Decisions & rationale:**
- **Derive from `refreshCookieOptions()`** rather than duplicating the literal. Single source of truth: if set-options change (e.g. add `domain`), clear stays in sync automatically. This is the load-bearing decision — never hand-maintain two parallel option objects.
- Strip `maxAge` (irrelevant for clear; `clearCookie` sets expiry in the past). Keep `httpOnly`, `secure`, `sameSite`, `path`.
- After the ConfigService migration (below), `refreshCookieOptions()` becomes config-driven; `clearRefreshCookie` still derives from it, so no second change needed there.

---

### Refresh rotation lock

**Problem.** `RefreshTokenCommandHandler` reads the session via `findByTokenHash`, then revokes-old + creates-new in separate non-locked statements (`refresh-token.handler.ts:54-55` has the explicit `TODO(ADR-5)`). Two concurrent refresh requests carrying the SAME refresh token can both pass the `revokedAt === null` check before either writes → **double rotation, two valid new sessions** from one token. That defeats single-use rotation and reuse detection.

**Design — pessimistic write lock inside a single transaction.**

Add a transactional, locked read path to the write repository, scoped to the `auth_sessions` row for that token hash:

```ts
// IAuthSessionWriteRepository (domain port) — new method
rotate(
  tokenHash: string,
  rotate: (current: AuthSessionAggregate) => Promise<AuthSessionAggregate>,
): Promise<RotateResult>;
```

Rather than leaking TypeORM into the handler, the **repository owns the transaction + lock** (keeps the handler infra-agnostic, respects hexagonal boundaries). Infrastructure implementation:

```ts
async rotate(tokenHash, rotate) {
  return this.repo.manager.transaction(async (em) => {
    const entity = await em.findOne(AuthSessionEntity, {
      where: { tokenHash },
      lock: { mode: 'pessimistic_write' }, // SELECT ... FOR UPDATE on this row
    });
    if (!entity) return { status: 'not-found' };

    const current = this.mapper.toAggregate(entity);
    // domain decisions (revoked? expired? reuse?) handled by caller via callback,
    // new session persisted within the SAME locked tx
    const newSession = await rotate(current);
    await em.save(this.mapper.toEntity(newSession));
    await em.save(this.mapper.toEntity(current)); // persist revokedAt on old
    return { status: 'ok', oldSession: current, newSession };
  });
}
```

**Lock scope:** `pessimistic_write` (`SELECT ... FOR UPDATE`) on the single `auth_sessions` row matched by `tokenHash` (unique index `idx_auth_sessions_token_hash` already exists → exact row lock, no table scan). The second concurrent transaction blocks on the row until the first commits; when it proceeds it reads `revokedAt != null` and takes the reuse-detection branch. Only ONE rotation can succeed.

Handler keeps its domain logic (expiry check, reuse detection, build new session) but runs it inside the `rotate` callback / around the repo call. Remove the `TODO(ADR-5)` comment.

**Cookie-on-rotation-failure decision (resolves prior revert `2047b7a`):**

> **DECISION: On rotation failure (token not found, already revoked/rotated, expired, reuse detected) the server CLEARS the refresh cookie.**

Rationale:
- A failed rotation means the presented refresh token is permanently unusable. Preserving the cookie creates a confusing retry loop: client keeps sending a dead token, keeps getting `401`, never recovers without manual intervention.
- Clearing forces a clean re-login — the only correct recovery path. This also strengthens reuse-detection UX: once we revoke-all on reuse, the stale cookie is gone immediately.
- The prior commit `f21df78` did exactly this and was reverted in `2047b7a`. The revert was a PREMATURE rollback, most likely because the change shipped without test coverage and produced surprising logout behavior in manual testing. **The correct fix is to re-apply the clear AND add explicit test coverage**, not to avoid it.

Implementation point: this is a TRANSPORT concern (cookies belong to HTTP). The command handler throws the existing domain exceptions (`InvalidRefreshTokenException`, `RefreshTokenReuseDetectedException`). The `auth.controller.ts` `refresh` route catches the auth failure and calls `clearRefreshCookie(res)` before re-throwing the `401`. Do NOT move cookie logic into the handler.

```ts
@Post('refresh')
async refresh(@Req() req, @Res({ passthrough: true }) res) {
  const refreshToken = req.cookies[REFRESH_COOKIE_NAME];
  if (!refreshToken) throw new UnauthorizedException();
  try {
    const result = await this.commandBus.execute(new RefreshTokenCommand({ refreshToken }));
    setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken };
  } catch (err) {
    clearRefreshCookie(res); // rotation failed → kill the dead cookie
    throw err;
  }
}
```

**Test coverage (mandatory, the lesson from the revert):** (1) concurrent double-refresh → exactly one success, one reuse/invalid; (2) refresh route clears cookie on `InvalidRefreshTokenException`; (3) refresh route clears cookie on `RefreshTokenReuseDetectedException`.

---

### ConfigService migration

**Problem.** `refresh-token.constants.ts` reads `process.env.REFRESH_TOKEN_TTL_DAYS` / `REFRESH_COOKIE_NAME` at module-load time. This violates the success criterion "no direct `process.env`" and makes values un-overridable per environment via the existing `auth.config.ts` (`registerAs('auth', ...)` already exposes `refreshTokenTtlDays` and `refreshCookieName`).

**Design — route through `ConfigService`, keep the cookie helper as pure functions parameterized by config.**

1. **Source of truth:** `auth.config.ts` already has the keys. No new config file. Add `refreshTokenTtlMs` derivation there OR compute in the helper from `refreshTokenTtlDays`.

2. **Make the cookie helper config-aware.** Today `cookie.helper.ts` exports standalone functions and re-exports the constant. Convert the two consumers (login/refresh use `REFRESH_TOKEN_TTL_MS`; controller uses `REFRESH_COOKIE_NAME`) to pull from config. Two acceptable shapes — pick the **CookieService** option:

   - **Chosen: a small `RefreshCookieService` (transport-layer, `@Injectable`)** that injects `ConfigService` and exposes `setRefreshCookie(res, token)`, `clearRefreshCookie(res)`, and `cookieName`. The controller injects it instead of importing free functions. This removes module-load-time `process.env` reads and centralizes cookie attributes.

   ```ts
   @Injectable()
   export class RefreshCookieService {
     private readonly name: string;
     private readonly ttlMs: number;
     private readonly secure: boolean;
     constructor(config: ConfigService) {
       this.name = config.get<string>('auth.refreshCookieName')!;
       this.ttlMs = config.get<number>('auth.refreshTokenTtlDays')! * 86_400_000;
       this.secure = config.get<string>('app.nodeEnv') === 'production';
     }
     private options(): CookieOptions { /* httpOnly, secure, sameSite:'strict', path:'/', maxAge:this.ttlMs */ }
     setRefreshCookie(res: Response, token: string) { res.cookie(this.name, token, this.options()); }
     clearRefreshCookie(res: Response) { const { maxAge, ...o } = this.options(); res.clearCookie(this.name, o); }
     get cookieName() { return this.name; }
   }
   ```

3. **TTL in handlers.** `LoginAccountCommandHandler` and `RefreshTokenCommandHandler` currently import `REFRESH_TOKEN_TTL_MS`. Inject `ConfigService` (or a tiny `RefreshTokenConfig` provider) and read `auth.refreshTokenTtlDays * 86_400_000`. Remove the `process.env` read from `refresh-token.constants.ts`; keep the file only if a pure derivation helper is still useful, otherwise delete and inline.

4. **`secure` flag.** `refreshCookieOptions()` reads `process.env.NODE_ENV` directly — also migrate to config (`app.config.ts`). Register `RefreshCookieService` in `auth.module.ts` providers; export it if any other context needs it (none today).

**Rationale:** keeps `process.env` access at the config-loading boundary (`registerAs`) only; everything downstream is injected. Aligns with the existing `JwtModule.registerAsync` + `JwtStrategy` pattern already using `ConfigService`.

---

## Phase 2 — OAuth Foundation

### OAuthProviderStrategy port

**Where it lives:** **`application/`** — `src/contexts/auth/application/ports/oauth-provider.strategy.ts`. Rationale: this port describes an outbound integration capability (talk to an external IdP), which is an application-orchestration concern, not a pure domain invariant. The domain stays free of OAuth-flow vocabulary (`code`, `state`, `accessToken`). Each concrete Passport strategy in `infrastructure/` implements it.

```ts
export const OAUTH_PROVIDER_REGISTRY = Symbol('OAUTH_PROVIDER_REGISTRY');

export type OAuthProviderName = 'google' | 'github' | 'apple';

export interface OAuthUserProfile {
  provider: OAuthProviderName;
  providerUserId: string;        // stable subject id from the IdP
  email: string | null;          // may be null (e.g. GitHub no public email, Apple relay)
  emailVerified: boolean;        // provider-asserted verification
  displayName: string | null;
  rawTokens: {                   // provider OAuth tokens (encrypted before persistence)
    accessToken: string;
    refreshToken: string | null;
    expiresAt: Date | null;
  };
}

export interface OAuthProviderStrategy {
  readonly provider: OAuthProviderName;
  /** Build the IdP authorization URL (initiate redirect). */
  getAuthorizationUrl(state: string): string;
  /** Exchange the callback code for a normalized profile. */
  exchangeCode(code: string, state: string): Promise<OAuthUserProfile>;
}
```

A `OAuthProviderRegistry` (injectable map keyed by `OAuthProviderName`) resolves the right adapter at runtime so the controller and command handlers stay provider-agnostic. The map is populated from the array of registered strategy adapters.

**Note on Passport reality:** with `@nestjs/passport`, the redirect + code-exchange are largely handled by the Passport `AuthGuard('<provider>')` + the strategy's `validate()` callback. The port above is the DOMAIN-FACING contract; the Passport strategy class implements both the Passport `validate()` (producing `OAuthUserProfile`) and this port. Where Passport already owns the exchange, `exchangeCode` may delegate to Passport internals — the port still gives application code a stable, testable seam and keeps adapters swappable (the risk-table requirement).

---

### OAuthIdentity model

**Decision: ENTITY, not a value object.** It has its own identity (`id`), independent lifecycle (created on first OAuth login, can be unlinked/deleted), and mutable fields (rotating provider tokens). Value objects are immutable and identity-less — wrong fit here. It is a child of the account/user, but distinct enough to be its own persisted entity within the auth context.

**Where it lives:** new folder `src/contexts/auth/domain/entities/oauth-identity/oauth-identity.entity.ts` (domain entity, NOT the TypeORM entity — that lives in infrastructure). Its primitive-typed fields use small value objects where they already pay off; `OAuthIdentity` itself is the aggregate-internal entity.

**Fields:**

| Field | Type | Notes |
|-------|------|-------|
| `id` | `UuidValueObject` | own identity |
| `userId` | `UuidValueObject` | links to the platform user (same `userId` that `accounts` and `auth_sessions` key on — see FK decision) |
| `provider` | `OAuthProviderValueObject` (extends `EnumValueObject`) | `google` \| `github` \| `apple` |
| `providerUserId` | `StringValueObject` | stable subject id from IdP |
| `email` | `AccountEmailValueObject \| null` | provider email at link time |
| `emailVerified` | `boolean` | |
| `accessTokenEnc` | `string \| null` | ENCRYPTED provider access token |
| `refreshTokenEnc` | `string \| null` | ENCRYPTED provider refresh token |
| `tokenExpiresAt` | `Date \| null` | |
| `createdAt` / `updatedAt` | `DateValueObject` | |

New value object: `OAuthProviderValueObject extends EnumValueObject` in `domain/value-objects/oauth-provider/`. Constructed via an `OAuthIdentityBuilder extends BaseBuilder` (project convention — no static `create()`).

---

### oauth_identities table

**FK target decision — link on `userId`, NOT `accounts.id`.** Critical grounding fact discovered in code: `accounts` has a generated PK `id` AND a separate `userId` column; `auth_sessions.userId` references the platform **user**, not `accounts.id`. To stay consistent with how sessions key identity, `oauth_identities.user_id` references the **user** (`users` table). A user may have NO local `accounts` row (pure-OAuth signup, no password) — so keying on `accounts.id` would be wrong and would block password-less social signups. FK → `users(id) ON DELETE CASCADE`.

**TypeORM entity** (`infrastructure/persistence/typeorm/entities/oauth-identity.entity.ts`):

```ts
@Entity('oauth_identities')
@Index('idx_oauth_identities_user_id', ['userId'])
@Unique('uq_oauth_identities_provider_user', ['provider', 'providerUserId'])
export class OAuthIdentityEntity {
  @PrimaryColumn({ type: 'uuid' }) id!: string;
  @Column({ name: 'user_id', type: 'uuid' }) userId!: string;
  @Column({ type: 'varchar', length: 16 }) provider!: string; // google|github|apple
  @Column({ name: 'provider_user_id', type: 'varchar', length: 255 }) providerUserId!: string;
  @Column({ type: 'varchar', length: 320, nullable: true }) email!: string | null;
  @Column({ name: 'email_verified', type: 'boolean', default: false }) emailVerified!: boolean;
  @Column({ name: 'access_token_enc', type: 'text', nullable: true }) accessTokenEnc!: string | null;
  @Column({ name: 'refresh_token_enc', type: 'text', nullable: true }) refreshTokenEnc!: string | null;
  @Column({ name: 'token_expires_at', type: 'timestamp', nullable: true }) tokenExpiresAt!: Date | null;
  @CreateDateColumn({ type: 'timestamp' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamp' }) updatedAt!: Date;
}
```

**Constraints & indexes:**
- `UNIQUE(provider, provider_user_id)` — one identity per (provider, subject). Prevents duplicate links and is the lookup key for `LoginWithOAuth`.
- `INDEX(user_id)` — list/lookup a user's linked identities; supports cascade.
- FK `user_id → users(id) ON DELETE CASCADE`.
- Consider a partial unique on `(user_id, provider)` if product wants "one google per user". Default: allow it via the `(provider, provider_user_id)` unique only. Decide in tasks/spec.

**Migration file:** `src/database/migrations/<timestamp>-CreateOAuthIdentities.ts` (class `CreateOAuthIdentities<timestamp>`), following the raw-SQL `up`/`down` style of `1779953632660-CreateAuthSessions.ts`. `down` drops indexes then table.

Register `OAuthIdentityEntity` in `auth.module.ts` `INFRASTRUCTURE_ENTITIES` and `TypeOrmModule.forFeature`.

---

### Command handlers

Two new handlers under `application/commands/oauth/`, each behind `CommandBus.execute()` (transport never injects services directly).

**1. `LoginWithOAuthCommand` → `login-with-oauth/`**

- **Input:** `{ profile: OAuthUserProfile, deviceInfo?: string }` (the normalized profile produced by the strategy adapter).
- **Output:** `{ accessToken: string; refreshToken: string }` (same shape as password login — reuses session issuance).
- **Repos:** `IOAuthIdentityWriteRepository` (new), `IAccountWriteRepository` (read by email/userId), `IAuthSessionWriteRepository`.
- **Orchestration:**
  1. `oauthIdentityRepo.findByProviderUserId(provider, providerUserId)`.
  2. If found → resolve its `userId`. Go to step 5.
  3. If NOT found → attempt account linking by **verified** email: `accountRepo.findByEmail(profile.email)` only when `profile.emailVerified === true`. If a user exists → create a new `OAuthIdentity` linked to that `userId` (auto-link). If `emailVerified === false` → DO NOT auto-link (hijack risk from risk table) → either reject or route to explicit-link flow.
  4. If no existing user → provision a new user + (optional) account, persist new `OAuthIdentity`. (User provisioning reuses existing user-context flow; exact call resolved in tasks.)
  5. Issue session: generate refresh token, hash, build `AuthSessionAggregate` via `AuthSessionBuilder`, `session.create()`, save, `publishEvents`. Sign JWT via `TokenService`. Return tokens. (This is the SAME issuance block as `LoginAccountCommandHandler` — extract a shared `IssueSessionService` to avoid duplication; decide in tasks.)

**2. `LinkOAuthIdentityCommand` → `link-oauth-identity/`**

- **Input:** `{ userId: string, profile: OAuthUserProfile }` (authenticated user explicitly linking a provider).
- **Output:** `void` (or the created identity id).
- **Repos:** `IOAuthIdentityWriteRepository`.
- **Orchestration:**
  1. Guard: `findByProviderUserId` — if it exists and belongs to ANOTHER user → throw `OAuthIdentityAlreadyLinkedException`.
  2. Build `OAuthIdentity` (encrypt tokens via `TokenEncryptionService`), persist.
  3. Emit `OAuthIdentityLinkedEvent` (optional, for audit).

New domain port `IOAuthIdentityWriteRepository` in `domain/repositories/write/oauth-identity-write.repository.ts`:

```ts
findByProviderUserId(provider: string, providerUserId: string): Promise<OAuthIdentity | null>;
findByUserId(userId: string): Promise<OAuthIdentity[]>;
// + save / delete from IBaseWriteRepository
```

New exceptions (domain): `OAuthIdentityAlreadyLinkedException`, `OAuthEmailNotVerifiedException`, `OAuthStateMismatchException`.

---

### State management (CSRF)

**Decision: signed, short-lived JWT as the OAuth `state` parameter. NO server-side store.**

Rationale for THIS project's infra:
- There is **no Redis/cache module provisioned** in the codebase today. Introducing one solely for OAuth state is operational overhead the project explicitly wants to avoid (proposal: "zero new SaaS/vendor dependency", "self-hosted, simple").
- A DB record per initiate adds write churn and cleanup cron for a value that lives ~60s.
- A **stateless signed JWT** is the standard, simplest CSRF-safe approach: the server already has `JwtModule` + `JWT_SECRET` wired. The `state` JWT carries `{ nonce, provider, redirectTo?, iat, exp(60-120s) }`, signed with the existing secret (or a dedicated `OAUTH_STATE_SECRET` — preferred to isolate from the auth JWT). On callback, verify signature + expiry + provider match; reject on failure with `OAuthStateMismatchException` (→ `401/400`).

**Generation/verification:** a small `OAuthStateService` (application service) with `issue(provider): string` and `verify(state, provider): StatePayload`. Lives in `application/services/oauth/`. The initiate route issues; the callback route verifies BEFORE invoking the login command.

**Trade-off acknowledged:** stateless state cannot be single-use-revoked server-side; the short TTL (~90s) bounds the replay window acceptably for login initiation. If product later needs strict single-use, upgrade to a DB-backed nonce table — additive, no redesign.

---

### Token storage

**Decision: store provider `access_token` / `refresh_token` ENCRYPTED at rest, using Node's built-in `crypto` (AES-256-GCM) behind a small `TokenEncryptionService`. No external KMS, no extra package.**

Rationale:
- Provider tokens are sensitive credentials; plaintext at rest is unacceptable even if we rarely use them.
- We do NOT currently need provider tokens for ongoing API calls (login only). So a defensible alternative is **don't store them at all** (drop the columns). BUT keeping them encrypted preserves the option to call provider APIs later (e.g. fetch avatar, refresh profile) without re-consent — low cost, columns are nullable.
- **Keep it simple:** Node `crypto` `createCipheriv('aes-256-gcm', key, iv)`; key from `config.get('auth.oauthTokenEncKey')` (32-byte, base64 env var). Store `iv:authTag:ciphertext` (base64) in the `*_enc` text columns. No third-party crypto lib — built-in is sufficient and audited.
- `TokenEncryptionService` (application service, `application/services/oauth/token-encryption.service.ts`): `encrypt(plain): string`, `decrypt(enc): string`. Mapper encrypts on `toEntity`, decrypts lazily on read only when needed.

**If product confirms provider tokens are never reused → simplest path: DROP the token columns entirely.** Default design keeps them encrypted-nullable; flag this as the one open product question for the spec.

---

## Phase 3 — Provider Adapters

### Package choices

| Provider | Package | NestJS compat | Gotchas |
|----------|---------|---------------|---------|
| Google | `passport-google-oauth20` | ✅ wraps cleanly with `@nestjs/passport` `PassportStrategy(Strategy, 'google')` | Standard OAuth2/OIDC. Request `scope: ['email','profile']`. `email_verified` present in profile. |
| GitHub | `passport-github2` | ✅ same pattern, name `'github'` | Email may be private → request `scope: ['user:email']` and read `profile.emails`; may need a `/user/emails` call. No reliable `email_verified` → treat as unverified unless GitHub marks primary+verified → do NOT auto-link on unverified. |
| Apple | `@nicokaiser/passport-apple` or `passport-apple` | ⚠️ usable but the most fragile | **Different flow:** Apple uses `response_mode=form_post` → the callback is a **POST**, not GET. Client secret is a **JWT signed with an ES256 `.p8` key** that EXPIRES (max 6 months) → must be regenerated/rotated; generate it from config (`APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`, `APPLE_CLIENT_ID`). Name/email returned **only on first authorization** → must persist on first link. Email may be a **private relay** address; `email_verified` is a string `"true"`. |

All three are isolated adapters implementing `OAuthProviderStrategy` — per the risk table, each is independently swappable. Add `@types/passport-*` where shipped.

### File structure

```
src/contexts/auth/
├─ application/
│  ├─ ports/oauth-provider.strategy.ts            # OAuthProviderStrategy port + types
│  ├─ commands/oauth/
│  │  ├─ login-with-oauth/{login-with-oauth.command.ts, .handler.ts}
│  │  └─ link-oauth-identity/{link-oauth-identity.command.ts, .handler.ts}
│  └─ services/oauth/
│     ├─ oauth-state.service.ts
│     └─ token-encryption.service.ts
├─ domain/
│  ├─ entities/oauth-identity/oauth-identity.entity.ts
│  ├─ value-objects/oauth-provider/oauth-provider.vo.ts
│  ├─ builders/oauth-identity.builder.ts
│  ├─ repositories/write/oauth-identity-write.repository.ts
│  └─ exceptions/{oauth-identity-already-linked.exception.ts, oauth-email-not-verified.exception.ts, oauth-state-mismatch.exception.ts}
├─ infrastructure/
│  ├─ strategies/oauth/
│  │  ├─ google-oauth.strategy.ts                 # implements OAuthProviderStrategy + PassportStrategy('google')
│  │  ├─ github-oauth.strategy.ts                 # 'github'
│  │  └─ apple-oauth.strategy.ts                  # 'apple' (form_post)
│  ├─ oauth/oauth-provider.registry.ts            # name → strategy map
│  └─ persistence/typeorm/
│     ├─ entities/oauth-identity.entity.ts
│     ├─ mappers/oauth-identity-typeorm.mapper.ts
│     └─ repositories/oauth-identity-typeorm-write.repository.ts
└─ transport/rest/controllers/oauth.controller.ts
```

Naming follows project conventions: `{verb}-{name}.command.ts`, `{reason}.exception.ts`, `{name}.value-object.ts` (here `.vo.ts` matching existing files), aggregates/entities built via `{Name}Builder extends BaseBuilder`.

### Callback routes

**Decision: REST-ONLY.** OAuth requires browser 302 redirects to the IdP and back; GraphQL has no transport model for redirects. New `OAuthController` at `@Controller('auth/oauth')`, registered in `auth.module.ts` `TRANSPORT_REST_CONTROLLERS`. Carries NO business logic — Passport guards + `CommandBus` only.

```ts
@ApiTags('auth-oauth')
@Controller('auth/oauth')
export class OAuthController {
  constructor(private readonly commandBus: CommandBus,
              private readonly cookies: RefreshCookieService) {}

  // 1) Initiate — redirects browser to the provider
  @Get(':provider')
  @SkipSpace()
  @UseGuards(DynamicOAuthGuard)   // selects AuthGuard('google'|'github'|'apple') by :provider; sets state
  initiate(): void { /* Passport guard performs the 302; body never runs */ }

  // 2) Callback — provider redirects back here
  @Get(':provider/callback')      // Apple uses @Post(':provider/callback') — separate route/guard
  @SkipSpace()
  @UseGuards(DynamicOAuthGuard)   // guard's validate() yields OAuthUserProfile on req.user
  async callback(@Req() req, @Res({ passthrough: true }) res, @Param('provider') provider) {
    // state already verified by guard/strategy; profile normalized to OAuthUserProfile
    const profile = req.user as OAuthUserProfile;
    const { accessToken, refreshToken } =
      await this.commandBus.execute(new LoginWithOAuthCommand({ profile, deviceInfo: req.headers['user-agent'] }));
    this.cookies.setRefreshCookie(res, refreshToken);
    // redirect back to SPA with the access token (fragment or short-lived handoff), or return JSON
    return res.redirect(`${frontendUrl}/auth/callback#access_token=${accessToken}`);
  }
}
```

**Apple specialization:** because Apple posts back (`response_mode=form_post`), expose `@Post(':provider/callback')` (or a dedicated `@Post('apple/callback')`) — needs the raw body parser path verified (proposal flagged Better Auth's body-parser breakage as a reason it was rejected; confirm Express `urlencoded` parsing is enabled for this route in tasks).

**State wiring:** the initiate guard injects `OAuthStateService.issue(provider)` into the Passport `state` option; the callback strategy verifies it via `OAuthStateService.verify`. Explicit-link flow (authenticated user) reuses the same routes guarded additionally by `JwtAuthGuard`/`@IdentityOnly()`, dispatching `LinkOAuthIdentityCommand` instead of `LoginWithOAuthCommand` — exact route split decided in tasks (e.g. `/auth/oauth/:provider/link`).

---

## ADR Summary (decisions & rejected alternatives)

| # | Decision | Rejected alternative | Why |
|---|----------|----------------------|-----|
| 1 | logout-all calls `revokeAllByUserId` (bulk UPDATE) | hydrate-loop-revoke-save via `findByCriteria` | stub returns empty → silent no-op; bulk is atomic + cheap |
| 2 | clear cookie derives options from `refreshCookieOptions()` minus maxAge | hand-maintained literal | browsers need matching attrs; single source of truth |
| 3 | rotation uses `pessimistic_write` row lock in repo-owned tx | optimistic version / app-level mutex / no lock | exact-row `SELECT FOR UPDATE`, serializes concurrent refresh, keeps handler infra-agnostic |
| 4 | CLEAR cookie on rotation failure | preserve cookie (the `2047b7a` revert) | preserving causes 401 retry loop; clear forces clean re-login; add tests this time |
| 5 | config via `ConfigService` + `RefreshCookieService` | module-load `process.env` constants | env access only at config boundary; matches Jwt pattern |
| 6 | `OAuthProviderStrategy` port in `application/ports/` | port in `domain/` | OAuth-flow vocabulary is integration, not domain invariant |
| 7 | `OAuthIdentity` is an ENTITY | value object | has id, lifecycle, mutable tokens |
| 8 | `oauth_identities.user_id` FK → `users(id)` | FK → `accounts.id` | sessions key on userId; password-less OAuth users have no account row |
| 9 | OAuth `state` = signed short-lived JWT, stateless | Redis / DB nonce | no cache infra provisioned; JwtModule already wired; ~90s TTL bounds replay |
| 10 | provider tokens encrypted (AES-256-GCM, Node crypto) | plaintext / external KMS / drop columns | sensitive at rest; built-in crypto is enough; nullable preserves future use |
| 11 | callbacks REST-only | GraphQL | GraphQL can't do 302 redirects |
| 12 | Apple callback is POST (`form_post`), ES256 `.p8` JWT secret | treat like Google GET | Apple's flow genuinely differs; ignoring it breaks the integration |

## Open questions for spec/tasks
- Per-session vs single aggregate event on logout-all (audit need?).
- Keep encrypted provider tokens vs drop columns (are they ever reused?).
- User provisioning path for brand-new OAuth signups (which existing user-context flow to call).
- `(user_id, provider)` uniqueness — allow multiple of same provider per user?
- Explicit-link route shape (`/auth/oauth/:provider/link`) and its guard.
