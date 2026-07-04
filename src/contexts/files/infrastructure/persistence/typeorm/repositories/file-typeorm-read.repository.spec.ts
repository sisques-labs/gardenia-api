import {
  Criteria,
  FilterOperator,
  PaginatedResult,
  SortDirection,
} from '@sisques-labs/nestjs-kit';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { FileMimeTypeEnum } from '@contexts/files/domain/enums/file-mime-type.enum';
import { FileBuilder } from '@contexts/files/domain/builders/file.builder';
import { FileViewModel } from '@contexts/files/domain/view-models/file.view-model';
import { FileTypeOrmEntity } from '../entities/file.entity';
import { FileTypeOrmMapper } from '../mappers/file-typeorm.mapper';
import { FileTypeOrmReadRepository } from './file-typeorm-read.repository';

const FILE_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';

const buildEntity = (
  overrides: Partial<FileTypeOrmEntity> = {},
): FileTypeOrmEntity => {
  const e = new FileTypeOrmEntity();
  e.id = FILE_ID;
  e.filename = 'rose.png';
  e.mimeType = FileMimeTypeEnum.IMAGE_PNG;
  e.size = 204800;
  e.storageKey = FILE_ID;
  e.url = '/api/files/550e8400/content';
  e.userId = USER_ID;
  e.spaceId = SPACE_ID;
  e.createdAt = new Date('2026-01-01');
  e.updatedAt = new Date('2026-01-01');
  return { ...e, ...overrides };
};

describe('FileTypeOrmReadRepository', () => {
  let repository: FileTypeOrmReadRepository;
  let rawRepo: jest.Mocked<Repository<FileTypeOrmEntity>>;
  let mockQb: jest.Mocked<
    Pick<
      SelectQueryBuilder<FileTypeOrmEntity>,
      | 'where'
      | 'andWhere'
      | 'orderBy'
      | 'addOrderBy'
      | 'skip'
      | 'take'
      | 'getManyAndCount'
    >
  >;
  let mapper: FileTypeOrmMapper;

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
    } as unknown as jest.Mocked<Repository<FileTypeOrmEntity>>;

    mapper = new FileTypeOrmMapper(new FileBuilder());

    const spaceContext = {
      require: jest.fn().mockReturnValue(SPACE_ID),
    } as any;

    repository = new FileTypeOrmReadRepository(rawRepo, mapper, spaceContext);
  });

  describe('findById()', () => {
    it('returns FileViewModel when entity is found', async () => {
      rawRepo.findOne.mockResolvedValue(buildEntity());

      const result = await repository.findById(FILE_ID);

      expect(result).toBeInstanceOf(FileViewModel);
      expect(result!.id).toBe(FILE_ID);
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
      expect(result.items[0]).toBeInstanceOf(FileViewModel);
      expect(result.total).toBe(1);
      expect(mockQb.where).toHaveBeenCalledWith('file.space_id = :spaceId', {
        spaceId: SPACE_ID,
      });
      expect(mockQb.orderBy).toHaveBeenCalledWith(
        'file.createdAt',
        SortDirection.DESC,
      );
    });

    it('returns empty result when no files match', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await repository.findByCriteria(
        new Criteria(undefined, undefined, undefined),
      );

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('applies a client-supplied sort instead of the default', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findByCriteria(
        new Criteria([], [{ field: 'filename', direction: SortDirection.ASC }]),
      );

      expect(mockQb.orderBy).toHaveBeenCalledWith(
        'file.filename',
        SortDirection.ASC,
      );
    });

    it('applies LIKE filter for filename', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findByCriteria(
        new Criteria(
          [
            {
              field: 'filename',
              operator: FilterOperator.LIKE,
              value: 'Rose',
            },
          ],
          undefined,
          undefined,
        ),
      );

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'file.filename ILIKE :filter0',
        { filter0: '%Rose%' },
      );
    });

    it('applies EQUALS filter for mimeType', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findByCriteria(
        new Criteria(
          [
            {
              field: 'mimeType',
              operator: FilterOperator.EQUALS,
              value: FileMimeTypeEnum.IMAGE_PNG,
            },
          ],
          undefined,
          undefined,
        ),
      );

      expect(mockQb.andWhere).toHaveBeenCalledWith('file.mimeType = :filter0', {
        filter0: FileMimeTypeEnum.IMAGE_PNG,
      });
    });

    it('applies GTE filter for size', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findByCriteria(
        new Criteria(
          [
            {
              field: 'size',
              operator: FilterOperator.GREATER_THAN_OR_EQUAL,
              value: 1000,
            },
          ],
          undefined,
          undefined,
        ),
      );

      expect(mockQb.andWhere).toHaveBeenCalledWith('file.size >= :filter0', {
        filter0: 1000,
      });
    });
  });

  describe('save()', () => {
    it('is a no-op (read repository does not persist)', async () => {
      await expect(
        repository.save(
          new FileViewModel({
            id: FILE_ID,
            filename: 'rose.png',
            mimeType: 'image/png',
            size: 204800,
            storageKey: FILE_ID,
            url: '/api/files/550e8400/content',
            userId: USER_ID,
            spaceId: SPACE_ID,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        ),
      ).resolves.toBeUndefined();
    });
  });

  describe('delete()', () => {
    it('delegates to the underlying repository', async () => {
      await repository.delete(FILE_ID);

      expect(rawRepo.delete).toHaveBeenCalled();
    });
  });
});
