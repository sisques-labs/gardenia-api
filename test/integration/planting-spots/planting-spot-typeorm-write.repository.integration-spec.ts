import { randomUUID } from 'crypto';

import { PlantingSpotBuilder } from '../../../src/contexts/planting-spots/domain/builders/planting-spot.builder';
import { PlantingSpotTypeEnum } from '../../../src/contexts/planting-spots/domain/enums/planting-spot-type.enum';
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

// spaceId is overwritten by the tenant proxy at save time, but the builder
// requires a valid UUID — pass a dummy UUID that satisfies the VO constraint.
const PLACEHOLDER_SPACE_ID = randomUUID();

function buildSpot(name: string, userId?: string) {
  return new PlantingSpotBuilder()
    .withId(randomUUID())
    .withName(name)
    .withType(PlantingSpotTypeEnum.RAISED_BED)
    .withUserId(userId ?? randomUUID())
    .withSpaceId(PLACEHOLDER_SPACE_ID)
    .withCreatedAt(NOW)
    .withUpdatedAt(NOW)
    .build();
}

describe('PlantingSpotTypeOrmWriteRepository (integration)', () => {
  let ctx: IntegrationContext;
  let writeRepo: IPlantingSpotWriteRepository;

  const spaceAId = randomUUID();
  const spaceBId = randomUUID();

  beforeAll(async () => {
    ctx = await createIntegrationModule({ imports: [PlantingSpotsModule] });
    writeRepo = ctx.module.get(PLANTING_SPOT_WRITE_REPOSITORY);
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await truncateAll(ctx.dataSource);
  });

  describe('save() and findById()', () => {
    it('persists a spot and findById returns it in the same space context', async () => {
      let spotId: string;

      await ctx.spaceContext.run(spaceAId, async () => {
        const spot = buildSpot('Bancal Norte');
        await writeRepo.save(spot);
        spotId = spot.id.value;
      });

      await ctx.spaceContext.run(spaceAId, async () => {
        const found = await writeRepo.findById(spotId, spaceAId);
        expect(found).not.toBeNull();
        expect(found!.name.value).toBe('Bancal Norte');
      });
    });

    it('findById() returns null for an unknown id', async () => {
      await ctx.spaceContext.run(spaceAId, async () => {
        const found = await writeRepo.findById(randomUUID(), spaceAId);
        expect(found).toBeNull();
      });
    });
  });

  describe('delete()', () => {
    it('removes the spot so findById returns null afterwards', async () => {
      let spotId: string;

      await ctx.spaceContext.run(spaceAId, async () => {
        const spot = buildSpot('To Delete');
        await writeRepo.save(spot);
        spotId = spot.id.value;
      });

      await ctx.spaceContext.run(spaceAId, async () => {
        await writeRepo.delete(spotId);
        const found = await writeRepo.findById(spotId, spaceAId);
        expect(found).toBeNull();
      });
    });
  });

  describe('Cross-space tenant isolation (SC-15)', () => {
    it('spot saved in space A is NOT findable in space B context', async () => {
      let spotId: string;

      await ctx.spaceContext.run(spaceAId, async () => {
        const spot = buildSpot('Space A Spot');
        await writeRepo.save(spot);
        spotId = spot.id.value;
      });

      // Querying with spaceBId should return null — tenant isolation
      await ctx.spaceContext.run(spaceBId, async () => {
        const found = await writeRepo.findById(spotId, spaceBId);
        expect(found).toBeNull();
      });
    });

    it('delete in space A does not affect spots in space B', async () => {
      let spotAId: string;
      let spotBId: string;

      await ctx.spaceContext.run(spaceAId, async () => {
        const spot = buildSpot('Spot A');
        await writeRepo.save(spot);
        spotAId = spot.id.value;
      });

      await ctx.spaceContext.run(spaceBId, async () => {
        const spot = buildSpot('Spot B');
        await writeRepo.save(spot);
        spotBId = spot.id.value;
      });

      await ctx.spaceContext.run(spaceAId, async () => {
        await writeRepo.delete(spotAId);
      });

      await ctx.spaceContext.run(spaceBId, async () => {
        const found = await writeRepo.findById(spotBId, spaceBId);
        expect(found).not.toBeNull();
        expect(found!.name.value).toBe('Spot B');
      });
    });
  });
});
