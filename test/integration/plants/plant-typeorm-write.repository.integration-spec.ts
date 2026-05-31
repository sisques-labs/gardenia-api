import { randomUUID } from 'crypto';

import { PlantBuilder } from '../../../src/contexts/plants/domain/builders/plant.builder';
import {
  IPlantWriteRepository,
  PLANT_WRITE_REPOSITORY,
} from '../../../src/contexts/plants/domain/repositories/write/plant-write.repository';
import { PlantsModule } from '../../../src/contexts/plants/plants.module';

import {
  createIntegrationModule,
  IntegrationContext,
} from '../../helpers/integration-bootstrap';
import { truncateAll } from '../../helpers/db-reset';

const NOW = new Date('2024-06-01T00:00:00.000Z');

// spaceId is overwritten by the tenant proxy at save time, but the builder
// requires a valid UUID — pass a dummy UUID that satisfies the VO constraint.
const PLACEHOLDER_SPACE_ID = randomUUID();

function buildPlant(name: string, userId?: string) {
  return new PlantBuilder()
    .withId(randomUUID())
    .withName(name)
    .withUserId(userId ?? randomUUID())
    .withSpaceId(PLACEHOLDER_SPACE_ID)
    .withCreatedAt(NOW)
    .withUpdatedAt(NOW)
    .build();
}

describe('PlantTypeOrmWriteRepository (integration)', () => {
  let ctx: IntegrationContext;
  let plantWriteRepo: IPlantWriteRepository;

  const spaceAId = randomUUID();
  const spaceBId = randomUUID();

  beforeAll(async () => {
    ctx = await createIntegrationModule({ imports: [PlantsModule] });
    plantWriteRepo = ctx.module.get(PLANT_WRITE_REPOSITORY);
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await truncateAll(ctx.dataSource);
  });

  describe('save() and findById()', () => {
    it('persists a PlantAggregate and returns it with the same id', async () => {
      await ctx.spaceContext.run(spaceAId, async () => {
        const plant = buildPlant('Rose');
        const saved = await plantWriteRepo.save(plant);

        expect(saved.id.value).toBe(plant.id.value);
        expect(saved.name.value).toBe('Rose');
      });
    });

    it('findById() returns the saved aggregate', async () => {
      let plantId: string;

      await ctx.spaceContext.run(spaceAId, async () => {
        const plant = buildPlant('Fern');
        const saved = await plantWriteRepo.save(plant);
        plantId = saved.id.value;
      });

      await ctx.spaceContext.run(spaceAId, async () => {
        const found = await plantWriteRepo.findById(plantId);
        expect(found).not.toBeNull();
        expect(found!.name.value).toBe('Fern');
      });
    });

    it('findById() returns null for an unknown id', async () => {
      await ctx.spaceContext.run(spaceAId, async () => {
        const found = await plantWriteRepo.findById(randomUUID());
        expect(found).toBeNull();
      });
    });

    it('persists optional fields (plantSpeciesId and imageUrl)', async () => {
      const speciesId = randomUUID();
      let plantId: string;

      await ctx.spaceContext.run(spaceAId, async () => {
        const plant = new PlantBuilder()
          .withId(randomUUID())
          .withName('Cactus')
          .withPlantSpeciesId(speciesId)
          .withImageUrl('https://example.com/cactus.jpg')
          .withUserId(randomUUID())
          .withSpaceId(PLACEHOLDER_SPACE_ID)
          .withCreatedAt(NOW)
          .withUpdatedAt(NOW)
          .build();

        const saved = await plantWriteRepo.save(plant);
        plantId = saved.id.value;
      });

      await ctx.spaceContext.run(spaceAId, async () => {
        const found = await plantWriteRepo.findById(plantId);
        expect(found).not.toBeNull();
        expect(found!.plantSpeciesId?.value).toBe(speciesId);
        expect(found!.imageUrl?.value).toBe('https://example.com/cactus.jpg');
      });
    });
  });

  describe('delete()', () => {
    it('removes the record so findById returns null afterwards', async () => {
      let plantId: string;

      await ctx.spaceContext.run(spaceAId, async () => {
        const plant = buildPlant('Orchid');
        const saved = await plantWriteRepo.save(plant);
        plantId = saved.id.value;
      });

      await ctx.spaceContext.run(spaceAId, async () => {
        await plantWriteRepo.delete(plantId);
        const found = await plantWriteRepo.findById(plantId);
        expect(found).toBeNull();
      });
    });
  });

  describe('Cross-space tenant isolation', () => {
    it('plant saved in space A is NOT findable in space B context', async () => {
      let plantId: string;

      await ctx.spaceContext.run(spaceAId, async () => {
        const plant = buildPlant('Tulip');
        const saved = await plantWriteRepo.save(plant);
        plantId = saved.id.value;
      });

      await ctx.spaceContext.run(spaceBId, async () => {
        const found = await plantWriteRepo.findById(plantId);
        expect(found).toBeNull();
      });
    });

    it('delete in space A does not affect plants in space B', async () => {
      let plantAId: string;
      let plantBId: string;

      await ctx.spaceContext.run(spaceAId, async () => {
        const plant = buildPlant('Daisy');
        const saved = await plantWriteRepo.save(plant);
        plantAId = saved.id.value;
      });

      await ctx.spaceContext.run(spaceBId, async () => {
        const plant = buildPlant('Lily');
        const saved = await plantWriteRepo.save(plant);
        plantBId = saved.id.value;
      });

      // Delete plantA's ID while in space A context
      await ctx.spaceContext.run(spaceAId, async () => {
        await plantWriteRepo.delete(plantAId);
      });

      // Plant B should still exist in space B
      await ctx.spaceContext.run(spaceBId, async () => {
        const found = await plantWriteRepo.findById(plantBId);
        expect(found).not.toBeNull();
        expect(found!.name.value).toBe('Lily');
      });
    });
  });
});
