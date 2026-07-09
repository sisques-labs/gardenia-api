import { randomUUID } from 'crypto';

import {
  Criteria,
  FilterOperator,
  SortDirection,
} from '@sisques-labs/nestjs-kit';

import { PlantPhotoBuilder } from '../../../src/contexts/plant-photos/domain/builders/plant-photo.builder';
import {
  PLANT_PHOTO_READ_REPOSITORY,
  IPlantPhotoReadRepository,
} from '../../../src/contexts/plant-photos/domain/repositories/read/plant-photo-read.repository';
import {
  PLANT_PHOTO_WRITE_REPOSITORY,
  IPlantPhotoWriteRepository,
} from '../../../src/contexts/plant-photos/domain/repositories/write/plant-photo-write.repository';
import { PlantPhotosModule } from '../../../src/contexts/plant-photos/plant-photos.module';
import { truncateAll } from '../../helpers/db-reset';
import {
  createIntegrationModule,
  IntegrationContext,
} from '../../helpers/integration-bootstrap';
import { seedFile, seedSpaceWithUser } from '../../helpers/tenant-seed';

describe('PlantPhoto TypeORM repositories (integration)', () => {
  let ctx: IntegrationContext;
  let writeRepo: IPlantPhotoWriteRepository;
  let readRepo: IPlantPhotoReadRepository;

  const spaceAId = randomUUID();
  const spaceBId = randomUUID();
  const userAId = randomUUID();
  const userBId = randomUUID();
  const plantId = randomUUID();
  // Overwritten by tenant proxy at save time — must be a valid UUID for the builder.
  const PLACEHOLDER_SPACE_ID = randomUUID();

  beforeAll(async () => {
    ctx = await createIntegrationModule({ imports: [PlantPhotosModule] });
    writeRepo = ctx.module.get(PLANT_PHOTO_WRITE_REPOSITORY);
    readRepo = ctx.module.get(PLANT_PHOTO_READ_REPOSITORY);
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await truncateAll(ctx.dataSource);
    await seedSpaceWithUser(ctx.dataSource, spaceAId, userAId, {
      spaceName: 'Space A',
      username: 'owner_a',
    });
    await seedSpaceWithUser(ctx.dataSource, spaceBId, userBId, {
      spaceName: 'Space B',
      username: 'owner_b',
    });
  });

  async function buildPhoto(createdAt: Date, fileId = randomUUID()) {
    await seedFile(ctx.dataSource, fileId, spaceAId, userAId);
    return new PlantPhotoBuilder()
      .withId(randomUUID())
      .withPlantId(plantId)
      .withFileId(fileId)
      .withUrl(`/api/files/${fileId}/content`)
      .withUserId(userAId)
      .withSpaceId(PLACEHOLDER_SPACE_ID)
      .withCreatedAt(createdAt)
      .withUpdatedAt(createdAt)
      .build();
  }

  it('saves and finds a photo by id within the active space', async () => {
    await ctx.spaceContext.run(spaceAId, async () => {
      const photo = await buildPhoto(new Date('2026-06-01'));
      await writeRepo.save(photo);

      const found = await writeRepo.findById(photo.id.value);
      expect(found?.plantId.value).toBe(plantId);
    });
  });

  it('defaults to createdAt DESC and paginates', async () => {
    await ctx.spaceContext.run(spaceAId, async () => {
      await writeRepo.save(await buildPhoto(new Date('2026-01-01')));
      await writeRepo.save(await buildPhoto(new Date('2026-06-01')));
      await writeRepo.save(await buildPhoto(new Date('2026-03-01')));

      const result = await readRepo.findByCriteria(
        new Criteria(
          [
            {
              field: 'plantId',
              operator: FilterOperator.EQUALS,
              value: plantId,
            },
          ],
          [],
          { page: 1, perPage: 1 },
        ),
      );

      expect(result.total).toBe(3);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].createdAt.toISOString()).toContain('2026-06-01');
    });
  });

  it('honors a client-supplied sort over the default', async () => {
    await ctx.spaceContext.run(spaceAId, async () => {
      await writeRepo.save(await buildPhoto(new Date('2026-06-01')));
      await writeRepo.save(await buildPhoto(new Date('2026-01-01')));

      const result = await readRepo.findByCriteria(
        new Criteria(
          [],
          [{ field: 'createdAt', direction: SortDirection.ASC }],
          { page: 1, perPage: 10 },
        ),
      );

      expect(result.items.map((p) => p.createdAt.toISOString())).toEqual([
        result.items[0].createdAt.toISOString(),
        result.items[1].createdAt.toISOString(),
      ]);
      expect(new Date(result.items[0].createdAt).getTime()).toBeLessThan(
        new Date(result.items[1].createdAt).getTime(),
      );
    });
  });

  it('scopes reads and writes to the active space (tenant isolation)', async () => {
    await ctx.spaceContext.run(spaceAId, async () => {
      await writeRepo.save(await buildPhoto(new Date('2026-06-01')));
    });

    await ctx.spaceContext.run(spaceBId, async () => {
      const result = await readRepo.findByCriteria(
        new Criteria([], [], { page: 1, perPage: 10 }),
      );
      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });
});
