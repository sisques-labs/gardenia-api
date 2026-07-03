import { randomUUID } from 'crypto';

import { Criteria, FilterOperator } from '@sisques-labs/nestjs-kit';

import {
  createIntegrationModule,
  IntegrationContext,
} from '../../helpers/integration-bootstrap';
import { truncateAll } from '../../helpers/db-reset';
import { CareLogModule } from '../../../src/contexts/care-log/care-log.module';
import {
  CARE_LOG_ENTRY_WRITE_REPOSITORY,
  ICareLogEntryWriteRepository,
} from '../../../src/contexts/care-log/domain/repositories/write/care-log-entry-write.repository';
import {
  CARE_LOG_ENTRY_READ_REPOSITORY,
  ICareLogEntryReadRepository,
} from '../../../src/contexts/care-log/domain/repositories/read/care-log-entry-read.repository';
import { CareLogEntryBuilder } from '../../../src/contexts/care-log/domain/builders/care-log-entry.builder';
import { CareLogActivityTypeEnum } from '../../../src/contexts/care-log/domain/enums/care-log-activity-type.enum';

const EARLY = new Date('2024-01-01T00:00:00.000Z');
const LATER = new Date('2024-06-01T00:00:00.000Z');

const PLACEHOLDER_SPACE_ID = randomUUID();

function buildEntry(overrides: {
  plantId: string;
  activityType?: CareLogActivityTypeEnum;
  performedAt?: Date;
}) {
  return new CareLogEntryBuilder()
    .withId(randomUUID())
    .withPlantId(overrides.plantId)
    .withUserId(randomUUID())
    .withSpaceId(PLACEHOLDER_SPACE_ID)
    .withActivityType(
      overrides.activityType ?? CareLogActivityTypeEnum.WATERING,
    )
    .withPerformedAt(overrides.performedAt ?? LATER)
    .withNotes(null)
    .withQuantity(null)
    .withUnit(null)
    .withCreatedAt(LATER)
    .withUpdatedAt(LATER)
    .build();
}

describe('CareLogEntryTypeOrmReadRepository (integration)', () => {
  let ctx: IntegrationContext;
  let writeRepo: ICareLogEntryWriteRepository;
  let readRepo: ICareLogEntryReadRepository;

  const spaceAId = randomUUID();
  const spaceBId = randomUUID();

  beforeAll(async () => {
    ctx = await createIntegrationModule({ imports: [CareLogModule] });
    writeRepo = ctx.module.get(CARE_LOG_ENTRY_WRITE_REPOSITORY);
    readRepo = ctx.module.get(CARE_LOG_ENTRY_READ_REPOSITORY);
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await truncateAll(ctx.dataSource);
  });

  describe('findByCriteria()', () => {
    it('filters by plantId using EQUALS operator', async () => {
      const targetPlantId = randomUUID();
      const otherPlantId = randomUUID();

      await ctx.spaceContext.run(spaceAId, async () => {
        await writeRepo.save(buildEntry({ plantId: targetPlantId }));
        await writeRepo.save(buildEntry({ plantId: targetPlantId }));
        await writeRepo.save(buildEntry({ plantId: otherPlantId }));
      });

      await ctx.spaceContext.run(spaceAId, async () => {
        const result = await readRepo.findByCriteria(
          new Criteria(
            [
              {
                field: 'plantId',
                operator: FilterOperator.EQUALS,
                value: targetPlantId,
              },
            ],
            [],
            { page: 1, perPage: 10 },
          ),
        );

        expect(result.items).toHaveLength(2);
        result.items.forEach((vm) => expect(vm.plantId).toBe(targetPlantId));
      });
    });

    it('returns results in descending performedAt order by default', async () => {
      const plantId = randomUUID();

      await ctx.spaceContext.run(spaceAId, async () => {
        await writeRepo.save(buildEntry({ plantId, performedAt: EARLY }));
        await writeRepo.save(buildEntry({ plantId, performedAt: LATER }));
      });

      await ctx.spaceContext.run(spaceAId, async () => {
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
            { page: 1, perPage: 10 },
          ),
        );

        expect(result.items).toHaveLength(2);
        expect(result.items[0].performedAt.getTime()).toBeGreaterThanOrEqual(
          result.items[1].performedAt.getTime(),
        );
      });
    });
  });

  describe('findLastByType()', () => {
    it('returns the latest entry of that type for the plant', async () => {
      const plantId = randomUUID();
      let laterId: string;

      await ctx.spaceContext.run(spaceAId, async () => {
        const early = buildEntry({
          plantId,
          activityType: CareLogActivityTypeEnum.WATERING,
          performedAt: EARLY,
        });
        const later = buildEntry({
          plantId,
          activityType: CareLogActivityTypeEnum.WATERING,
          performedAt: LATER,
        });

        await writeRepo.save(early);
        const savedLater = await writeRepo.save(later);
        laterId = savedLater.id.value;
      });

      await ctx.spaceContext.run(spaceAId, async () => {
        const last = await readRepo.findLastByType(
          plantId,
          CareLogActivityTypeEnum.WATERING,
        );
        expect(last).not.toBeNull();
        expect(last!.id).toBe(laterId);
      });
    });

    it('returns null when no entry of that type exists', async () => {
      const plantId = randomUUID();

      await ctx.spaceContext.run(spaceAId, async () => {
        await writeRepo.save(
          buildEntry({
            plantId,
            activityType: CareLogActivityTypeEnum.PRUNING,
          }),
        );
      });

      await ctx.spaceContext.run(spaceAId, async () => {
        const last = await readRepo.findLastByType(
          plantId,
          CareLogActivityTypeEnum.WATERING,
        );
        expect(last).toBeNull();
      });
    });
  });

  describe('Cross-space tenant isolation', () => {
    it('entries from space A are not visible in space B', async () => {
      const plantId = randomUUID();
      let entryId: string;

      await ctx.spaceContext.run(spaceAId, async () => {
        const entry = buildEntry({ plantId });
        const saved = await writeRepo.save(entry);
        entryId = saved.id.value;
      });

      await ctx.spaceContext.run(spaceBId, async () => {
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
            { page: 1, perPage: 10 },
          ),
        );
        const ids = result.items.map((vm) => vm.id);
        expect(ids).not.toContain(entryId);
      });
    });
  });
});
