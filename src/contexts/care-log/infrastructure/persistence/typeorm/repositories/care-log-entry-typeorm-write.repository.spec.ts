import { Repository } from 'typeorm';

import { CareLogActivityTypeEnum } from '@contexts/care-log/domain/enums/care-log-activity-type.enum';
import { CareLogUnitEnum } from '@contexts/care-log/domain/enums/care-log-unit.enum';
import { CareLogEntryBuilder } from '@contexts/care-log/domain/builders/care-log-entry.builder';
import { CareLogEntryTypeOrmEntity } from '../entities/care-log-entry.entity';
import { CareLogEntryTypeOrmMapper } from '../mappers/care-log-entry-typeorm.mapper';
import { CareLogEntryTypeOrmWriteRepository } from './care-log-entry-typeorm-write.repository';

const ENTRY_ID = '550e8400-e29b-41d4-a716-446655440000';
const PLANT_ID = '110e8400-e29b-41d4-a716-446655440000';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';

const buildEntity = (
  overrides: Partial<CareLogEntryTypeOrmEntity> = {},
): CareLogEntryTypeOrmEntity => {
  const e = new CareLogEntryTypeOrmEntity();
  e.id = ENTRY_ID;
  e.plantId = PLANT_ID;
  e.userId = USER_ID;
  e.spaceId = SPACE_ID;
  e.activityType = CareLogActivityTypeEnum.WATERING;
  e.performedAt = new Date('2026-06-01');
  e.notes = 'Watered well';
  e.quantity = 500;
  e.unit = CareLogUnitEnum.ML;
  e.createdAt = new Date('2026-01-01');
  e.updatedAt = new Date('2026-01-01');
  return { ...e, ...overrides };
};

const buildAggregate = () =>
  new CareLogEntryBuilder()
    .withId(ENTRY_ID)
    .withPlantId(PLANT_ID)
    .withUserId(USER_ID)
    .withSpaceId(SPACE_ID)
    .withActivityType(CareLogActivityTypeEnum.WATERING)
    .withPerformedAt(new Date('2026-06-01'))
    .withNotes('Watered well')
    .withQuantity(500)
    .withUnit(CareLogUnitEnum.ML)
    .withCreatedAt(new Date('2026-01-01'))
    .withUpdatedAt(new Date('2026-01-01'))
    .build();

describe('CareLogEntryTypeOrmWriteRepository', () => {
  let repository: CareLogEntryTypeOrmWriteRepository;
  let rawRepo: jest.Mocked<Repository<CareLogEntryTypeOrmEntity>>;
  let mapper: CareLogEntryTypeOrmMapper;

  beforeEach(() => {
    rawRepo = {
      save: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<CareLogEntryTypeOrmEntity>>;

    mapper = new CareLogEntryTypeOrmMapper(new CareLogEntryBuilder());

    const spaceContext = {
      require: jest.fn().mockReturnValue(SPACE_ID),
    } as any;

    repository = new CareLogEntryTypeOrmWriteRepository(
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
      expect(result.toPrimitives().id).toBe(ENTRY_ID);
    });
  });

  describe('findById()', () => {
    it('returns aggregate when entity is found', async () => {
      rawRepo.findOne.mockResolvedValue(buildEntity());

      const result = await repository.findById(ENTRY_ID);

      expect(result).not.toBeNull();
      expect(result!.toPrimitives().id).toBe(ENTRY_ID);
    });

    it('returns null when entity is not found', async () => {
      rawRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByCriteria()', () => {
    it('throws not implemented', async () => {
      await expect(repository.findByCriteria(undefined as any)).rejects.toThrow(
        'Method not implemented.',
      );
    });
  });

  describe('delete()', () => {
    it('calls delete on the underlying repository', async () => {
      rawRepo.delete.mockResolvedValue({ affected: 1, raw: {} });

      await repository.delete(ENTRY_ID);

      expect(rawRepo.delete).toHaveBeenCalledTimes(1);
    });
  });
});
