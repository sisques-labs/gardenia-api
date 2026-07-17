import { FileAggregate } from '@contexts/files/domain/aggregates/file.aggregate';
import { FileBuilder } from '@contexts/files/domain/builders/file.builder';
import { FileMimeTypeEnum } from '@contexts/files/domain/enums/file-mime-type.enum';
import { FileTypeOrmEntity } from '../entities/file.entity';
import { FileTypeOrmMapper } from './file-typeorm.mapper';

const ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const CREATED_AT = new Date('2026-01-01T00:00:00.000Z');
const UPDATED_AT = new Date('2026-01-02T00:00:00.000Z');

const buildEntity = (): FileTypeOrmEntity => {
  const entity = new FileTypeOrmEntity();
  entity.id = ID;
  entity.filename = 'tomato.jpg';
  entity.mimeType = FileMimeTypeEnum.IMAGE_JPEG;
  entity.size = 2048;
  entity.storageKey = 'spaces/770e8400/tomato.jpg';
  entity.url = 'https://cdn.gardenia.app/spaces/770e8400/tomato.jpg';
  entity.userId = USER_ID;
  entity.spaceId = SPACE_ID;
  entity.createdAt = CREATED_AT;
  entity.updatedAt = UPDATED_AT;
  return entity;
};

describe('FileTypeOrmMapper', () => {
  let mapper: FileTypeOrmMapper;

  beforeEach(() => {
    mapper = new FileTypeOrmMapper(new FileBuilder());
  });

  describe('toDomain()', () => {
    it('wraps entity primitives into an aggregate', () => {
      const result = mapper.toDomain(buildEntity());

      expect(result).toBeInstanceOf(FileAggregate);
      expect(result.id.value).toBe(ID);
      expect(result.filename.value).toBe('tomato.jpg');
      expect(result.mimeType.value).toBe(FileMimeTypeEnum.IMAGE_JPEG);
      expect(result.size.value).toBe(2048);
      expect(result.storageKey.value).toBe('spaces/770e8400/tomato.jpg');
      expect(result.url.value).toBe(
        'https://cdn.gardenia.app/spaces/770e8400/tomato.jpg',
      );
      expect(result.userId.value).toBe(USER_ID);
      expect(result.spaceId.value).toBe(SPACE_ID);
    });
  });

  describe('toPersistence()', () => {
    it('serializes the aggregate into a persistence entity', () => {
      const aggregate = mapper.toDomain(buildEntity());

      const result = mapper.toPersistence(aggregate);

      expect(result).toBeInstanceOf(FileTypeOrmEntity);
      expect(result.id).toBe(ID);
      expect(result.filename).toBe('tomato.jpg');
      expect(result.mimeType).toBe(FileMimeTypeEnum.IMAGE_JPEG);
      expect(result.size).toBe(2048);
      expect(result.storageKey).toBe('spaces/770e8400/tomato.jpg');
      expect(result.userId).toBe(USER_ID);
      expect(result.spaceId).toBe(SPACE_ID);
    });
  });

  describe('toViewModel()', () => {
    it('maps entity primitives into a view model', () => {
      const vm = mapper.toViewModel(buildEntity());

      expect(vm.id).toBe(ID);
      expect(vm.filename).toBe('tomato.jpg');
      expect(vm.mimeType).toBe(FileMimeTypeEnum.IMAGE_JPEG);
      expect(vm.size).toBe(2048);
      expect(vm.url).toBe(
        'https://cdn.gardenia.app/spaces/770e8400/tomato.jpg',
      );
    });
  });

  describe('round-trip', () => {
    it('preserves fields through toDomain → toPersistence', () => {
      const original = buildEntity();

      const result = mapper.toPersistence(mapper.toDomain(original));

      expect(result.filename).toBe(original.filename);
      expect(result.size).toBe(original.size);
      expect(result.storageKey).toBe(original.storageKey);
      expect(result.createdAt).toEqual(original.createdAt);
    });
  });
});
