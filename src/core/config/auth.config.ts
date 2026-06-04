import { registerAs } from '@nestjs/config';

export const authConfig = registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
  refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30),
  refreshCookieName: process.env.REFRESH_COOKIE_NAME ?? 'refresh_token',
  oauthTokenEncKey: process.env.OAUTH_TOKEN_ENC_KEY,
  oauthStateSecret: process.env.OAUTH_STATE_SECRET,

  // Google OAuth
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL,

  // GitHub OAuth
  githubClientId: process.env.GITHUB_CLIENT_ID,
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
  githubCallbackUrl: process.env.GITHUB_CALLBACK_URL,

  // Apple OAuth (Sign in with Apple)
  appleClientId: process.env.APPLE_CLIENT_ID,
  appleTeamId: process.env.APPLE_TEAM_ID,
  appleKeyId: process.env.APPLE_KEY_ID,
  // Private key stored as a PEM string; literal \n sequences are normalized to newlines at use time.
  applePrivateKey: process.env.APPLE_PRIVATE_KEY,
  appleCallbackUrl: process.env.APPLE_CALLBACK_URL,
}));
