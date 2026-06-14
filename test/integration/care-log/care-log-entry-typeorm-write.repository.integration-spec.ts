import { randomUUID } from 'crypto';

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
import { CareLogUnitEnum } from '../../../src/contexts/care-log/domain/enums/care-log-unit.enum';

const NOW = new Date('2024-06-01T00:00:00.000Z');
const PAST = new Date('2024-05-01T00:00:00.000Z');

const PLACEHOLDER_SPACE_ID = randomUUID();

function buildEntry(overrides?: {
  plantId?: string;
  activityType?: CareLogActivityTypeEnum;
  performedAt?: Date;
  notes?: string | null;
  quantity?: number | null;
  unit?: string | null;
  userId?: string;
}) {
  return new CareLogEntryBuilder()
    .withId(randomUUID())
    .withPlantId(overrides?.plantId ?? randomUUID())
    .withUserId(overrides?.userId ?? randomUUID())
    .withSpaceId(PLACEHOLDER_SPACE_ID)
    .withActivityType(overrides?.activityType ?? CareLogActivityTypeEnum.WATERING)
    .withPerformedAt(overrides?.performedAt ?? NOW)
    .withNotes(overrides?.notes !== undefined ? overrides.notes : null)
    .withQuantity(overrides?.quantity !== undefined ? overrides.quantity : null)
    .withUnit(overrides?.unit !== undefined ? overrides.unit : null)
    .withCreatedAt(NOW)
    .withUpdatedAt(NOW)
    .build();
}

describe('CareLogEntryTypeOrmWriteRepository (integration)', () => {
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

  describe('save() and findById()', () => {
    it('round-trips all fields including nullable ones', async () => {
      const plantId = randomUUID();
      const userId = randomUUID();
      let entryId: string;

      await ctx.spaceContext.run(spaceAId, async () => {
        const entry = new CareLogEntryBuilder()
          .withId(randomUUID())
          .withPlantId(plantId)
          .withUserId(userId)
          .withSpaceId(PLACEHOLDER_SPACE_ID)
          .withActivityType(CareLogActivityTypeEnum.FERTILIZING)
          .withPerformedAt(NOW)
          .withNotes('Some notes')
          .withQuantity(250)
          .withUnit(CareLogUnitEnum.ML)
          .withCreatedAt(NOW)
          .withUpdatedAt(NOW)
          .build();

        const saved = await writeRepo.save(entry);
        entryId = saved.id.value;
      });

      await ctx.spaceContext.run(spaceAId, async () => {
        const found = await writeRepo.findById(entryId);
        expect(found).not.toBeNull();
        expect(found!.toPrimitives().activityType).toBe(CareLogActivityTypeEnum.FERTILIZING);
        expect(found!.toPrimitives().notes).toBe('Some notes');
        expect(Number(found!.toPrimitives().quantity)).toBe(250);
        expect(found!.toPrimitives().unit).toBe(CareLogUnitEnum.ML);
        expect(found!.toPrimitives().plantId).toBe(plantId);
        expect(found!.toPrimitives().userId).toBe(userId);
      });
    });

    it('round-trips an entry with null optional fields', async () => {
      let entryId: string;

      await ctx.spaceContext.run(spaceAId, async () => {
        const entry = buildEntry({ notes: null, quantity: null, unit: null });
        const saved = await writeRepo.save(entry);
        entryId = saved.id.value;
      });

      await ctx.spaceContext.run(spaceAId, async () => {
        const found = await writeRepo.findById(entryId);
        expect(found).not.toBeNull();
        expect(found!.toPrimitives().notes).toBeNull();
        expect(found!.toPrimitives().quantity).toBeNull();
        expect(found!.toPrimitives().unit).toBeNull();
      });
    });
  });

  describe('delete()', () => {
    it('removes the record so findById returns null', async () => {
      let entryId: string;

      await ctx.spaceContext.run(spaceAId, async () => {
        const entry = buildEntry();
        const saved = await writeRepo.save(entry);
        entryId = saved.id.value;
      });

      await ctx.spaceContext.run(spaceAId, async () => {
        await writeRepo.delete(entryId);
        const found = await writeRepo.findById(entryId);
        expect(found).toBeNull();
      });
    });
  });

  describe('findLastByType()', () => {
    it('returns the most recent entry for that type via read repository', async () => {
      const plantId = randomUUID();
      let newerEntryId: string;

      await ctx.spaceContext.run(spaceAId, async () => {
        const older = buildEntry({
          plantId,
          activityType: CareLogActivityTypeEnum.WATERING,
          performedAt: PAST,
        });

        const newer = buildEntry({
          plantId,
          activityType: CareLogActivityTypeEnum.WATERING,
          performedAt: NOW,
        });

        await writeRepo.save(older);
        const savedNewer = await writeRepo.save(newer);
        newerEntryId = savedNewer.id.value;
      });

      await ctx.spaceContext.run(spaceAId, async () => {
        const last = await readRepo.findLastByType(plantId, CareLogActivityTypeEnum.WATERING);
        expect(last).not.toBeNull();
        expect(last!.id).toBe(newerEntryId);
      });
    });
  });

  describe('Cross-space tenant isolation', () => {
    it('entry saved in space A is not visible in space B context', async () => {
      let entryId: string;

      await ctx.spaceContext.run(spaceAId, async () => {
        const entry = buildEntry();
        const saved = await writeRepo.save(entry);
        entryId = saved.id.value;
      });

      await ctx.spaceContext.run(spaceBId, async () => {
        const found = await writeRepo.findById(entryId);
        expect(found).toBeNull();
      });
    });
  });
});
