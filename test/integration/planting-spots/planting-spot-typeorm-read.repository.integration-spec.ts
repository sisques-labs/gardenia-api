import { randomUUID } from 'crypto';

import { PlantingSpotBuilder } from '../../../src/contexts/planting-spots/domain/builders/planting-spot.builder';
import { PlantingSpotTypeEnum } from '../../../src/contexts/planting-spots/domain/enums/planting-spot-type.enum';
import {
  IPlantingSpotReadRepository,
  PLANTING_SPOT_READ_REPOSITORY,
} from '../../../src/contexts/planting-spots/domain/repositories/read/planting-spot-read.repository';
import {
  IPlantingSpotWriteRepository,
  PLANTING_SPOT_WRITE_REPOSITORY,
} from '../../../src/contexts/planting-spots/domain/repositories/write/planting-spot-write.repository';
import { PlantingSpotsModule } from '../../../src/contexts/planting-spots/planting-spots.module';
import { PlantingSpotQueryableField } from '../../../src/contexts/planting-spots/transport/graphql/enums/planting-spot-queryable-field.enum';
import { Criteria, FilterOperator } from '@sisques-labs/nestjs-kit';

import {
  createIntegrationModule,
  IntegrationContext,
} from '../../helpers/integration-bootstrap';
import { truncateAll } from '../../helpers/db-reset';
import { seedSpaceWithUser } from '../../helpers/tenant-seed';

const NOW = new Date('2024-06-01T00:00:00.000Z');

// spaceId placeholder — overwritten by tenant proxy at save time
const PLACEHOLDER_SPACE_ID = randomUUID();

function buildSpot(
  name: string,
  userId: string,
  type: PlantingSpotTypeEnum = PlantingSpotTypeEnum.RAISED_BED,
) {
  return new PlantingSpotBuilder()
    .withId(randomUUID())
    .withName(name)
    .withType(type)
    .withUserId(userId)
    .withSpaceId(PLACEHOLDER_SPACE_ID)
    .withCreatedAt(NOW)
    .withUpdatedAt(NOW)
    .build();
}

