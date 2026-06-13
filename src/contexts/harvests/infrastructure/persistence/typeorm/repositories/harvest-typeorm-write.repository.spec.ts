import { Repository } from 'typeorm';

import { HarvestUnitEnum } from '@contexts/harvests/domain/enums/harvest-unit.enum';
import { HarvestBuilder } from '@contexts/harvests/domain/builders/harvest.builder';
import { HarvestTypeOrmEntity } from '../entities/harvest.entity';
import { HarvestTypeOrmMapper } from '../mappers/harvest-typeorm.mapper';
import { HarvestTypeOrmWriteRepository } from './harvest-typeorm-write.repository';

const HARVEST_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';

const buildEntity = (
  overrides: Partial<HarvestTypeOrmEntity> = {},
): HarvestTypeOrmEntity => {
  const e = new HarvestTypeOrmEntity();
  e.id = HARVEST_ID;
  e.cropType = 'Tomate Cherry';
  e.quantity = '2.500';
  e.unit = HarvestUnitEnum.KG;
  e.harvestedAt = new Date('2026-06-01');
  e.userId = USER_ID;
  e.spaceId = SPACE_ID;
  e.createdAt = new Date('2026-01-01');
  e.updatedAt = new Date('2026-01-01');
  return { ...e, ...overrides };
};

const buildAggregate = () =>
  new HarvestBuilder()
    .withId(HARVEST_ID)
    .withCropType('Tomate Cherry')
    .withQuantity(2.5)
    .withUnit(HarvestUnitEnum.KG)
    .withHarvestedAt(new Date('2026-06-01'))
    .withUserId(USER_ID)
    .withSpaceId(SPACE_ID)
    .withCreatedAt(new Date('2026-01-01'))
    .withUpdatedAt(new Date('2026-01-01'))
    .build();

describe('HarvestTypeOrmWriteRepository', () => {
  let repository: HarvestTypeOrmWriteRepository;
  let rawRepo: jest.Mocked<Repository<HarvestTypeOrmEntity>>;
  let mapper: HarvestTypeOrmMapper;

  beforeEach(() => {
    rawRepo = {
      save: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<HarvestTypeOrmEntity>>;

    mapper = new HarvestTypeOrmMapper(new HarvestBuilder());

    const spaceContext = {
      require: jest.fn().mockReturnValue(SPACE_ID),
    } as any;

    repository = new HarvestTypeOrmWriteRepository(
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
      expect(result.toPrimitives().id).toBe(HARVEST_ID);
    });

    it('round-trips decimal quantity correctly', async () => {
      rawRepo.save.mockResolvedValue(buildEntity({ quantity: '2.500' }));
      const aggregate = buildAggregate();

      const result = await repository.save(aggregate);

      expect(result.toPrimitives().quantity).toBe(2.5);
    });
  });

  describe('findById()', () => {
    it('returns aggregate when entity is found', async () => {
      rawRepo.findOne.mockResolvedValue(buildEntity());

      const result = await repository.findById(HARVEST_ID);

      expect(result).not.toBeNull();
      expect(result!.toPrimitives().id).toBe(HARVEST_ID);
    });

    it('returns null when entity is not found', async () => {
      rawRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('delete()', () => {
    it('calls delete on the underlying repository', async () => {
      rawRepo.delete.mockResolvedValue({ affected: 1, raw: {} });

      await repository.delete(HARVEST_ID);

      expect(rawRepo.delete).toHaveBeenCalledTimes(1);
    });
  });
});
