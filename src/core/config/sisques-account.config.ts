import { ConfigType, registerAs } from '@nestjs/config';

const DEFAULT_MEMBERSHIP_SYNC_TTL_SECONDS = 60;

/**
 * Sisques Account (the platform) dual-issuer connection settings.
 *
 * Platform-token acceptance is **opt-in** via `SISQUES_ACCOUNT_AUTH_ENABLED`
 * so the JWKS strategy can be disabled without a code change (P1 rollback).
 *
 * `spaceTenantSyncEnabled` gates `MembershipProjectionSyncGuard` (design.md
 * D4, P2 rollback) — when `false` the guard no-ops unconditionally and the
 * projection freezes at its last state, exactly per the Rollback/Reversibility
 * section's "Revert P2" step 1.
 */
export const sisquesAccountConfig = registerAs('sisquesAccount', () => ({
  authEnabled: process.env.SISQUES_ACCOUNT_AUTH_ENABLED === 'true',
  issuer: process.env.SISQUES_ACCOUNT_ISSUER,
  jwksUrl: process.env.SISQUES_ACCOUNT_JWKS_URL,
  audience: process.env.SISQUES_ACCOUNT_AUDIENCE,
  apiUrl: process.env.SISQUES_ACCOUNT_API_URL,
  appId: process.env.SISQUES_ACCOUNT_APP_ID,
  spaceTenantSyncEnabled:
    process.env.SISQUES_SPACE_TENANT_SYNC_ENABLED === 'true',
  membershipSyncTtlSeconds: process.env.SISQUES_MEMBERSHIP_SYNC_TTL_SECONDS
    ? Number(process.env.SISQUES_MEMBERSHIP_SYNC_TTL_SECONDS)
    : DEFAULT_MEMBERSHIP_SYNC_TTL_SECONDS,
}));

export type SisquesAccountConfig = ConfigType<typeof sisquesAccountConfig>;