describe('PlantingSpotTypeOrmReadRepository (integration)', () => {
  let ctx: IntegrationContext;
  let writeRepo: IPlantingSpotWriteRepository;
  let readRepo: IPlantingSpotReadRepository;

  const spaceAId = randomUUID();
  const spaceBId = randomUUID();
  const userAId = randomUUID();
  const userBId = randomUUID();

  beforeAll(async () => {
    ctx = await createIntegrationModule({ imports: [PlantingSpotsModule] });
    writeRepo = ctx.module.get(PLANTING_SPOT_WRITE_REPOSITORY);
    readRepo = ctx.module.get(PLANTING_SPOT_READ_REPOSITORY);
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
    it('returns PlantingSpotViewModel for an existing spot (SC-10)', async () => {
      let spotId: string;

      await ctx.spaceContext.run(spaceAId, async () => {
        const spot = buildSpot('Bancal Norte', userAId);
        await writeRepo.save(spot);
        spotId = spot.id.value;
      });

      await ctx.spaceContext.run(spaceAId, async () => {
        const vm = await readRepo.findById(spotId);
        expect(vm).not.toBeNull();
        expect(vm!.id).toBe(spotId);
        expect(vm!.name).toBe('Bancal Norte');
      });
    });

    it('returns null for an unknown id', async () => {
      await ctx.spaceContext.run(spaceAId, async () => {
        const vm = await readRepo.findById(randomUUID());
        expect(vm).toBeNull();
      });
    });

    it('returns null when querying a spot with a different spaceId (SC-11 / SC-14)', async () => {
      let spotId: string;

      await ctx.spaceContext.run(spaceAId, async () => {
        const spot = buildSpot('Spot in A', userAId);
        await writeRepo.save(spot);
        spotId = spot.id.value;
      });

      // SC-14: querying from space B should return null — tenant isolation
      await ctx.spaceContext.run(spaceBId, async () => {
        const vm = await readRepo.findById(spotId);
        expect(vm).toBeNull();
      });
    });
  });

  describe('findByCriteria()', () => {
    it('returns paginated results scoped to the active space (SC-12)', async () => {
      await ctx.spaceContext.run(spaceAId, async () => {
        await writeRepo.save(buildSpot('Spot 1', userAId));
        await writeRepo.save(buildSpot('Spot 2', userAId));
      });

      await ctx.spaceContext.run(spaceBId, async () => {
        await writeRepo.save(buildSpot('Spot B', userBId));
      });

      await ctx.spaceContext.run(spaceAId, async () => {
        const result = await readRepo.findByCriteria(
          new Criteria([], [], { page: 1, perPage: 10 }),
        );
        expect(result.items).toHaveLength(2);
        expect(result.total).toBe(2);
        const names = result.items.map((p) => p.name).sort();
        expect(names).toEqual(['Spot 1', 'Spot 2']);
      });

      await ctx.spaceContext.run(spaceBId, async () => {
        const result = await readRepo.findByCriteria(
          new Criteria([], [], { page: 1, perPage: 10 }),
        );
        expect(result.items).toHaveLength(1);
        expect(result.total).toBe(1);
        expect(result.items[0].name).toBe('Spot B');
      });
    });

    it('empty space returns empty list (SC-14)', async () => {
      await ctx.spaceContext.run(spaceAId, async () => {
        const result = await readRepo.findByCriteria(
          new Criteria([], [], { page: 1, perPage: 10 }),
        );
        expect(result.items).toHaveLength(0);
        expect(result.total).toBe(0);
      });
    });

    it('cross-space: spots from space A not visible in space B (SC-15)', async () => {
      let spotAId: string;

      await ctx.spaceContext.run(spaceAId, async () => {
        const spot = buildSpot('Cross-space Spot', userAId);
        await writeRepo.save(spot);
        spotAId = spot.id.value;
      });

      await ctx.spaceContext.run(spaceBId, async () => {
        const result = await readRepo.findByCriteria(
          new Criteria([], [], { page: 1, perPage: 10 }),
        );
        const ids = result.items.map((p) => p.id);
        expect(ids).not.toContain(spotAId);
        expect(result.total).toBe(0);
      });
    });

    it('applies a LIKE filter on name', async () => {
      await ctx.spaceContext.run(spaceAId, async () => {
        await writeRepo.save(buildSpot('North Bed', userAId));
        await writeRepo.save(buildSpot('South Bed', userAId));
        await writeRepo.save(buildSpot('Greenhouse', userAId));
      });

      await ctx.spaceContext.run(spaceAId, async () => {
        const result = await readRepo.findByCriteria(
          new Criteria(
            [
              {
                field: PlantingSpotQueryableField.NAME,
                operator: FilterOperator.LIKE,
                value: 'Bed',
              },
            ],
            [],
            { page: 1, perPage: 10 },
          ),
        );

        expect(result.items.map((s) => s.name).sort()).toEqual([
          'North Bed',
          'South Bed',
        ]);
      });
    });

    it('applies an EQUALS filter on type', async () => {
      await ctx.spaceContext.run(spaceAId, async () => {
        await writeRepo.save(
          buildSpot('Pot 1', userAId, PlantingSpotTypeEnum.POT),
        );
        await writeRepo.save(
          buildSpot('Bed 1', userAId, PlantingSpotTypeEnum.RAISED_BED),
        );
      });

      await ctx.spaceContext.run(spaceAId, async () => {
        const result = await readRepo.findByCriteria(
          new Criteria(
            [
              {
                field: PlantingSpotQueryableField.TYPE,
                operator: FilterOperator.EQUALS,
                value: PlantingSpotTypeEnum.POT,
              },
            ],
            [],
            { page: 1, perPage: 10 },
          ),
        );

        expect(result.items).toHaveLength(1);
        expect(result.items[0].name).toBe('Pot 1');
      });
    });
  });
});
