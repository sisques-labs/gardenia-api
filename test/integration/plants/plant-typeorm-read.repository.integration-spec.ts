import { randomUUID } from 'crypto';

import { PlantBuilder } from '../../../src/contexts/plants/domain/builders/plant.builder';
import { PlantQueryableField } from '../../../src/contexts/plants/transport/graphql/enums/plant/plant-queryable-field.enum';
import {
  IPlantReadRepository,
  PLANT_READ_REPOSITORY,
} from '../../../src/contexts/plants/domain/repositories/read/plant-read.repository';
import {
  IPlantWriteRepository,
  PLANT_WRITE_REPOSITORY,
} from '../../../src/contexts/plants/domain/repositories/write/plant-write.repository';
import { PlantsModule } from '../../../src/contexts/plants/plants.module';
import {
  Criteria,
  FilterOperator,
  SortDirection,
} from '@sisques-labs/nestjs-kit';

import {
  createIntegrationModule,
  IntegrationContext,
} from '../../helpers/integration-bootstrap';
import { truncateAll } from '../../helpers/db-reset';
import {
  seedPlantingSpot,
  seedPlantSpecies,
  seedSpaceWithUser,
} from '../../helpers/tenant-seed';

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

  describe('findByCriteria() with filters and sorts', () => {
    it('applies a LIKE filter on name', async () => {
      await ctx.spaceContext.run(spaceAId, async () => {
        await plantWriteRepo.save(buildPlant('Rose', userAId));
        await plantWriteRepo.save(buildPlant('Rosemary', userAId));
        await plantWriteRepo.save(buildPlant('Fern', userAId));
      });

      await ctx.spaceContext.run(spaceAId, async () => {
        const result = await plantReadRepo.findByCriteria(
          new Criteria(
            [
              {
                field: PlantQueryableField.NAME,
                operator: FilterOperator.LIKE,
                value: 'Rose',
              },
            ],
            [],
            { page: 1, perPage: 10 },
          ),
        );

        expect(result.items.map((p) => p.name).sort()).toEqual([
          'Rose',
          'Rosemary',
        ]);
      });
    });

    it('applies an EQUALS filter on plantSpeciesId', async () => {
      const speciesId = randomUUID();
      const otherSpeciesId = randomUUID();
      await seedPlantSpecies(ctx.dataSource, speciesId, 'Rosa gallica');
      await seedPlantSpecies(
        ctx.dataSource,
        otherSpeciesId,
        'Nephrolepis exaltata',
      );

      await ctx.spaceContext.run(spaceAId, async () => {
        await plantWriteRepo.save(
          new PlantBuilder()
            .withId(randomUUID())
            .withName('Rose')
            .withUserId(userAId)
            .withSpaceId(PLACEHOLDER_SPACE_ID)
            .withPlantSpeciesId(speciesId)
            .withCreatedAt(NOW)
            .withUpdatedAt(NOW)
            .build(),
        );
        await plantWriteRepo.save(
          new PlantBuilder()
            .withId(randomUUID())
            .withName('Fern')
            .withUserId(userAId)
            .withSpaceId(PLACEHOLDER_SPACE_ID)
            .withPlantSpeciesId(otherSpeciesId)
            .withCreatedAt(NOW)
            .withUpdatedAt(NOW)
            .build(),
        );
      });

      await ctx.spaceContext.run(spaceAId, async () => {
        const result = await plantReadRepo.findByCriteria(
          new Criteria(
            [
              {
                field: PlantQueryableField.PLANT_SPECIES_ID,
                operator: FilterOperator.EQUALS,
                value: speciesId,
              },
            ],
            [],
            { page: 1, perPage: 10 },
          ),
        );

        expect(result.items).toHaveLength(1);
        expect(result.items[0].name).toBe('Rose');
      });
    });

    it('applies an IN filter across multiple values', async () => {
      const spotAId = randomUUID();
      const spotBId = randomUUID();
      await seedPlantingSpot(
        ctx.dataSource,
        spotAId,
        spaceAId,
        userAId,
        'Spot A',
      );
      await seedPlantingSpot(
        ctx.dataSource,
        spotBId,
        spaceAId,
        userAId,
        'Spot B',
      );

      await ctx.spaceContext.run(spaceAId, async () => {
        await plantWriteRepo.save(
          new PlantBuilder()
            .withId(randomUUID())
            .withName('Rose')
            .withUserId(userAId)
            .withSpaceId(PLACEHOLDER_SPACE_ID)
            .withPlantingSpotId(spotAId)
            .withCreatedAt(NOW)
            .withUpdatedAt(NOW)
            .build(),
        );
        await plantWriteRepo.save(
          new PlantBuilder()
            .withId(randomUUID())
            .withName('Fern')
            .withUserId(userAId)
            .withSpaceId(PLACEHOLDER_SPACE_ID)
            .withPlantingSpotId(spotBId)
            .withCreatedAt(NOW)
            .withUpdatedAt(NOW)
            .build(),
        );
        await plantWriteRepo.save(buildPlant('Cactus', userAId));
      });

      await ctx.spaceContext.run(spaceAId, async () => {
        const result = await plantReadRepo.findByCriteria(
          new Criteria(
            [
              {
                field: PlantQueryableField.PLANTING_SPOT_ID,
                operator: FilterOperator.IN,
                value: [spotAId, spotBId],
              },
            ],
            [],
            { page: 1, perPage: 10 },
          ),
        );

        expect(result.items.map((p) => p.name).sort()).toEqual([
          'Fern',
          'Rose',
        ]);
      });
    });

    it('sorts by name ascending', async () => {
      await ctx.spaceContext.run(spaceAId, async () => {
        await plantWriteRepo.save(buildPlant('Zinnia', userAId));
        await plantWriteRepo.save(buildPlant('Aster', userAId));
        await plantWriteRepo.save(buildPlant('Marigold', userAId));
      });

      await ctx.spaceContext.run(spaceAId, async () => {
        const result = await plantReadRepo.findByCriteria(
          new Criteria(
            [],
            [{ field: PlantQueryableField.NAME, direction: SortDirection.ASC }],
            { page: 1, perPage: 10 },
          ),
        );

        expect(result.items.map((p) => p.name)).toEqual([
          'Aster',
          'Marigold',
          'Zinnia',
        ]);
      });
    });

    it('defaults to createdAt DESC when no sort is given', async () => {
      await ctx.spaceContext.run(spaceAId, async () => {
        await plantWriteRepo.save(
          new PlantBuilder()
            .withId(randomUUID())
            .withName('First')
            .withUserId(userAId)
            .withSpaceId(PLACEHOLDER_SPACE_ID)
            .withCreatedAt(new Date('2024-06-01T00:00:00.000Z'))
            .withUpdatedAt(new Date('2024-06-01T00:00:00.000Z'))
            .build(),
        );
        await plantWriteRepo.save(
          new PlantBuilder()
            .withId(randomUUID())
            .withName('Second')
            .withUserId(userAId)
            .withSpaceId(PLACEHOLDER_SPACE_ID)
            .withCreatedAt(new Date('2024-06-02T00:00:00.000Z'))
            .withUpdatedAt(new Date('2024-06-02T00:00:00.000Z'))
            .build(),
        );
      });

      await ctx.spaceContext.run(spaceAId, async () => {
        const result = await plantReadRepo.findByCriteria(
          new Criteria([], [], { page: 1, perPage: 10 }),
        );

        expect(result.items[0].name).toBe('Second');
        expect(result.items[1].name).toBe('First');
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
