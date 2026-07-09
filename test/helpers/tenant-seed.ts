import { UserStatusEnum } from '@sisques-labs/nestjs-kit';
import { DataSource } from 'typeorm';

const SEED_TIMESTAMP = new Date('2024-06-01T00:00:00.000Z');

export async function seedSpace(
  dataSource: DataSource,
  spaceId: string,
  ownerId: string,
  name = 'Test Space',
): Promise<void> {
  await dataSource.query(
    `INSERT INTO "spaces" ("id", "name", "owner_id", "created_at", "updated_at")
     VALUES ($1, $2, $3, $4, $4)`,
    [spaceId, name, ownerId, SEED_TIMESTAMP],
  );
}

export async function seedUser(
  dataSource: DataSource,
  userId: string,
  spaceId: string,
  username: string,
  status: UserStatusEnum = UserStatusEnum.ACTIVE,
): Promise<void> {
  await dataSource.query(
    `INSERT INTO "users" ("id", "space_id", "status", "username", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $5)`,
    [userId, spaceId, status, username, SEED_TIMESTAMP],
  );
}

export async function seedMembership(
  dataSource: DataSource,
  spaceId: string,
  userId: string,
  role = 'member',
): Promise<void> {
  await dataSource.query(
    `INSERT INTO "space_memberships" ("space_id", "user_id", "role", "joined_at")
     VALUES ($1, $2, $3, $4)`,
    [spaceId, userId, role, SEED_TIMESTAMP],
  );
}

export async function seedSpaceWithUser(
  dataSource: DataSource,
  spaceId: string,
  userId: string,
  options?: { spaceName?: string; username?: string },
): Promise<void> {
  await seedSpace(
    dataSource,
    spaceId,
    userId,
    options?.spaceName ?? 'Test Space',
  );
  await seedUser(
    dataSource,
    userId,
    spaceId,
    options?.username ?? `user-${userId.slice(0, 8)}`,
  );
}

export async function seedPlantSpecies(
  dataSource: DataSource,
  id: string,
  scientificName: string,
): Promise<void> {
  await dataSource.query(
    `INSERT INTO "plant_species" ("id", "scientific_name", "created_at", "updated_at")
     VALUES ($1, $2, $3, $3)`,
    [id, scientificName, SEED_TIMESTAMP],
  );
}

export async function seedPlantingSpot(
  dataSource: DataSource,
  id: string,
  spaceId: string,
  userId: string,
  name = 'Test Spot',
): Promise<void> {
  await dataSource.query(
    `INSERT INTO "planting_spots" ("id", "name", "type", "user_id", "space_id", "created_at", "updated_at")
     VALUES ($1, $2, $3, $4, $5, $6, $6)`,
    [id, name, 'bed', userId, spaceId, SEED_TIMESTAMP],
  );
}

export async function seedFile(
  dataSource: DataSource,
  id: string,
  spaceId: string,
  userId: string,
  filename = 'rose.png',
): Promise<void> {
  await dataSource.query(
    `INSERT INTO "files" ("id", "filename", "mime_type", "size", "storage_key", "url", "user_id", "space_id", "created_at", "updated_at")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)`,
    [
      id,
      filename,
      'image/png',
      2048,
      id,
      `/api/files/${id}/content`,
      userId,
      spaceId,
      SEED_TIMESTAMP,
    ],
  );
}
