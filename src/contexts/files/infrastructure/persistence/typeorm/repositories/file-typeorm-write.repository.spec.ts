import { Repository } from 'typeorm';

import { FileMimeTypeEnum } from '@contexts/files/domain/enums/file-mime-type.enum';
import { FileBuilder } from '@contexts/files/domain/builders/file.builder';
import { FileTypeOrmEntity } from '../entities/file.entity';
import { FileTypeOrmMapper } from '../mappers/file-typeorm.mapper';
import { FileTypeOrmWriteRepository } from './file-typeorm-write.repository';

const FILE_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';

const buildEntity = (
  overrides: Partial<FileTypeOrmEntity> = {},
): FileTypeOrmEntity => {
  const e = new FileTypeOrmEntity();
  e.id = FILE_ID;
  e.filename = 'photo.jpg';
  e.mimeType = FileMimeTypeEnum.IMAGE_JPEG;
  e.size = 1024;
  e.storageKey = 'files/photo.jpg';
  e.url = 'https://cdn.example.com/files/photo.jpg';
  e.userId = USER_ID;
  e.spaceId = SPACE_ID;
  e.createdAt = new Date('2026-01-01');
  e.updatedAt = new Date('2026-01-01');
  return { ...e, ...overrides };
};

const buildAggregate = () =>
  new FileBuilder()
    .withId(FILE_ID)
    .withFilename('photo.jpg')
    .withMimeType(FileMimeTypeEnum.IMAGE_JPEG)
    .withSize(1024)
    .withStorageKey('files/photo.jpg')
    .withUrl('https://cdn.example.com/files/photo.jpg')
    .withUserId(USER_ID)
    .withSpaceId(SPACE_ID)
    .withCreatedAt(new Date('2026-01-01'))
    .withUpdatedAt(new Date('2026-01-01'))
    .build();

describe('FileTypeOrmWriteRepository', () => {
  let repository: FileTypeOrmWriteRepository;
  let rawRepo: jest.Mocked<Repository<FileTypeOrmEntity>>;
  let mapper: FileTypeOrmMapper;

  beforeEach(() => {
    rawRepo = {
      save: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<FileTypeOrmEntity>>;

    mapper = new FileTypeOrmMapper(new FileBuilder());

    const spaceContext = {
      require: jest.fn().mockReturnValue(SPACE_ID),
    } as any;

    repository = new FileTypeOrmWriteRepository(mapper, rawRepo, spaceContext);
  });

  describe('save()', () => {
    it('persists the aggregate and returns domain object', async () => {
      rawRepo.save.mockResolvedValue(buildEntity());
      const aggregate = buildAggregate();

      const result = await repository.save(aggregate);

      expect(rawRepo.save).toHaveBeenCalledTimes(1);
      expect(result.toPrimitives().id).toBe(FILE_ID);
    });
  });

  describe('findById()', () => {
    it('returns aggregate when entity is found', async () => {
      rawRepo.findOne.mockResolvedValue(buildEntity());

      const result = await repository.findById(FILE_ID);

      expect(result).not.toBeNull();
      expect(result!.toPrimitives().id).toBe(FILE_ID);
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

    it('returns empty result when no files exist', async () => {
      rawRepo.findAndCount.mockResolvedValue([[], 0]);

      const result = await repository.findByCriteria(undefined as any);

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('delete()', () => {
    it('calls delete on the underlying repository', async () => {
      rawRepo.delete.mockResolvedValue({ affected: 1, raw: {} });

      await repository.delete(FILE_ID);

      expect(rawRepo.delete).toHaveBeenCalledTimes(1);
    });
  });
});
