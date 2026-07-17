import { Repository } from 'typeorm';

import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
import { CareScheduleUnitEnum } from '@contexts/care-schedule/domain/enums/care-schedule-unit.enum';
import { CareScheduleBuilder } from '@contexts/care-schedule/domain/builders/care-schedule.builder';
import { CareScheduleTypeOrmEntity } from '../entities/care-schedule.entity';
import { CareScheduleTypeOrmMapper } from '../mappers/care-schedule-typeorm.mapper';
import { CareScheduleTypeOrmWriteRepository } from './care-schedule-typeorm-write.repository';

const SCHEDULE_ID = '550e8400-e29b-41d4-a716-446655440000';
const PLANT_ID = '110e8400-e29b-41d4-a716-446655440010';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';

const buildEntity = (
  overrides: Partial<CareScheduleTypeOrmEntity> = {},
): CareScheduleTypeOrmEntity => {
  const e = new CareScheduleTypeOrmEntity();
  e.id = SCHEDULE_ID;
  e.plantId = PLANT_ID;
  e.activityType = CareScheduleActivityTypeEnum.FERTILIZING;
  e.intervalDays = 14;
  e.quantity = '250.000';
  e.unit = CareScheduleUnitEnum.ML;
  e.notes = 'Liquid feed';
  e.nextDueAt = new Date('2026-07-01');
  e.lastCompletedAt = null;
  e.active = true;
  e.userId = USER_ID;
  e.spaceId = SPACE_ID;
  e.createdAt = new Date('2026-01-01');
  e.updatedAt = new Date('2026-01-01');
  return { ...e, ...overrides };
};

const buildAggregate = () =>
  new CareScheduleBuilder()
    .withId(SCHEDULE_ID)
    .withPlantId(PLANT_ID)
    .withActivityType(CareScheduleActivityTypeEnum.FERTILIZING)
    .withIntervalDays(14)
    .withQuantity(250)
    .withUnit(CareScheduleUnitEnum.ML)
    .withNotes('Liquid feed')
    .withNextDueAt(new Date('2026-07-01'))
    .withLastCompletedAt(null)
    .withActive(true)
    .withUserId(USER_ID)
    .withSpaceId(SPACE_ID)
    .withCreatedAt(new Date('2026-01-01'))
    .withUpdatedAt(new Date('2026-01-01'))
    .build();

describe('CareScheduleTypeOrmWriteRepository', () => {
  let repository: CareScheduleTypeOrmWriteRepository;
  let rawRepo: jest.Mocked<Repository<CareScheduleTypeOrmEntity>>;
  let mapper: CareScheduleTypeOrmMapper;

  beforeEach(() => {
    rawRepo = {
      save: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<CareScheduleTypeOrmEntity>>;

    mapper = new CareScheduleTypeOrmMapper(new CareScheduleBuilder());

    const spaceContext = {
      require: jest.fn().mockReturnValue(SPACE_ID),
    } as any;

    repository = new CareScheduleTypeOrmWriteRepository(
      mapper,
      rawRepo,
      spaceContext,
    );
  });

  describe('save()', () => {
    it('persists the aggregate and returns domain object', async () => {
      rawRepo.save.mockResolvedValue(buildEntity());
      const aggregate = buildAggregate();

      const result = await repository.save(aggregate);

      expect(rawRepo.save).toHaveBeenCalledTimes(1);
      expect(result.toPrimitives().id).toBe(SCHEDULE_ID);
    });
  });

  describe('findById()', () => {
    it('returns aggregate when entity is found', async () => {
      rawRepo.findOne.mockResolvedValue(buildEntity());

      const result = await repository.findById(SCHEDULE_ID);

      expect(result).not.toBeNull();
      expect(result!.toPrimitives().id).toBe(SCHEDULE_ID);
    });

    it('returns null when entity is not found', async () => {
      rawRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByCriteria()', () => {
    it('returns paginated aggregates ignoring the criteria argument', async () => {
      rawRepo.findAndCount.mockResolvedValue([[buildEntity()], 1]);

      const result = await repository.findByCriteria(undefined as any);

      expect(rawRepo.findAndCount).toHaveBeenCalledTimes(1);
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.perPage).toBe(20);
    });

    it('returns empty result when no schedules exist', async () => {
      rawRepo.findAndCount.mockResolvedValue([[], 0]);

      const result = await repository.findByCriteria(undefined as any);

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('delete()', () => {
    it('calls delete on the underlying repository', async () => {
      rawRepo.delete.mockResolvedValue({ affected: 1, raw: {} });

      await repository.delete(SCHEDULE_ID);

      expect(rawRepo.delete).toHaveBeenCalledTimes(1);
    });
  });
});
