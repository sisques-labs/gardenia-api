import { Criteria, PaginatedResult } from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { FileAggregate } from '@contexts/files/domain/aggregates/file.aggregate';
import { FileBuilder } from '@contexts/files/domain/builders/file.builder';
import { FileMimeTypeEnum } from '@contexts/files/domain/enums/file-mime-type.enum';
import { FileTypeOrmEntity } from '../entities/file.entity';
import { FileTypeOrmMapper } from '../mappers/file-typeorm.mapper';
import { FileTypeOrmWriteRepository } from './file-typeorm-write.repository';

const FILE_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';

const buildEntity = (): FileTypeOrmEntity => {
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
  return e;
};

describe('FileTypeOrmWriteRepository', () => {
  let repository: FileTypeOrmWriteRepository;
  let rawRepo: jest.Mocked<Repository<FileTypeOrmEntity>>;
  let mapper: FileTypeOrmMapper;

  beforeEach(() => {
    rawRepo = {
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<FileTypeOrmEntity>>;

    mapper = new FileTypeOrmMapper(new FileBuilder());

    const spaceContext = {
      require: jest.fn().mockReturnValue(SPACE_ID),
    } as any;

    repository = new FileTypeOrmWriteRepository(mapper, rawRepo, spaceContext);
  });

  describe('save()', () => {
    it('persists the aggregate and returns the reloaded domain object', async () => {
      const aggregate = mapper.toDomain(buildEntity());
      rawRepo.save.mockResolvedValue(buildEntity());

      const result = await repository.save(aggregate);

      expect(rawRepo.save).toHaveBeenCalled();
      expect(result).toBeInstanceOf(FileAggregate);
      expect(result.id.value).toBe(FILE_ID);
    });
  });

  describe('findById()', () => {
    it('returns FileAggregate when entity is found', async () => {
      rawRepo.findOne.mockResolvedValue(buildEntity());

      const result = await repository.findById(FILE_ID);

      expect(result).toBeInstanceOf(FileAggregate);
      expect(result!.id.value).toBe(FILE_ID);
    });

    it('returns null when entity is not found', async () => {
      rawRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByCriteria()', () => {
    it('returns paginated aggregates from findAndCount', async () => {
      rawRepo.findAndCount.mockResolvedValue([[buildEntity()], 1]);

      const result = await repository.findByCriteria(
        new Criteria(undefined, undefined, undefined),
      );

      expect(result).toBeInstanceOf(PaginatedResult);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toBeInstanceOf(FileAggregate);
      expect(result.total).toBe(1);
    });
  });

  describe('delete()', () => {
    it('delegates to the underlying repository', async () => {
      await repository.delete(FILE_ID);

      expect(rawRepo.delete).toHaveBeenCalled();
    });
  });
});
