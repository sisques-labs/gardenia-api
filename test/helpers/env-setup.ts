/**
 * Sets up environment variables for E2E tests before any module is loaded.
 * These match the values in docker-compose.test.yml and .env.test.
 */

process.env.DATABASE_DRIVER = process.env.DATABASE_DRIVER ?? 'postgres';
process.env.DATABASE_HOST = process.env.DATABASE_HOST ?? 'localhost';
process.env.DATABASE_PORT = process.env.DATABASE_PORT ?? '5433';
process.env.DATABASE_USERNAME = process.env.DATABASE_USERNAME ?? 'gardenia';
process.env.DATABASE_PASSWORD = process.env.DATABASE_PASSWORD ?? 'gardenia';
process.env.DATABASE_DATABASE =
  process.env.DATABASE_DATABASE ?? 'gardenia_test';
process.env.DATABASE_SYNCHRONIZE = 'true';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1d';
process.env.NODE_ENV = 'test';
