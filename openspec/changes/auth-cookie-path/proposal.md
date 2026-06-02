# Proposal: auth-cookie-path

## Intent

The `refresh_token` cookie was set with `path: '/auth'`, restricting the browser to only send it on requests to `/auth/*`. This made the cookie invisible to the Next.js middleware, which runs on routes like `/en/home` — causing the middleware to treat authenticated users as unauthenticated and redirect them to login.

## Root Cause

`cookie.helper.ts` `refreshCookieOptions()` hardcoded `path: '/auth'`. Security rationale was least-privilege scoping, but the cookie is already protected by `httpOnly: true` + `sameSite: 'strict'`, which neutralise XSS and CSRF respectively. The path restriction provided negligible additional security at the cost of breaking the auth flow.

## Fix

Change `path: '/auth'` to `path: '/'` in both `setRefreshCookie` and `clearRefreshCookie`.

## Scope

- `src/contexts/auth/transport/shared/cookie.helper.ts`
