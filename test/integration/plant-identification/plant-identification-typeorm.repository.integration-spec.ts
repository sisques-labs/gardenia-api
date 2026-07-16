import { randomUUID } from 'crypto';

import {
  Criteria,
  FilterOperator,
  SortDirection,
} from '@sisques-labs/nestjs-kit';

import { PlantIdentificationBuilder } from '../../../src/contexts/plant-identification/domain/builders/plant-identification.builder';
import { PlantIdentificationOrganEnum } from '../../../src/contexts/plant-identification/domain/enums/plant-identification-organ.enum';
import { PlantIdentificationStatusEnum } from '../../../src/contexts/plant-identification/domain/enums/plant-identification-status.enum';
import {
  PLANT_IDENTIFICATION_READ_REPOSITORY,
  IPlantIdentificationReadRepository,
} from '../../../src/contexts/plant-identification/domain/repositories/read/plant-identification-read.repository';
import {
  PLANT_IDENTIFICATION_WRITE_REPOSITORY,
  IPlantIdentificationWriteRepository,
} from '../../../src/contexts/plant-identification/domain/repositories/write/plant-identification-write.repository';
import { PlantIdentificationModule } from '../../../src/contexts/plant-identification/plant-identification.module';
import { truncateAll } from '../../helpers/db-reset';
import {
  createIntegrationModule,
  IntegrationContext,
} from '../../helpers/integration-bootstrap';
import { seedFile, seedSpaceWithUser } from '../../helpers/tenant-seed';

