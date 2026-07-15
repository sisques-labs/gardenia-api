import { randomUUID } from 'crypto';

import {
  Criteria,
  FilterOperator,
  SortDirection,
} from '@sisques-labs/nestjs-kit';

import { HarvestBuilder } from '../../../src/contexts/harvests/domain/builders/harvest.builder';
import { HarvestUnitEnum } from '../../../src/contexts/harvests/domain/enums/harvest-unit.enum';
import {
  HARVEST_READ_REPOSITORY,
  IHarvestReadRepository,
} from '../../../src/contexts/harvests/domain/repositories/read/harvest-read.repository';
import {
  HARVEST_WRITE_REPOSITORY,
  IHarvestWriteRepository,
} from '../../../src/contexts/harvests/domain/repositories/write/harvest-write.repository';
import { HarvestsModule } from '../../../src/contexts/harvests/harvests.module';
import { truncateAll } from '../../helpers/db-reset';
import {
  createIntegrationModule,
  IntegrationContext,
} from '../../helpers/integration-bootstrap';
import { seedSpaceWithUser } from '../../helpers/tenant-seed';

const PLACEHOLDER_SPACE_ID = randomUUID();

describe('HarvestTypeOrmReadRepository (integration)', () => {
  let ctx: IntegrationContext;
  let writeRepo: IHarvestWriteRepository;
  let readRepo: IHarvestReadRepository;

  const spaceAId = randomUUID();
  const spaceBId = randomUUID();
  const userAId = randomUUID();
  const userBId = randomUUID();

  beforeAll(async () => {
    ctx = await createIntegrationModule({ imports: [HarvestsModule] });
    writeRepo = ctx.module.get(HARVEST_WRITE_REPOSITORY);
    readRepo = ctx.module.get(HARVEST_READ_REPOSITORY);
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

  function buildHarvest(
    cropType: string,
    harvestedAt: Date,
    overrides: Partial<{ unit: HarvestUnitEnum; quantity: number }> = {},
  ) {
    return new HarvestBuilder()
      .withId(randomUUID())
      .withCropType(cropType)
      .withQuantity(overrides.quantity ?? 2.5)
      .withUnit(overrides.unit ?? HarvestUnitEnum.KG)
      .withHarvestedAt(harvestedAt)
      .withUserId(userAId)
      .withSpaceId(PLACEHOLDER_SPACE_ID)
      .withCreatedAt(harvestedAt)
      .withUpdatedAt(harvestedAt)
      .build();
  }

  it('filters by cropType (case-insensitive)', async () => {
    await ctx.spaceContext.run(spaceAId, async () => {
      await writeRepo.save(
        buildHarvest('Tomate Cherry', new Date('2026-06-01')),
      );
      await writeRepo.save(buildHarvest('Lechuga', new Date('2026-06-02')));

      const result = await readRepo.findByCriteria(
        new Criteria(
          [
            {
              field: 'cropType',
              operator: FilterOperator.LIKE,
              value: 'tomate',
            },
          ],
          [],
          { page: 1, perPage: 10 },
        ),
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].cropType).toBe('Tomate Cherry');
    });
  });

  it('filters by a harvestedAt range', async () => {
    await ctx.spaceContext.run(spaceAId, async () => {
      await writeRepo.save(buildHarvest('Early', new Date('2026-01-01')));
      await writeRepo.save(buildHarvest('Mid', new Date('2026-06-01')));
      await writeRepo.save(buildHarvest('Late', new Date('2026-12-01')));

      const result = await readRepo.findByCriteria(
        new Criteria(
          [
            {
              field: 'harvestedAt',
              operator: FilterOperator.GREATER_THAN_OR_EQUAL,
              value: new Date('2026-03-01'),
            },
            {
              field: 'harvestedAt',
              operator: FilterOperator.LESS_THAN_OR_EQUAL,
              value: new Date('2026-09-01'),
            },
          ],
          [],
          { page: 1, perPage: 10 },
        ),
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].cropType).toBe('Mid');
    });
  });

  it('defaults to createdAt DESC when no sort is given', async () => {
    await ctx.spaceContext.run(spaceAId, async () => {
      await writeRepo.save(buildHarvest('First', new Date('2026-01-01')));
      await writeRepo.save(buildHarvest('Second', new Date('2026-06-01')));

      const result = await readRepo.findByCriteria(
        new Criteria([], [], { page: 1, perPage: 10 }),
      );
      expect(result.items.map((h) => h.cropType)).toEqual(['Second', 'First']);
    });
  });

  it('honors a client-supplied sort over the default', async () => {
    await ctx.spaceContext.run(spaceAId, async () => {
      await writeRepo.save(buildHarvest('Second', new Date('2026-06-01')));
      await writeRepo.save(buildHarvest('First', new Date('2026-01-01')));

      const result = await readRepo.findByCriteria(
        new Criteria(
          [],
          [{ field: 'harvestedAt', direction: SortDirection.ASC }],
          { page: 1, perPage: 10 },
        ),
      );
      expect(result.items.map((h) => h.cropType)).toEqual(['First', 'Second']);
    });
  });

  it('scopes findByCriteria to the active space', async () => {
    await ctx.spaceContext.run(spaceAId, async () => {
      await writeRepo.save(buildHarvest('Item A', new Date('2026-06-01')));
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
