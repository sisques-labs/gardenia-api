import { randomUUID } from 'crypto';

import { CareScheduleBuilder } from '../../../src/contexts/care-schedule/domain/builders/care-schedule.builder';
import { CareScheduleActivityTypeEnum } from '../../../src/contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
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

const NOW = new Date('2026-06-27T00:00:00.000Z');
const PLACEHOLDER_SPACE_ID = randomUUID();

describe('CareScheduleTypeOrmWriteRepository (integration)', () => {
  let ctx: IntegrationContext;
  let writeRepo: ICareScheduleWriteRepository;

  const spaceAId = randomUUID();
  const spaceBId = randomUUID();
  const userAId = randomUUID();
  const userBId = randomUUID();
  const plantId = randomUUID();

  beforeAll(async () => {
    ctx = await createIntegrationModule({ imports: [CareScheduleModule] });
    writeRepo = ctx.module.get(CARE_SCHEDULE_WRITE_REPOSITORY);
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

  function buildSchedule(): CareScheduleBuilder {
    return new CareScheduleBuilder()
      .withId(randomUUID())
      .withPlantId(plantId)
      .withActivityType(CareScheduleActivityTypeEnum.WATERING)
      .withIntervalDays(3)
      .withQuantity(250)
      .withUnit('ML')
      .withNotes('Morning watering')
      .withNextDueAt(NOW)
      .withLastCompletedAt(null)
      .withActive(true)
      .withUserId(userAId)
      .withSpaceId(PLACEHOLDER_SPACE_ID)
      .withCreatedAt(NOW)
      .withUpdatedAt(NOW);
  }

  it('round-trips a schedule with optional fields', async () => {
    let id: string;
    await ctx.spaceContext.run(spaceAId, async () => {
      const schedule = buildSchedule().build();
      await writeRepo.save(schedule);
      id = schedule.id.value;
    });

    await ctx.spaceContext.run(spaceAId, async () => {
      const found = await writeRepo.findById(id);
      expect(found).not.toBeNull();
      const p = found!.toPrimitives();
      expect(p.plantId).toBe(plantId);
      expect(p.intervalDays).toBe(3);
      expect(p.quantity).toBe(250);
      expect(p.unit).toBe('ML');
      expect(p.active).toBe(true);
    });
  });

  it('does not find a schedule created in another space', async () => {
    let id: string;
    await ctx.spaceContext.run(spaceAId, async () => {
      const schedule = buildSchedule().build();
      await writeRepo.save(schedule);
      id = schedule.id.value;
    });

    await ctx.spaceContext.run(spaceBId, async () => {
      const found = await writeRepo.findById(id);
      expect(found).toBeNull();
    });
  });

  it('completing advances nextDueAt and persists', async () => {
    let id: string;
    await ctx.spaceContext.run(spaceAId, async () => {
      const schedule = buildSchedule().build();
      schedule.complete(new Date('2026-06-27T00:00:00.000Z'));
      await writeRepo.save(schedule);
      id = schedule.id.value;
    });

    await ctx.spaceContext.run(spaceAId, async () => {
      const found = await writeRepo.findById(id);
      const p = found!.toPrimitives();
      expect(p.lastCompletedAt).not.toBeNull();
      expect(p.nextDueAt).toEqual(new Date('2026-06-30T00:00:00.000Z'));
    });
  });
});
