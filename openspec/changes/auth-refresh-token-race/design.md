# Design: auth-refresh-token-race

## 1. Current mechanics (for reference)

`AuthSessionAggregate` (`domain/aggregates/auth-session.aggregate.ts`) has no
link between a revoked session and whatever replaced it — just `revokedAt`.
`RefreshTokenCommandHandler.execute` (`refresh-token.handler.ts:49-114`):

1. Hashes the presented token.
2. Calls `sessionRepo.rotate(hash, callback)`, which loads the session by
   `tokenHash`, and inside a transaction:
   - if `revokedAt !== null` → `markReuseDetected()` +
     `revokeAllByUserId(userId)` + throw `RefreshTokenReuseDetectedException`.
   - else if expired → throw `InvalidRefreshTokenException`.
   - else → `current.revoke('rotation')`, builds a brand-new
     `AuthSessionAggregate` with a new hash, returns it.
3. Signs a new access token, returns `{ accessToken, refreshToken: newToken }`
   (plaintext `newToken` exists only in this response — never persisted).

The plaintext new refresh token is generated once, returned once, and only
its hash is ever persisted (`hash-refresh-token.service.ts`). This is why a
"replay this exact response" fix is not on the table: nothing durable holds
the plaintext to hand back to a second requester.

## 2. Storage decision — link revoked session to its successor

Add a nullable `replacedBySessionId` (uuid, FK to `auth_sessions.id`) to
`auth_sessions`, set **only** in the rotation branch (`current.revoke(...)`
followed by creating `newSession`) — never set when revoking via logout or
via `revokeAllByUserId` (theft response). This single column is what lets the
handler distinguish "this hash was revoked because it was rotated a moment
ago" (recoverable) from "this hash was revoked for any other reason"
(not recoverable — current behavior stands).

Rejected alternative: a separate `token_rotations` audit table. More
normalized, but this change needs exactly one FK lookup, not a history API;
the extra table and join would be unused complexity. If a future change wants
full rotation history for audit/security dashboards, that table can be added
then without touching this design.

`AuthSessionAggregate` gains:
- `private _replacedBySessionId: string | null`
- `revoke(reason: string, replacedBySessionId?: string)` — sets it when
  provided.
- getter `replacedBySessionId`.

## 3. Handler logic — the grace branch

```
if (current.revokedAt !== null) {
  const graceMs = configService.get<number>('auth.refreshReuseGraceMs');
  const withinGrace = Date.now() - current.revokedAt.getTime() <= graceMs;

  if (withinGrace && current.replacedBySessionId) {
    const successor = await sessionRepo.findById(current.replacedBySessionId);

    // Successor must still be the *current* valid tip of the chain — if it
    // has itself already been rotated or revoked, this is a second replay
    // (or an old, already-superseded generation), not a benign one-hop race.
    if (successor && successor.revokedAt === null) {
      return rotateFrom(successor); // same rotation logic as the happy path,
                                     // starting from `successor` instead of `current`
    }
  }

  // Not recoverable: real reuse (no successor, successor already consumed,
  // or outside the grace window).
  current.markReuseDetected();
  await sessionRepo.revokeAllByUserId(current.userId.value);
  await publishEvents(current);
  throw new RefreshTokenReuseDetectedException();
}
```

`rotateFrom(successor)` is the existing rotate-and-issue logic, refactored
into a small private method so both the happy path (`current` valid) and the
grace path (`successor` valid) share it — no duplicated token-generation
code.

**Why "successor must still be unrevoked" caps this at one hop:** if a third
racing request presents the *original* (two-generations-back) token, its
`current.replacedBySessionId` points at a session that has, by now, itself
been revoked (rotated again by whichever of the first two requests landed
second). `successor.revokedAt !== null` → falls through to the existing
revoke-all path. This matches the proposal's explicit constraint: grace only
ever forgives **one** racing duplicate, not a chain of them. A third
concurrent replay of the same original hash is treated as reuse, same as
today.

**Why not just "extend validity" instead of a replacedBy link:** an earlier
idea considered was making refresh tokens valid for `graceMs` after rotation
(i.e., don't revoke immediately, revoke lazily). Rejected: it reopens a
window where the token is simultaneously "spent" and "still acceptable" for
any caller, not just a genuine one-hop race, which is a strictly weaker
invariant than the replacedBy-chain approach (which requires proving a
concrete, already-completed rotation happened, not just that time hasn't run
out).

## 4. Client-side coordination (gardenia-web — tracked separately)

This change is self-sufficient (the server no longer punishes a benign race),
but the ideal fix also reduces how often the race happens at all. Recommended
shape for a follow-up gardenia-web change, for whoever picks it up:

- Wrap the actual `doRefresh()` network call in the **Web Locks API**
  (`navigator.locks.request('gardenia-auth-refresh', async () => ...)`) so
  that of N tabs racing to refresh, only one performs the request; the rest
  await the same OS-level lock instead of firing their own request.
- Once the lock-holding tab gets a new access token, broadcast it to sibling
  tabs via `BroadcastChannel('gardenia-auth')` so they adopt it instead of
  each independently calling `/auth/refresh` after the lock releases (which
  would still work correctly thanks to this change, but wastes a rotation
  and a round trip per tab).
- Fallback for browsers without Web Locks (rare in evergreen browsers today):
  keep today's per-tab `refresh-mutex.ts` as-is — cross-tab races still land
  safely on the server-side grace window from this change, just without the
  network-call savings.
- This is intentionally NOT part of this change's task list — it lives in
  gardenia-web, has its own test surface (Vitest + jsdom's `BroadcastChannel`/
  `navigator.locks` mocking), and should be scoped and reviewed independently.

## 5. Observability

Log (structured, `Logger` at `RefreshTokenCommandHandler` scope) whenever the
grace branch is taken: `userId`, old/new session ids, and the elapsed ms since
rotation. This is the signal to watch after shipping — if it fires far more
than "a handful of times per active multi-tab user," that points at a
different bug (e.g. a client retry loop) rather than ordinary tab races.
