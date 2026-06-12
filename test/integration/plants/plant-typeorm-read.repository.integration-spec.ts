import { randomUUID } from 'crypto';

import { PlantBuilder } from '../../../src/contexts/plants/domain/builders/plant.builder';
import {
  IPlantReadRepository,
  PLANT_READ_REPOSITORY,
} from '../../../src/contexts/plants/domain/repositories/read/plant-read.repository';
import {
  IPlantWriteRepository,
  PLANT_WRITE_REPOSITORY,
} from '../../../src/contexts/plants/domain/repositories/write/plant-write.repository';
import { PlantsModule } from '../../../src/contexts/plants/plants.module';
import { Criteria } from '@sisques-labs/nestjs-kit';

import {
  createIntegrationModule,
  IntegrationContext,
} from '../../helpers/integration-bootstrap';
import { truncateAll } from '../../helpers/db-reset';
import { seedSpaceWithUser } from '../../helpers/tenant-seed';

const NOW = new Date('2024-06-01T00:00:00.000Z');

// spaceId is overwritten by the tenant proxy at save time, but the builder
// requires a valid UUID — pass a dummy UUID that satisfies the VO constraint.
const PLACEHOLDER_SPACE_ID = randomUUID();

function buildPlant(name: string, userId: string) {
  return new PlantBuilder()
    .withId(randomUUID())
    .withName(name)
    .withUserId(userId)
    .withSpaceId(PLACEHOLDER_SPACE_ID)
    .withCreatedAt(NOW)
    .withUpdatedAt(NOW)
    .build();
}

describe('PlantTypeOrmReadRepository (integration)', () => {
  let ctx: IntegrationContext;
  let plantWriteRepo: IPlantWriteRepository;
  let plantReadRepo: IPlantReadRepository;

  const spaceAId = randomUUID();
  const spaceBId = randomUUID();
  const userAId = randomUUID();
  const userBId = randomUUID();

  beforeAll(async () => {
    ctx = await createIntegrationModule({ imports: [PlantsModule] });
    plantWriteRepo = ctx.module.get(PLANT_WRITE_REPOSITORY);
    plantReadRepo = ctx.module.get(PLANT_READ_REPOSITORY);
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

  describe('findById()', () => {
    it('returns PlantViewModel for an existing plant', async () => {
      let plantId: string;

      await ctx.spaceContext.run(spaceAId, async () => {
        const plant = buildPlant('Rose', userAId);
        const saved = await plantWriteRepo.save(plant);
        plantId = saved.id.value;
      });

      await ctx.spaceContext.run(spaceAId, async () => {
        const vm = await plantReadRepo.findById(plantId);
        expect(vm).not.toBeNull();
        expect(vm!.id).toBe(plantId);
        expect(vm!.name).toBe('Rose');
      });
    });

    it('returns null for an unknown id', async () => {
      await ctx.spaceContext.run(spaceAId, async () => {
        const vm = await plantReadRepo.findById(randomUUID());
        expect(vm).toBeNull();
      });
    });
  });

  describe('findByCriteria()', () => {
    it('returns paginated results scoped to the active space', async () => {
      await ctx.spaceContext.run(spaceAId, async () => {
        await plantWriteRepo.save(buildPlant('Rose', userAId));
        await plantWriteRepo.save(buildPlant('Fern', userAId));
      });

      await ctx.spaceContext.run(spaceBId, async () => {
        await plantWriteRepo.save(buildPlant('Cactus', userBId));
      });

      await ctx.spaceContext.run(spaceAId, async () => {
        const result = await plantReadRepo.findByCriteria(
          new Criteria([], [], { page: 1, perPage: 10 }),
        );

        expect(result.items).toHaveLength(2);
        const names = result.items.map((p) => p.name).sort();
        expect(names).toEqual(['Fern', 'Rose']);
      });

      await ctx.spaceContext.run(spaceBId, async () => {
        const result = await plantReadRepo.findByCriteria(
          new Criteria([], [], { page: 1, perPage: 10 }),
        );

        expect(result.items).toHaveLength(1);
        expect(result.items[0].name).toBe('Cactus');
      });
    });

    it('respects pagination parameters', async () => {
      await ctx.spaceContext.run(spaceAId, async () => {
        await plantWriteRepo.save(buildPlant('Alpha', userAId));
        await plantWriteRepo.save(buildPlant('Beta', userAId));
        await plantWriteRepo.save(buildPlant('Gamma', userAId));
      });

      await ctx.spaceContext.run(spaceAId, async () => {
        const result = await plantReadRepo.findByCriteria(
          new Criteria([], [], { page: 1, perPage: 2 }),
        );

        expect(result.items).toHaveLength(2);
        expect(result.total).toBe(3);
      });
    });
  });

  describe('Cross-space tenant isolation', () => {
    it('plant from space A is not in results for space B', async () => {
      let plantAId: string;

      await ctx.spaceContext.run(spaceAId, async () => {
        const plant = buildPlant('Tulip', userAId);
        const saved = await plantWriteRepo.save(plant);
        plantAId = saved.id.value;
      });

      await ctx.spaceContext.run(spaceBId, async () => {
        const vm = await plantReadRepo.findById(plantAId);
        expect(vm).toBeNull();
      });

      await ctx.spaceContext.run(spaceBId, async () => {
        const result = await plantReadRepo.findByCriteria(
          new Criteria([], [], { page: 1, perPage: 10 }),
        );
        const ids = result.items.map((p) => p.id);
        expect(ids).not.toContain(plantAId);
      });
    });
  });
});
