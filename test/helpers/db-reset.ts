import { DataSource } from 'typeorm';

/**
 * Truncates all application tables and restarts identity sequences.
 * Call in `beforeEach` in E2E specs to guarantee isolation between tests.
 */
export async function truncateAll(dataSource: DataSource): Promise<void> {
  await dataSource.query(
    `TRUNCATE "accounts", "users", "spaces", "space_memberships" RESTART IDENTITY CASCADE`,
  );
}
