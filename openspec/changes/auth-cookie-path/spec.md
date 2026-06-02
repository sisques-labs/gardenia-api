# Spec: auth-cookie-path

## Requirements

### R-1 — Cookie readable on all routes
The `refresh_token` cookie must be sent by the browser on every request, regardless of path, so that middleware and API routes can read it.

### R-2 — Cookie security unchanged
Changing the path must not weaken the cookie's security posture. `httpOnly`, `secure` (in production), and `sameSite: 'strict'` must remain in place.

### R-3 — Logout clears cookie correctly
`clearRefreshCookie` must use the same path (`/`) so the browser actually deletes the cookie on logout.

## Acceptance Scenarios

**S-1**: POST `/auth/login` response sets `Set-Cookie: refresh_token=...; Path=/; HttpOnly; SameSite=Strict`.

**S-2**: POST `/auth/logout` response sets `Set-Cookie: refresh_token=; Path=/; Max-Age=0` (cookie cleared).

**S-3**: Next.js middleware reads `refresh_token` from a request to `/en/home` and grants access.
