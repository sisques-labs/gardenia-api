import {
  Criteria,
  FilterOperator,
  PaginatedResult,
  SortDirection,
} from '@sisques-labs/nestjs-kit';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { PlantSpeciesBuilder } from '@contexts/plant-species/domain/builders/plant-species.builder';
import { PlantSpeciesViewModel } from '@contexts/plant-species/domain/view-models/plant-species.view-model';
import { PlantSpeciesTypeOrmEntity } from '../entities/plant-species.entity';
import { PlantSpeciesTypeOrmMapper } from '../mappers/plant-species-typeorm.mapper';
import { PlantSpeciesTypeOrmReadRepository } from './plant-species-typeorm-read.repository';

const SPECIES_ID = '550e8400-e29b-41d4-a716-446655440000';

const buildEntity = (
  overrides: Partial<PlantSpeciesTypeOrmEntity> = {},
): PlantSpeciesTypeOrmEntity => {
  const e = new PlantSpeciesTypeOrmEntity();
  e.id = SPECIES_ID;
  e.scientificName = 'Monstera deliciosa';
  e.gbifKey = 2882337;
  e.createdAt = new Date('2026-01-01');
  e.updatedAt = new Date('2026-01-01');
  return { ...e, ...overrides };
};

describe('PlantSpeciesTypeOrmReadRepository', () => {
  let repository: PlantSpeciesTypeOrmReadRepository;
  let rawRepo: jest.Mocked<Repository<PlantSpeciesTypeOrmEntity>>;
  let mockQb: jest.Mocked<
    Pick<
      SelectQueryBuilder<PlantSpeciesTypeOrmEntity>,
      | 'where'
      | 'andWhere'
      | 'orderBy'
      | 'addOrderBy'
      | 'skip'
      | 'take'
      | 'getManyAndCount'
    >
  >;
  let mapper: PlantSpeciesTypeOrmMapper;

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
    } as unknown as jest.Mocked<Repository<PlantSpeciesTypeOrmEntity>>;

    mapper = new PlantSpeciesTypeOrmMapper(new PlantSpeciesBuilder());

    repository = new PlantSpeciesTypeOrmReadRepository(rawRepo, mapper);
  });

  describe('findById()', () => {
    it('returns PlantSpeciesViewModel when entity is found', async () => {
      rawRepo.findOne.mockResolvedValue(buildEntity());

      const result = await repository.findById(SPECIES_ID);

      expect(result).toBeInstanceOf(PlantSpeciesViewModel);
      expect(result!.id).toBe(SPECIES_ID);
      expect(result!.scientificName).toBe('Monstera deliciosa');
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
      expect(result.items[0]).toBeInstanceOf(PlantSpeciesViewModel);
      expect(result.total).toBe(1);
    });

    it('returns empty result when no species match', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await repository.findByCriteria(
        new Criteria(undefined, undefined, undefined),
      );

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('defaults to scientificName ASC when no sort is given', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findByCriteria(
        new Criteria(undefined, undefined, undefined),
      );

      expect(mockQb.orderBy).toHaveBeenCalledWith(
        'species.scientificName',
        SortDirection.ASC,
      );
    });

    it('applies a client-supplied sort instead of the default', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findByCriteria(
        new Criteria(
          [],
          [{ field: 'createdAt', direction: SortDirection.DESC }],
        ),
      );

      expect(mockQb.orderBy).toHaveBeenCalledWith(
        'species.createdAt',
        SortDirection.DESC,
      );
    });

    it('applies LIKE filter for scientificName', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findByCriteria(
        new Criteria(
          [
            {
              field: 'scientificName',
              operator: FilterOperator.LIKE,
              value: 'Monstera',
            },
          ],
          undefined,
          undefined,
        ),
      );

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'species.scientificName ILIKE :filter0',
        { filter0: '%Monstera%' },
      );
    });

    it('applies EQUALS filter for gbifKey', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findByCriteria(
        new Criteria(
          [
            {
              field: 'gbifKey',
              operator: FilterOperator.EQUALS,
              value: 2882337,
            },
          ],
          undefined,
          undefined,
        ),
      );

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'species.gbifKey = :filter0',
        { filter0: 2882337 },
      );
    });
  });

  describe('save()', () => {
    it('resolves without persisting (read-side projection)', async () => {
      await expect(
        repository.save({} as PlantSpeciesViewModel),
      ).resolves.toBeUndefined();
    });
  });

  describe('delete()', () => {
    it('resolves without deleting (read-side projection)', async () => {
      await expect(repository.delete(SPECIES_ID)).resolves.toBeUndefined();
      expect(rawRepo.delete).not.toHaveBeenCalled();
    });
  });
});