describe('PlantIdentification TypeORM repositories (integration)', () => {
  let ctx: IntegrationContext;
  let writeRepo: IPlantIdentificationWriteRepository;
  let readRepo: IPlantIdentificationReadRepository;
  let builder: PlantIdentificationBuilder;

  const spaceAId = randomUUID();
  const spaceBId = randomUUID();
  const userAId = randomUUID();
  const userBId = randomUUID();
  // Overwritten by the builder's own space handling at save time — must be a
  // valid UUID.
  const PLACEHOLDER_SPACE_ID = randomUUID();

  beforeAll(async () => {
    ctx = await createIntegrationModule({
      imports: [PlantIdentificationModule],
    });
    writeRepo = ctx.module.get(PLANT_IDENTIFICATION_WRITE_REPOSITORY);
    readRepo = ctx.module.get(PLANT_IDENTIFICATION_READ_REPOSITORY);
    builder = ctx.module.get(PlantIdentificationBuilder);
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

  async function buildIdentification(
    createdAt: Date,
    spaceId: string,
    userId: string,
    status = PlantIdentificationStatusEnum.RESOLVED,
  ) {
    const fileId = randomUUID();
    await seedFile(ctx.dataSource, fileId, spaceId, userId);

    return builder
      .withId(randomUUID())
      .withRequestedByUserId(userId)
      .withSpaceId(spaceId)
      .withResolved(
        status === PlantIdentificationStatusEnum.RESOLVED
          ? {
              speciesKey: 2882337,
              scientificName: 'Monstera deliciosa',
              provider: 'gbif',
            }
          : null,
      )
      .withPhotos([
        {
          fileId,
          url: `/api/files/${fileId}/content`,
          organ: PlantIdentificationOrganEnum.LEAF,
          position: 0,
        },
      ])
      .withCandidates([
        {
          scientificName: 'Monstera deliciosa',
          commonNames: ['Swiss cheese plant'],
          score: 0.85,
          rank: 0,
        },
      ])
      .withCreatedAt(createdAt)
      .withUpdatedAt(createdAt)
      .build();
  }

  it('saves and finds an identification by id, including photos and candidates', async () => {
    await ctx.spaceContext.run(spaceAId, async () => {
      const identification = await buildIdentification(
        new Date('2026-06-01'),
        PLACEHOLDER_SPACE_ID,
        userAId,
      );
      await writeRepo.save(identification);

      const found = await writeRepo.findById(identification.id.value);
      expect(found?.requestedByUserId.value).toBe(userAId);
      expect(found?.photos).toHaveLength(1);
      expect(found?.candidates).toHaveLength(1);
      expect(found?.resolvedSpeciesKey?.value).toBe(2882337);
    });
  });

  it('cascade-deletes photos and candidates when the parent row is deleted', async () => {
    await ctx.spaceContext.run(spaceAId, async () => {
      const identification = await buildIdentification(
        new Date('2026-06-01'),
        PLACEHOLDER_SPACE_ID,
        userAId,
      );
      await writeRepo.save(identification);

      await writeRepo.delete(identification.id.value);

      const photoCount = await ctx.dataSource.query(
        `SELECT COUNT(*) FROM "plant_identification_photos" WHERE "plant_identification_id" = $1`,
        [identification.id.value],
      );
      const candidateCount = await ctx.dataSource.query(
        `SELECT COUNT(*) FROM "plant_identification_candidates" WHERE "plant_identification_id" = $1`,
        [identification.id.value],
      );

      expect(Number(photoCount[0].count)).toBe(0);
      expect(Number(candidateCount[0].count)).toBe(0);
    });
  });

  it('defaults to createdAt DESC and paginates', async () => {
    await ctx.spaceContext.run(spaceAId, async () => {
      await writeRepo.save(
        await buildIdentification(
          new Date('2026-01-01'),
          PLACEHOLDER_SPACE_ID,
          userAId,
        ),
      );
      await writeRepo.save(
        await buildIdentification(
          new Date('2026-06-01'),
          PLACEHOLDER_SPACE_ID,
          userAId,
        ),
      );
      await writeRepo.save(
        await buildIdentification(
          new Date('2026-03-01'),
          PLACEHOLDER_SPACE_ID,
          userAId,
        ),
      );

      const result = await readRepo.findByCriteria(
        new Criteria([], [], { page: 1, perPage: 1 }),
      );

      expect(result.total).toBe(3);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].createdAt.toISOString()).toContain('2026-06-01');
    });
  });

  it('filters by status', async () => {
    await ctx.spaceContext.run(spaceAId, async () => {
      await writeRepo.save(
        await buildIdentification(
          new Date('2026-01-01'),
          PLACEHOLDER_SPACE_ID,
          userAId,
          PlantIdentificationStatusEnum.RESOLVED,
        ),
      );
      await writeRepo.save(
        await buildIdentification(
          new Date('2026-02-01'),
          PLACEHOLDER_SPACE_ID,
          userAId,
          PlantIdentificationStatusEnum.NO_MATCH,
        ),
      );

      const result = await readRepo.findByCriteria(
        new Criteria(
          [
            {
              field: 'status',
              operator: FilterOperator.EQUALS,
              value: PlantIdentificationStatusEnum.NO_MATCH,
            },
          ],
          [],
          { page: 1, perPage: 10 },
        ),
      );

      expect(result.total).toBe(1);
      expect(result.items[0].status).toBe(
        PlantIdentificationStatusEnum.NO_MATCH,
      );
    });
  });

  it('honors a client-supplied sort over the default', async () => {
    await ctx.spaceContext.run(spaceAId, async () => {
      await writeRepo.save(
        await buildIdentification(
          new Date('2026-06-01'),
          PLACEHOLDER_SPACE_ID,
          userAId,
        ),
      );
      await writeRepo.save(
        await buildIdentification(
          new Date('2026-01-01'),
          PLACEHOLDER_SPACE_ID,
          userAId,
        ),
      );

      const result = await readRepo.findByCriteria(
        new Criteria(
          [],
          [{ field: 'createdAt', direction: SortDirection.ASC }],
          { page: 1, perPage: 10 },
        ),
      );

      expect(new Date(result.items[0].createdAt).getTime()).toBeLessThan(
        new Date(result.items[1].createdAt).getTime(),
      );
    });
  });

  it('scopes reads and writes to the active space (tenant isolation)', async () => {
    await ctx.spaceContext.run(spaceAId, async () => {
      await writeRepo.save(
        await buildIdentification(
          new Date('2026-06-01'),
          PLACEHOLDER_SPACE_ID,
          userAId,
        ),
      );
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
