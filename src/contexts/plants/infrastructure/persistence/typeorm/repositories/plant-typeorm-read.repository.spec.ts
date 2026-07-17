import {
  Criteria,
  FilterOperator,
  PaginatedResult,
  SortDirection,
} from '@sisques-labs/nestjs-kit';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { PlantBuilder } from '@contexts/plants/domain/builders/plant.builder';
import { PlantViewModel } from '@contexts/plants/domain/view-models/plant.view-model';
import { PlantTypeOrmEntity } from '../entities/plant.entity';
import { PlantTypeOrmMapper } from '../mappers/plant-typeorm.mapper';
import { PlantTypeOrmReadRepository } from './plant-typeorm-read.repository';

const PLANT_ID = '550e8400-e29b-41d4-a716-446655440000';
const SPECIES_ID = '880e8400-e29b-41d4-a716-446655440003';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const QR_ID = '990e8400-e29b-41d4-a716-446655440004';
const SPOT_ID = 'aa0e8400-e29b-41d4-a716-446655440005';

const buildEntity = (
  overrides: Partial<PlantTypeOrmEntity> = {},
): PlantTypeOrmEntity => {
  const e = new PlantTypeOrmEntity();
  e.id = PLANT_ID;
  e.name = 'Aloe';
  e.plantSpeciesId = SPECIES_ID;
  e.imageUrl = 'https://example.com/aloe.png';
  e.userId = USER_ID;
  e.spaceId = SPACE_ID;
  e.qrId = QR_ID;
  e.plantingSpotId = SPOT_ID;
  e.createdAt = new Date('2026-01-01');
  e.updatedAt = new Date('2026-01-01');
  return { ...e, ...overrides };
};

describe('PlantTypeOrmReadRepository', () => {
  let repository: PlantTypeOrmReadRepository;
  let rawRepo: jest.Mocked<Repository<PlantTypeOrmEntity>>;
  let mockQb: jest.Mocked<
    Pick<
      SelectQueryBuilder<PlantTypeOrmEntity>,
      | 'where'
      | 'andWhere'
      | 'orderBy'
      | 'addOrderBy'
      | 'skip'
      | 'take'
      | 'getManyAndCount'
    >
  >;
  let mapper: PlantTypeOrmMapper;

  beforeEach(() => {
    mockQb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    } as any;

    rawRepo = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQb),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<PlantTypeOrmEntity>>;

    mapper = new PlantTypeOrmMapper(new PlantBuilder());

    const spaceContext = {
      require: jest.fn().mockReturnValue(SPACE_ID),
    } as any;

    repository = new PlantTypeOrmReadRepository(rawRepo, mapper, spaceContext);
  });

  describe('findById()', () => {
    it('returns PlantViewModel when entity is found', async () => {
      rawRepo.findOne.mockResolvedValue(buildEntity());

      const result = await repository.findById(PLANT_ID);

      expect(result).toBeInstanceOf(PlantViewModel);
      expect(result!.id).toBe(PLANT_ID);
    });

    it('returns null when entity is not found', async () => {
      rawRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByCriteria()', () => {
    it('returns paginated results with view models', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[buildEntity()], 1]);

      const result = await repository.findByCriteria(
        new Criteria(undefined, undefined, undefined),
      );

      expect(result).toBeInstanceOf(PaginatedResult);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toBeInstanceOf(PlantViewModel);
      expect(result.total).toBe(1);
      expect(mockQb.where).toHaveBeenCalledWith('plant.spaceId = :spaceId', {
        spaceId: SPACE_ID,
      });
    });

    it('returns empty result when no plants match', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await repository.findByCriteria(
        new Criteria(undefined, undefined, undefined),
      );

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('defaults to createdAt DESC when no sort is given', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findByCriteria(
        new Criteria(undefined, undefined, undefined),
      );

      expect(mockQb.orderBy).toHaveBeenCalledWith(
        'plant.createdAt',
        SortDirection.DESC,
      );
    });

    it('applies a client-supplied sort instead of the default', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findByCriteria(
        new Criteria([], [{ field: 'name', direction: SortDirection.ASC }]),
      );

      expect(mockQb.orderBy).toHaveBeenCalledWith(
        'plant.name',
        SortDirection.ASC,
      );
    });

    it('applies LIKE filter for name', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findByCriteria(
        new Criteria(
          [{ field: 'name', operator: FilterOperator.LIKE, value: 'Aloe' }],
          undefined,
          undefined,
        ),
      );

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'plant.name ILIKE :filter0',
        {
          filter0: '%Aloe%',
        },
      );
    });

    it('applies EQUALS filter for plantSpeciesId', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findByCriteria(
        new Criteria(
          [
            {
              field: 'plantSpeciesId',
              operator: FilterOperator.EQUALS,
              value: SPECIES_ID,
            },
          ],
          undefined,
          undefined,
        ),
      );

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'plant.plantSpeciesId = :filter0',
        { filter0: SPECIES_ID },
      );
    });
  });

  describe('save()', () => {
    it('resolves without persisting (read-side projection)', async () => {
      await expect(
        repository.save({} as PlantViewModel),
      ).resolves.toBeUndefined();
    });
  });

  describe('delete()', () => {
    it('resolves without deleting (read-side projection)', async () => {
      await expect(repository.delete(PLANT_ID)).resolves.toBeUndefined();
      expect(rawRepo.delete).not.toHaveBeenCalled();
    });
  });
});
