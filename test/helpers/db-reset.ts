import { DataSource } from 'typeorm';

/**
 * Application tables truncated between DB-backed test cases.
 * MUST be updated when a new @Entity is added — see openspec/specs/testing-infrastructure/spec.md.
 */
export const TRUNCATE_TABLES = [
  'accounts',
  'auth_sessions',
  'users',
  'spaces',
  'space_memberships',
  'space_invitations',
  'plant_species',
  'plants',
  'qrs',
  'planting_spots',
  'files',
] as const;

/**
 * Truncates all application tables and restarts identity sequences.
 * Call in `beforeEach` in integration and E2E specs to guarantee isolation between tests.
 */
export async function truncateAll(dataSource: DataSource): Promise<void> {
  const tableList = TRUNCATE_TABLES.map((table) => `"${table}"`).join(', ');

  await dataSource.query(`TRUNCATE ${tableList} RESTART IDENTITY CASCADE`);
}
