import { registerAs } from '@nestjs/config';

export const authConfig = registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
  refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30),
  refreshCookieName: process.env.REFRESH_COOKIE_NAME ?? 'refresh_token',
  oauthTokenEncKey: process.env.OAUTH_TOKEN_ENC_KEY,
  oauthStateSecret: process.env.OAUTH_STATE_SECRET,
}));
