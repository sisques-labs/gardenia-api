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
    });
  });
});
