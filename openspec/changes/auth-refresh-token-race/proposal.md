# Proposal: auth-refresh-token-race

## Intent

Users report that the app "doesn't remember the session" — they get bounced
back to `/login` even though they were previously authenticated and their
refresh cookie should still be valid.

Root cause: the refresh-token rotation scheme is strict single-use with
**immediate, unconditional reuse detection**
(`RefreshTokenCommandHandler.execute`,
`src/contexts/auth/application/commands/refresh-token/refresh-token.handler.ts:64-94`).
The very first time the *same* refresh token is presented twice —
for any reason, not just theft — the handler revokes **every session the user
has** (`sessionRepo.revokeAllByUserId`), and the client's next request fails
with `RefreshTokenReuseDetectedException`.

Two legitimate (non-malicious) situations reliably trigger this today:

1. **Multiple browser tabs.** The web app's client-side dedupe
   (`refresh-mutex.ts` in gardenia-web) is a module-level variable, scoped to
   a single JS execution context — i.e. a single tab. It does nothing to
   coordinate refresh calls made from two tabs of the same browser. If two
   tabs' access tokens expire close together, both can issue `POST
   /auth/refresh` with the same cookie value before either rotation lands.
2. **Any client-side retry/duplicate request** (network layer retry, double
   navigation, back-forward cache replay) that resends a refresh call whose
   response was lost or delayed.

In both cases there was no theft — just an ordinary race — but the user pays
for it with a hard logout, sometimes on every device, because
`revokeAllByUserId` is global to the user, not to the session/device that
raced.

## Scope

### In Scope

- **`RefreshTokenCommandHandler`** (`refresh-token.handler.ts`): introduce a
  short **reuse grace window**. If the presented (already-rotated) refresh
  token hash was revoked *by rotation* (not by explicit logout or prior
  theft-detection) within the last `N` seconds, and this is the first replay
  of that specific hash, treat it as a benign race: rotate again from the
  **successor session** (the one the winning request already obtained) and
  return a fresh, valid token pair — instead of raising
  `RefreshTokenReuseDetectedException`. The two racing requests end up with
  two different, both-valid sessions (not an identical replayed pair — the
  original plaintext token was only ever returned once, to the winner).
  Outside the grace window, or on a second replay of the same hash, current
  behavior (revoke-all) is unchanged.
- **`AuthSessionAggregate`** / session persistence: link a revoked-by-rotation
  session to the session it was rotated into (`replacedBySessionId`), so the
  handler can answer "was this hash revoked by rotation, when, and which
  session replaced it?" (see design.md for the exact shape).
- Config: grace window duration, via `auth.refreshReuseGraceMs` /
  `REFRESH_REUSE_GRACE_MS` env var (default proposed: 10 000 ms).
- Unit tests for the handler covering: normal rotation, replay within grace
  window (idempotent success), replay outside grace window (existing
  revoke-all behavior), second replay within grace window (treated as real
  reuse — see design.md §3 for why a single idempotent replay is the limit).
- Integration test proving concurrent `POST /auth/refresh` calls with the
  same cookie do not both fail and do not revoke the user's other sessions.
- Update `src/contexts/auth/README.md` to document the grace-window
  behavior as part of the session/rotation model.

### Out of Scope (explicit)

- Any change to the **web client** (gardenia-web). The cross-tab race is
  best fixed on both ends; the client-side mitigation (serializing refresh
  calls across tabs via the Web Locks API, sharing the resulting access
  token via `BroadcastChannel`) is tracked as a **separate, coordinated
  change in gardenia-web** — see design.md §4 for the recommended shape,
  which the web team/session should turn into its own openspec proposal.
  This change stands alone as defense-in-depth even if the client-side fix
  ships later or never ships (e.g. unsupported browser falls back to
  today's behavior, now safety-netted by the grace window).
- Widening the grace window into a general "refresh token is valid for N
  extra seconds after rotation" policy — the grace window only ever answers
  a replay of the *immediately preceding* hash, never older generations.
- Any change to access-token TTL, OAuth flows, or device/session management
  UI.
- Rate limiting on `/auth/*` endpoints (separate, already-flagged tech debt
  item — no rate limiting exists today; not addressed here to keep this
  change focused).

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Grace window weakens genuine theft detection (attacker replays a stolen token within the window and gets a valid pair back) | Low | Med | Window is short (default 10s) and single-use: the *second* replay of the same hash, even inside the window, still triggers revoke-all (design.md §3). An attacker racing a legitimate rotation within 10s is a materially narrower threat model than today's "any 2 requests, ever" trigger, and matches the reuse-interval pattern used by Auth0/other refresh-rotation implementations. |
| Grace window masks a real bug elsewhere that causes duplicate refresh calls | Low | Low | Add structured logging when the grace path is taken, so recurring hits are visible and investigable rather than silently normalized. |
| Session/hash bookkeeping adds persistence complexity | Med | Low | Reuse the existing revoked-session row rather than a new table — see design.md §2 for the storage decision. |

## Rollback Plan

Purely additive: a new conditional branch in one command handler plus a
config value. No schema-breaking change (see design.md for whether a column
is needed). Revert = revert the branch / set
`REFRESH_REUSE_GRACE_MS=0` to restore today's zero-tolerance behavior without
a code rollback.

## Success Criteria

- [ ] Two concurrent `/auth/refresh` requests with the same valid refresh
      cookie both succeed (each with its own valid new token pair); the
      user's other sessions are NOT revoked.
- [ ] A refresh token replayed a *second* time (three total presentations of
      the same hash) still triggers reuse detection and revokes all
      sessions — grace only tolerates exactly one racing duplicate.
- [ ] A refresh token replayed after the grace window has elapsed still
      triggers today's behavior unchanged.
- [ ] `auth_sessions` behavior documented in `src/contexts/auth/README.md`.
- [ ] Unit + integration tests green; coverage ≥ 80%.
