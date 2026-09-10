import { sisquesAccountConfig } from './sisques-account.config';

describe('sisquesAccountConfig', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.SISQUES_ACCOUNT_AUTH_ENABLED;
    delete process.env.SISQUES_ACCOUNT_ISSUER;
    delete process.env.SISQUES_ACCOUNT_JWKS_URL;
    delete process.env.SISQUES_ACCOUNT_AUDIENCE;
    delete process.env.SISQUES_ACCOUNT_API_URL;
    delete process.env.SISQUES_ACCOUNT_APP_ID;
    delete process.env.SISQUES_SPACE_TENANT_SYNC_ENABLED;
    delete process.env.SISQUES_MEMBERSHIP_SYNC_TTL_SECONDS;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('defaults to disabled with undefined connection settings', () => {
    const config = sisquesAccountConfig();

    expect(config).toEqual({
      authEnabled: false,
      issuer: undefined,
      jwksUrl: undefined,
      audience: undefined,
      apiUrl: undefined,
      appId: undefined,
      spaceTenantSyncEnabled: false,
      membershipSyncTtlSeconds: 60,
    });
  });

  it('enables only when SISQUES_ACCOUNT_AUTH_ENABLED is exactly "true"', () => {
    process.env.SISQUES_ACCOUNT_AUTH_ENABLED = 'true';
    expect(sisquesAccountConfig().authEnabled).toBe(true);

    process.env.SISQUES_ACCOUNT_AUTH_ENABLED = 'TRUE';
    expect(sisquesAccountConfig().authEnabled).toBe(false);
  });

  it('reads the JWKS connection settings from the environment', () => {
    process.env.SISQUES_ACCOUNT_ISSUER = 'https://account.sisques.com';
    process.env.SISQUES_ACCOUNT_JWKS_URL =
      'https://account.sisques.com/.well-known/jwks.json';
    process.env.SISQUES_ACCOUNT_AUDIENCE = 'gardenia';
    process.env.SISQUES_ACCOUNT_API_URL = 'https://account.sisques.com';
    process.env.SISQUES_ACCOUNT_APP_ID = 'gardenia-app';

    expect(sisquesAccountConfig()).toEqual({
      authEnabled: false,
      issuer: 'https://account.sisques.com',
      jwksUrl: 'https://account.sisques.com/.well-known/jwks.json',
      audience: 'gardenia',
      apiUrl: 'https://account.sisques.com',
      appId: 'gardenia-app',
      spaceTenantSyncEnabled: false,
      membershipSyncTtlSeconds: 60,
    });
  });

  it('enables the membership sync guard only when SISQUES_SPACE_TENANT_SYNC_ENABLED is exactly "true"', () => {
    process.env.SISQUES_SPACE_TENANT_SYNC_ENABLED = 'true';
    expect(sisquesAccountConfig().spaceTenantSyncEnabled).toBe(true);

    process.env.SISQUES_SPACE_TENANT_SYNC_ENABLED = 'yes';
    expect(sisquesAccountConfig().spaceTenantSyncEnabled).toBe(false);
  });

  it('reads a custom membership sync TTL, falling back to 60s when unset', () => {
    expect(sisquesAccountConfig().membershipSyncTtlSeconds).toBe(60);

    process.env.SISQUES_MEMBERSHIP_SYNC_TTL_SECONDS = '120';
    expect(sisquesAccountConfig().membershipSyncTtlSeconds).toBe(120);
  });
});
