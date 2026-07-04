import { FileAggregate } from '@contexts/files/domain/aggregates/file.aggregate';
import { FileBuilder } from '@contexts/files/domain/builders/file.builder';
import { FileMimeTypeEnum } from '@contexts/files/domain/enums/file-mime-type.enum';
import { FileViewModel } from '@contexts/files/domain/view-models/file.view-model';
import { FileTypeOrmEntity } from '../entities/file.entity';
import { FileTypeOrmMapper } from './file-typeorm.mapper';

const FILE_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const CREATED_AT = new Date('2024-01-01T00:00:00.000Z');
const UPDATED_AT = new Date('2024-01-02T00:00:00.000Z');

function buildEntity(): FileTypeOrmEntity {
  const entity = new FileTypeOrmEntity();
  entity.id = FILE_ID;
  entity.filename = 'rose.png';
  entity.mimeType = FileMimeTypeEnum.IMAGE_PNG;
  entity.size = 204800;
  entity.storageKey = FILE_ID;
  entity.url = '/api/files/550e8400/content';
  entity.userId = USER_ID;
  entity.spaceId = SPACE_ID;
  entity.createdAt = CREATED_AT;
  entity.updatedAt = UPDATED_AT;
  return entity;
}

describe('FileTypeOrmMapper', () => {
  let mapper: FileTypeOrmMapper;

  beforeEach(() => {
    mapper = new FileTypeOrmMapper(new FileBuilder());
  });

  describe('toDomain()', () => {
    it('should map a persistence entity to a FileAggregate', () => {
      const aggregate = mapper.toDomain(buildEntity());

      expect(aggregate).toBeInstanceOf(FileAggregate);
      expect(aggregate.id.value).toBe(FILE_ID);
      expect(aggregate.filename.value).toBe('rose.png');
      expect(aggregate.mimeType.value).toBe(FileMimeTypeEnum.IMAGE_PNG);
      expect(aggregate.size.value).toBe(204800);
      expect(aggregate.storageKey.value).toBe(FILE_ID);
      expect(aggregate.url.value).toBe('/api/files/550e8400/content');
      expect(aggregate.userId.value).toBe(USER_ID);
      expect(aggregate.spaceId.value).toBe(SPACE_ID);
    });
  });

  describe('toPersistence()', () => {
    it('should map a FileAggregate to a persistence entity', () => {
      const aggregate = mapper.toDomain(buildEntity());

      const entity = mapper.toPersistence(aggregate);

      expect(entity).toBeInstanceOf(FileTypeOrmEntity);
      expect(entity.id).toBe(FILE_ID);
      expect(entity.filename).toBe('rose.png');
      expect(entity.mimeType).toBe(FileMimeTypeEnum.IMAGE_PNG);
      expect(entity.size).toBe(204800);
      expect(entity.storageKey).toBe(FILE_ID);
      expect(entity.url).toBe('/api/files/550e8400/content');
      expect(entity.userId).toBe(USER_ID);
      expect(entity.spaceId).toBe(SPACE_ID);
      expect(entity.createdAt).toEqual(CREATED_AT);
      expect(entity.updatedAt).toEqual(UPDATED_AT);
    });
  });

  describe('toViewModel()', () => {
    it('should map a persistence entity to a FileViewModel', () => {
      const viewModel = mapper.toViewModel(buildEntity());

      expect(viewModel).toBeInstanceOf(FileViewModel);
      expect(viewModel.id).toBe(FILE_ID);
      expect(viewModel.filename).toBe('rose.png');
      expect(viewModel.mimeType).toBe(FileMimeTypeEnum.IMAGE_PNG);
      expect(viewModel.size).toBe(204800);
      expect(viewModel.storageKey).toBe(FILE_ID);
      expect(viewModel.url).toBe('/api/files/550e8400/content');
      expect(viewModel.userId).toBe(USER_ID);
      expect(viewModel.spaceId).toBe(SPACE_ID);
    });
  });
});
