import {
  Criteria,
  FilterOperator,
  PaginatedResult,
  SortDirection,
} from '@sisques-labs/nestjs-kit';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { PlantPhotoBuilder } from '@contexts/plant-photos/domain/builders/plant-photo.builder';
import { PlantPhotoViewModel } from '@contexts/plant-photos/domain/view-models/plant-photo.view-model';
import { PlantPhotoTypeOrmEntity } from '../entities/plant-photo.entity';
import { PlantPhotoTypeOrmMapper } from '../mappers/plant-photo-typeorm.mapper';
import { PlantPhotoTypeOrmReadRepository } from './plant-photo-typeorm-read.repository';

const PHOTO_ID = '550e8400-e29b-41d4-a716-446655440000';
const PLANT_ID = '440e8400-e29b-41d4-a716-446655440003';
const FILE_ID = '330e8400-e29b-41d4-a716-446655440004';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';

const buildEntity = (
  overrides: Partial<PlantPhotoTypeOrmEntity> = {},
): PlantPhotoTypeOrmEntity => {
  const e = new PlantPhotoTypeOrmEntity();
  e.id = PHOTO_ID;
  e.plantId = PLANT_ID;
  e.fileId = FILE_ID;
  e.url = '/api/files/330e8400/content';
  e.userId = USER_ID;
  e.spaceId = SPACE_ID;
  e.createdAt = new Date('2026-01-01');
  e.updatedAt = new Date('2026-01-01');
  return { ...e, ...overrides };
};

describe('PlantPhotoTypeOrmReadRepository', () => {
  let repository: PlantPhotoTypeOrmReadRepository;
  let rawRepo: jest.Mocked<Repository<PlantPhotoTypeOrmEntity>>;
  let mockQb: jest.Mocked<
    Pick<
      SelectQueryBuilder<PlantPhotoTypeOrmEntity>,
      | 'where'
      | 'andWhere'
      | 'orderBy'
      | 'addOrderBy'
      | 'skip'
      | 'take'
      | 'getManyAndCount'
    >
  >;
  let mapper: PlantPhotoTypeOrmMapper;

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
    } as unknown as jest.Mocked<Repository<PlantPhotoTypeOrmEntity>>;

    mapper = new PlantPhotoTypeOrmMapper(new PlantPhotoBuilder());

    const spaceContext = {
      require: jest.fn().mockReturnValue(SPACE_ID),
    } as any;

    repository = new PlantPhotoTypeOrmReadRepository(
      rawRepo,
      mapper,
      spaceContext,
    );
  });

  describe('findById()', () => {
    it('returns PlantPhotoViewModel when entity is found', async () => {
      rawRepo.findOne.mockResolvedValue(buildEntity());

      const result = await repository.findById(PHOTO_ID);

      expect(result).toBeInstanceOf(PlantPhotoViewModel);
      expect(result!.id).toBe(PHOTO_ID);
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
      expect(result.items[0]).toBeInstanceOf(PlantPhotoViewModel);
      expect(result.total).toBe(1);
      expect(mockQb.where).toHaveBeenCalledWith('photo.space_id = :spaceId', {
        spaceId: SPACE_ID,
      });
    });

    it('returns empty result when no photos match', async () => {
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
        'photo.createdAt',
        SortDirection.DESC,
      );
    });

    it('applies a client-supplied sort instead of the default', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findByCriteria(
        new Criteria(
          [],
          [{ field: 'updatedAt', direction: SortDirection.ASC }],
        ),
      );

      expect(mockQb.orderBy).toHaveBeenCalledWith(
        'photo.updatedAt',
        SortDirection.ASC,
      );
    });

    it('applies EQUALS filter for plantId', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findByCriteria(
        new Criteria(
          [
            {
              field: 'plantId',
              operator: FilterOperator.EQUALS,
              value: PLANT_ID,
            },
          ],
          undefined,
          undefined,
        ),
      );

      expect(mockQb.andWhere).toHaveBeenCalledWith('photo.plantId = :filter0', {
        filter0: PLANT_ID,
      });
    });

    it('applies skip/take from pagination', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findByCriteria(
        new Criteria(undefined, undefined, { page: 2, perPage: 5 }),
      );

      expect(mockQb.skip).toHaveBeenCalledWith(5);
      expect(mockQb.take).toHaveBeenCalledWith(5);
    });
  });

  describe('save()', () => {
    it('resolves without persisting (read-side no-op)', async () => {
      await expect(
        repository.save({} as PlantPhotoViewModel),
      ).resolves.toBeUndefined();
    });
  });

  describe('delete()', () => {
    it('calls delete on the underlying repository', async () => {
      rawRepo.delete.mockResolvedValue({ affected: 1, raw: {} });

      await repository.delete(PHOTO_ID);

      expect(rawRepo.delete).toHaveBeenCalledTimes(1);
    });
  });
});
