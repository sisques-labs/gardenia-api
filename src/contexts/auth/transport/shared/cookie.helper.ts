import { Response, CookieOptions } from 'express';

import {
  REFRESH_COOKIE_NAME,
  REFRESH_TOKEN_TTL_MS,
} from '@contexts/auth/application/constants/refresh-token.constants';

export { REFRESH_COOKIE_NAME };

export function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: REFRESH_TOKEN_TTL_MS,
  };
}

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, refreshCookieOptions());
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });
}
