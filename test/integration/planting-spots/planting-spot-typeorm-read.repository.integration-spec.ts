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

import {
  createIntegrationModule,
  IntegrationContext,
} from '../../helpers/integration-bootstrap';
import { truncateAll } from '../../helpers/db-reset';

const NOW = new Date('2024-06-01T00:00:00.000Z');

// spaceId placeholder — overwritten by tenant proxy at save time
const PLACEHOLDER_SPACE_ID = randomUUID();

function buildSpot(
  name: string,
  type: PlantingSpotTypeEnum = PlantingSpotTypeEnum.RAISED_BED,
) {
  return new PlantingSpotBuilder()
    .withId(randomUUID())
    .withName(name)
    .withType(type)
    .withUserId(randomUUID())
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
  });

  describe('findById()', () => {
    it('returns PlantingSpotViewModel for an existing spot (SC-10)', async () => {
      let spotId: string;

      await ctx.spaceContext.run(spaceAId, async () => {
        const spot = buildSpot('Bancal Norte');
        await writeRepo.save(spot);
        spotId = spot.id.value;
      });

      await ctx.spaceContext.run(spaceAId, async () => {
        const vm = await readRepo.findById(spotId, spaceAId);
        expect(vm).not.toBeNull();
        expect(vm!.id).toBe(spotId);
        expect(vm!.name).toBe('Bancal Norte');
      });
    });

    it('returns null for an unknown id', async () => {
      await ctx.spaceContext.run(spaceAId, async () => {
        const vm = await readRepo.findById(randomUUID(), spaceAId);
        expect(vm).toBeNull();
      });
    });

    it('returns null when querying a spot with a different spaceId (SC-11 / SC-14)', async () => {
      let spotId: string;

      await ctx.spaceContext.run(spaceAId, async () => {
        const spot = buildSpot('Spot in A');
        await writeRepo.save(spot);
        spotId = spot.id.value;
      });

      // SC-14: querying from space B should return null — tenant isolation
      await ctx.spaceContext.run(spaceBId, async () => {
        const vm = await readRepo.findById(spotId, spaceBId);
        expect(vm).toBeNull();
      });
    });
  });

  describe('findByCriteria()', () => {
    it('returns paginated results scoped to the active space (SC-12)', async () => {
      await ctx.spaceContext.run(spaceAId, async () => {
        await writeRepo.save(buildSpot('Spot 1'));
        await writeRepo.save(buildSpot('Spot 2'));
      });

      await ctx.spaceContext.run(spaceBId, async () => {
        await writeRepo.save(buildSpot('Spot B'));
      });

      await ctx.spaceContext.run(spaceAId, async () => {
        const result = await readRepo.findByCriteria({
          spaceId: spaceAId,
          page: 1,
          limit: 10,
        });
        expect(result.items).toHaveLength(2);
        expect(result.total).toBe(2);
        const names = result.items.map((p) => p.name).sort();
        expect(names).toEqual(['Spot 1', 'Spot 2']);
      });

      await ctx.spaceContext.run(spaceBId, async () => {
        const result = await readRepo.findByCriteria({
          spaceId: spaceBId,
          page: 1,
          limit: 10,
        });
        expect(result.items).toHaveLength(1);
        expect(result.total).toBe(1);
        expect(result.items[0].name).toBe('Spot B');
      });
    });

    it('type filter returns only matching spots (SC-13)', async () => {
      await ctx.spaceContext.run(spaceAId, async () => {
        await writeRepo.save(buildSpot('Pot Spot', PlantingSpotTypeEnum.POT));
        await writeRepo.save(
          buildSpot('Bed Spot', PlantingSpotTypeEnum.RAISED_BED),
        );
        await writeRepo.save(
          buildSpot('Container Spot', PlantingSpotTypeEnum.CONTAINER),
        );
      });

      await ctx.spaceContext.run(spaceAId, async () => {
        const result = await readRepo.findByCriteria({
          spaceId: spaceAId,
          type: PlantingSpotTypeEnum.POT,
          page: 1,
          limit: 10,
        });

        expect(result.items).toHaveLength(1);
        expect(result.total).toBe(1);
        expect(result.items[0].type).toBe(PlantingSpotTypeEnum.POT);
        expect(result.items[0].name).toBe('Pot Spot');
      });
    });

    it('empty space returns empty list with 200 (SC-14)', async () => {
      await ctx.spaceContext.run(spaceAId, async () => {
        const result = await readRepo.findByCriteria({
          spaceId: spaceAId,
          page: 1,
          limit: 10,
        });
        expect(result.items).toHaveLength(0);
        expect(result.total).toBe(0);
      });
    });

    it('cross-space: spots from space A not visible in space B (SC-15)', async () => {
      let spotAId: string;

      await ctx.spaceContext.run(spaceAId, async () => {
        const spot = buildSpot('Cross-space Spot');
        await writeRepo.save(spot);
        spotAId = spot.id.value;
      });

      await ctx.spaceContext.run(spaceBId, async () => {
        const result = await readRepo.findByCriteria({
          spaceId: spaceBId,
          page: 1,
          limit: 10,
        });
        const ids = result.items.map((p) => p.id);
        expect(ids).not.toContain(spotAId);
        expect(result.total).toBe(0);
      });
    });
  });
});
