import { validateEnv, validateProductionSecrets } from './env.validation';

const VALID_OAUTH_TOKEN_ENC_KEY = Buffer.alloc(32).fill('k').toString('base64');

function validEnv(
  overrides: Record<string, string | undefined> = {},
): Record<string, string> {
  return {
    NODE_ENV: 'development',
    JWT_SECRET: 'dev-jwt-secret',
    OAUTH_TOKEN_ENC_KEY: VALID_OAUTH_TOKEN_ENC_KEY,
    OAUTH_STATE_SECRET: 'dev-oauth-state-secret',
    QR_BASE_URL: 'http://localhost:3000',
    DATABASE_DRIVER: 'postgres',
    DATABASE_HOST: 'localhost',
    DATABASE_PORT: '5432',
    DATABASE_USERNAME: 'gardenia',
    DATABASE_PASSWORD: 'secret',
    DATABASE_DATABASE: 'gardenia_db',
    ...overrides,
  };
}

describe('validateEnv', () => {
  it('accepts a complete non-production environment', () => {
    expect(() => validateEnv(validEnv())).not.toThrow();
  });

  it('rejects a missing JWT_SECRET', () => {
    const env = validEnv({ JWT_SECRET: '' });

    expect(() => validateEnv(env)).toThrow(
      /Environment validation failed:[\s\S]*JWT_SECRET/,
    );
  });

  it('rejects an invalid OAUTH_TOKEN_ENC_KEY', () => {
    const env = validEnv({ OAUTH_TOKEN_ENC_KEY: 'not-a-valid-key' });

    expect(() => validateEnv(env)).toThrow(
      /OAUTH_TOKEN_ENC_KEY must be a 32-byte \(256-bit\) base64-encoded key/,
    );
  });

  it('rejects missing DATABASE_HOST', () => {
    const env = validEnv({ DATABASE_HOST: '' });

    expect(() => validateEnv(env)).toThrow(
      /Environment validation failed:[\s\S]*DATABASE_HOST/,
    );
  });

  it('rejects placeholder secrets in production', () => {
    const env = validEnv({
      NODE_ENV: 'production',
      JWT_SECRET: 'change_me_in_production',
      OAUTH_STATE_SECRET: 'a'.repeat(32),
      OAUTH_TOKEN_ENC_KEY: VALID_OAUTH_TOKEN_ENC_KEY,
    });

    expect(() => validateEnv(env)).toThrow(
      /JWT_SECRET: must not use a placeholder value in production/,
    );
  });

  it('rejects short JWT_SECRET in production', () => {
    const env = validEnv({
      NODE_ENV: 'production',
      JWT_SECRET: 'too-short',
      OAUTH_STATE_SECRET: 'a'.repeat(32),
    });

    expect(() => validateEnv(env)).toThrow(
      /JWT_SECRET: must be at least 32 characters in production/,
    );
  });

  it('allows placeholder JWT_SECRET outside production', () => {
    const env = validEnv({
      NODE_ENV: 'development',
      JWT_SECRET: 'change_me_in_production',
    });

    expect(() => validateEnv(env)).not.toThrow();
  });
});

describe('validateProductionSecrets', () => {
  it('lists all production secret violations', () => {
    const errors = validateProductionSecrets({
      JWT_SECRET: 'change_me',
      OAUTH_STATE_SECRET: 'short',
      OAUTH_TOKEN_ENC_KEY: 'change_me_32_bytes_hex_in_production',
    });

    expect(errors).toHaveLength(3);
  });
});
