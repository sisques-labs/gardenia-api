import { PaginatedResult } from '@sisques-labs/nestjs-kit';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { HarvestUnitEnum } from '@contexts/harvests/domain/enums/harvest-unit.enum';
import { HarvestBuilder } from '@contexts/harvests/domain/builders/harvest.builder';
import { HarvestViewModel } from '@contexts/harvests/domain/view-models/harvest.view-model';
import { HarvestTypeOrmEntity } from '../entities/harvest.entity';
import { HarvestTypeOrmMapper } from '../mappers/harvest-typeorm.mapper';
import { HarvestTypeOrmReadRepository } from './harvest-typeorm-read.repository';

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

describe('HarvestTypeOrmReadRepository', () => {
  let repository: HarvestTypeOrmReadRepository;
  let rawRepo: jest.Mocked<Repository<HarvestTypeOrmEntity>>;
  let mockQb: jest.Mocked<
    Pick<
      SelectQueryBuilder<HarvestTypeOrmEntity>,
      'andWhere' | 'skip' | 'take' | 'getManyAndCount'
    >
  >;
  let mapper: HarvestTypeOrmMapper;

  beforeEach(() => {
    mockQb = {
      andWhere: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    } as any;

    rawRepo = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQb),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<HarvestTypeOrmEntity>>;

    mapper = new HarvestTypeOrmMapper(new HarvestBuilder());

    const spaceContext = {
      require: jest.fn().mockReturnValue(SPACE_ID),
    } as any;

    repository = new HarvestTypeOrmReadRepository(
      rawRepo,
      mapper,
      spaceContext,
    );
  });

  describe('findById()', () => {
    it('returns HarvestViewModel when entity is found', async () => {
      rawRepo.findOne.mockResolvedValue(buildEntity());

      const result = await repository.findById(HARVEST_ID);

      expect(result).toBeInstanceOf(HarvestViewModel);
      expect(result!.id).toBe(HARVEST_ID);
    });

    it('returns null when entity is not found', async () => {
      rawRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });

    it('round-trips decimal quantity from string to number', async () => {
      rawRepo.findOne.mockResolvedValue(buildEntity({ quantity: '2.500' }));

      const result = await repository.findById(HARVEST_ID);

      expect(result!.quantity).toBe(2.5);
    });
  });

  describe('findByCriteria()', () => {
    it('returns paginated results with view models', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[buildEntity()], 1]);

      const result = await repository.findByCriteria({});

      expect(result).toBeInstanceOf(PaginatedResult);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toBeInstanceOf(HarvestViewModel);
      expect(result.total).toBe(1);
    });

    it('returns empty result when no harvests match', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await repository.findByCriteria({});

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('applies cropType ILIKE filter when provided', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findByCriteria({ cropType: 'Tomate' });

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'LOWER(harvest.crop_type) LIKE :cropType',
        { cropType: '%tomate%' },
      );
    });

    it('applies unit exact filter when provided', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findByCriteria({ unit: HarvestUnitEnum.KG });

      expect(mockQb.andWhere).toHaveBeenCalledWith('harvest.unit = :unit', {
        unit: HarvestUnitEnum.KG,
      });
    });

    it('applies dateFrom filter when provided', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);
      const dateFrom = new Date('2026-01-01');

      await repository.findByCriteria({ dateFrom });

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'harvest.harvested_at >= :dateFrom',
        { dateFrom },
      );
    });

    it('applies dateTo filter when provided', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);
      const dateTo = new Date('2026-12-31');

      await repository.findByCriteria({ dateTo });

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'harvest.harvested_at <= :dateTo',
        { dateTo },
      );
    });

    it('uses default pagination when page/limit not provided', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findByCriteria({});

      expect(mockQb.skip).toHaveBeenCalledWith(0);
      expect(mockQb.take).toHaveBeenCalledWith(20);
    });

    it('caps limit at 100', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findByCriteria({ limit: 999 });

      expect(mockQb.take).toHaveBeenCalledWith(100);
    });
  });
});
