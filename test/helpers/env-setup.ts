/**
 * Sets up environment variables for E2E tests before any module is loaded.
 * These match the values in docker-compose.test.yml and .env.test.
 */

import { existsSync, readFileSync } from 'fs';

import { TESTCONTAINERS_ENV_FILE } from './testcontainers-env';

if (
  process.env.USE_TESTCONTAINERS === '1' &&
  existsSync(TESTCONTAINERS_ENV_FILE)
) {
  const testcontainersEnv = JSON.parse(
    readFileSync(TESTCONTAINERS_ENV_FILE, 'utf8'),
  ) as { DATABASE_HOST: string; DATABASE_PORT: string };

  process.env.DATABASE_HOST = testcontainersEnv.DATABASE_HOST;
  process.env.DATABASE_PORT = testcontainersEnv.DATABASE_PORT;
}

process.env.DATABASE_DRIVER = process.env.DATABASE_DRIVER ?? 'postgres';
process.env.DATABASE_HOST = process.env.DATABASE_HOST ?? 'localhost';
process.env.DATABASE_PORT = process.env.DATABASE_PORT ?? '5433';
process.env.DATABASE_USERNAME = process.env.DATABASE_USERNAME ?? 'gardenia';
process.env.DATABASE_PASSWORD = process.env.DATABASE_PASSWORD ?? 'gardenia';
process.env.DATABASE_DATABASE =
  process.env.DATABASE_DATABASE ?? 'gardenia_test';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1d';
process.env.OAUTH_TOKEN_ENC_KEY =
  process.env.OAUTH_TOKEN_ENC_KEY ??
  Buffer.alloc(32).fill('k').toString('base64');
process.env.OAUTH_STATE_SECRET =
  process.env.OAUTH_STATE_SECRET ?? 'test-oauth-state-secret-for-e2e';
process.env.NODE_ENV = 'test';
process.env.QR_BASE_URL = process.env.QR_BASE_URL ?? 'http://localhost:3000';
// plant-identification's PlantNet config fails fast at boot without this —
// AppModule (and therefore every e2e suite) would otherwise fail to start.
process.env.PLANTNET_API_KEY =
  process.env.PLANTNET_API_KEY ?? 'test-plantnet-api-key';
