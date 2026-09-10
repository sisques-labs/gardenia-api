import { ConfigType, registerAs } from '@nestjs/config';

/**
 * Sisques Account (the platform) dual-issuer connection settings.
 *
 * Platform-token acceptance is **opt-in** via `SISQUES_ACCOUNT_AUTH_ENABLED`
 * so the JWKS strategy can be disabled without a code change (P1 rollback).
 */
export const sisquesAccountConfig = registerAs('sisquesAccount', () => ({
  authEnabled: process.env.SISQUES_ACCOUNT_AUTH_ENABLED === 'true',
  issuer: process.env.SISQUES_ACCOUNT_ISSUER,
  jwksUrl: process.env.SISQUES_ACCOUNT_JWKS_URL,
  audience: process.env.SISQUES_ACCOUNT_AUDIENCE,
  apiUrl: process.env.SISQUES_ACCOUNT_API_URL,
  appId: process.env.SISQUES_ACCOUNT_APP_ID,
}));

export type SisquesAccountConfig = ConfigType<typeof sisquesAccountConfig>;
