import { randomUUID } from 'crypto';

import {
  Criteria,
  FilterOperator,
  SortDirection,
} from '@sisques-labs/nestjs-kit';

import { CareScheduleBuilder } from '../../../src/contexts/care-schedule/domain/builders/care-schedule.builder';
import { CareScheduleActivityTypeEnum } from '../../../src/contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
import {
  CARE_SCHEDULE_READ_REPOSITORY,
  ICareScheduleReadRepository,
} from '../../../src/contexts/care-schedule/domain/repositories/read/care-schedule-read.repository';
import {
  CARE_SCHEDULE_WRITE_REPOSITORY,
  ICareScheduleWriteRepository,
} from '../../../src/contexts/care-schedule/domain/repositories/write/care-schedule-write.repository';
import { CareScheduleModule } from '../../../src/contexts/care-schedule/care-schedule.module';
import { truncateAll } from '../../helpers/db-reset';
import {
  createIntegrationModule,
  IntegrationContext,
} from '../../helpers/integration-bootstrap';
import { seedSpaceWithUser } from '../../helpers/tenant-seed';

const PLACEHOLDER_SPACE_ID = randomUUID();

describe('CareScheduleTypeOrmReadRepository (integration)', () => {
  let ctx: IntegrationContext;
  let writeRepo: ICareScheduleWriteRepository;
  let readRepo: ICareScheduleReadRepository;

  const spaceAId = randomUUID();
  const spaceBId = randomUUID();
  const userAId = randomUUID();
  const userBId = randomUUID();
  const plantId = randomUUID();

  beforeAll(async () => {
    ctx = await createIntegrationModule({ imports: [CareScheduleModule] });
    writeRepo = ctx.module.get(CARE_SCHEDULE_WRITE_REPOSITORY);
    readRepo = ctx.module.get(CARE_SCHEDULE_READ_REPOSITORY);
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

  function buildSchedule(nextDueAt: Date) {
    return new CareScheduleBuilder()
      .withId(randomUUID())
      .withPlantId(plantId)
      .withActivityType(CareScheduleActivityTypeEnum.WATERING)
      .withIntervalDays(3)
      .withQuantity(250)
      .withUnit('ML')
      .withNotes(null)
      .withNextDueAt(nextDueAt)
      .withLastCompletedAt(null)
      .withActive(true)
      .withUserId(userAId)
      .withSpaceId(PLACEHOLDER_SPACE_ID)
      .withCreatedAt(nextDueAt)
      .withUpdatedAt(nextDueAt)
      .build();
  }

  it('defaults to nextDueAt ASC when no sort is given', async () => {
    await ctx.spaceContext.run(spaceAId, async () => {
      await writeRepo.save(buildSchedule(new Date('2026-08-01')));
      await writeRepo.save(buildSchedule(new Date('2026-06-01')));

      const result = await readRepo.findByCriteria(
        new Criteria([], [], { page: 1, perPage: 10 }),
      );
      expect(result.items.map((s) => s.nextDueAt.toISOString())).toEqual([
        new Date('2026-06-01').toISOString(),
        new Date('2026-08-01').toISOString(),
      ]);
    });
  });

  it('honors a client-supplied sort over the default', async () => {
    await ctx.spaceContext.run(spaceAId, async () => {
      await writeRepo.save(buildSchedule(new Date('2026-06-01')));
      await writeRepo.save(buildSchedule(new Date('2026-08-01')));

      const result = await readRepo.findByCriteria(
        new Criteria(
          [],
          [{ field: 'nextDueAt', direction: SortDirection.DESC }],
          { page: 1, perPage: 10 },
        ),
      );
      expect(result.items.map((s) => s.nextDueAt.toISOString())).toEqual([
        new Date('2026-08-01').toISOString(),
        new Date('2026-06-01').toISOString(),
      ]);
    });
  });

  it('filters by the due_before virtual filter', async () => {
    await ctx.spaceContext.run(spaceAId, async () => {
      await writeRepo.save(buildSchedule(new Date('2026-06-01')));
      await writeRepo.save(buildSchedule(new Date('2026-12-01')));

      const result = await readRepo.findByCriteria(
        new Criteria(
          [
            {
              field: 'due_before',
              operator: FilterOperator.EQUALS,
              value: new Date('2026-08-01'),
            },
          ],
          [],
          { page: 1, perPage: 10 },
        ),
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].nextDueAt.toISOString()).toBe(
        new Date('2026-06-01').toISOString(),
      );
    });
  });

  it('scopes findByCriteria to the active space', async () => {
    await ctx.spaceContext.run(spaceAId, async () => {
      await writeRepo.save(buildSchedule(new Date('2026-06-01')));
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
