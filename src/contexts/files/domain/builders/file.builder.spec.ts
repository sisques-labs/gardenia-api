import { FieldIsRequiredException } from '@sisques-labs/nestjs-kit';

import { FileAggregate } from '@contexts/files/domain/aggregates/file.aggregate';
import { FileMimeTypeEnum } from '@contexts/files/domain/enums/file-mime-type.enum';
import { FileViewModel } from '@contexts/files/domain/view-models/file.view-model';
import { FileBuilder } from './file.builder';

const FILE_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const CREATED_AT = new Date('2024-01-01T00:00:00.000Z');
const UPDATED_AT = new Date('2024-01-02T00:00:00.000Z');

function fillBuilder(builder: FileBuilder): FileBuilder {
  return builder
    .withId(FILE_ID)
    .withFilename('rose.png')
    .withMimeType(FileMimeTypeEnum.IMAGE_PNG)
    .withSize(204800)
    .withStorageKey(FILE_ID)
    .withUrl('/api/files/550e8400/content')
    .withUserId(USER_ID)
    .withSpaceId(SPACE_ID)
    .withCreatedAt(CREATED_AT)
    .withUpdatedAt(UPDATED_AT);
}

describe('FileBuilder', () => {
  let builder: FileBuilder;

  beforeEach(() => {
    builder = new FileBuilder();
  });

  describe('build()', () => {
    it('should return a FileAggregate with the supplied values', () => {
      const file = fillBuilder(builder).build();

      expect(file).toBeInstanceOf(FileAggregate);
      expect(file.id.value).toBe(FILE_ID);
      expect(file.filename.value).toBe('rose.png');
      expect(file.mimeType.value).toBe(FileMimeTypeEnum.IMAGE_PNG);
      expect(file.size.value).toBe(204800);
      expect(file.storageKey.value).toBe(FILE_ID);
      expect(file.url.value).toBe('/api/files/550e8400/content');
      expect(file.userId.value).toBe(USER_ID);
      expect(file.spaceId.value).toBe(SPACE_ID);
      expect(file.createdAt.value).toEqual(CREATED_AT);
      expect(file.updatedAt.value).toEqual(UPDATED_AT);
    });

    it('should support chaining — each with* method returns the builder instance', () => {
      expect(builder.withFilename('rose.png')).toBe(builder);
      expect(builder.withMimeType(FileMimeTypeEnum.IMAGE_PNG)).toBe(builder);
      expect(builder.withSize(1)).toBe(builder);
      expect(builder.withStorageKey(FILE_ID)).toBe(builder);
      expect(builder.withUrl('/x')).toBe(builder);
      expect(builder.withUserId(USER_ID)).toBe(builder);
      expect(builder.withSpaceId(SPACE_ID)).toBe(builder);
    });
  });

  describe('buildViewModel()', () => {
    it('should return a FileViewModel with the supplied values', () => {
      const viewModel = fillBuilder(builder).buildViewModel();

      expect(viewModel).toBeInstanceOf(FileViewModel);
      expect(viewModel.id).toBe(FILE_ID);
      expect(viewModel.filename).toBe('rose.png');
      expect(viewModel.mimeType).toBe(FileMimeTypeEnum.IMAGE_PNG);
      expect(viewModel.size).toBe(204800);
      expect(viewModel.storageKey).toBe(FILE_ID);
      expect(viewModel.url).toBe('/api/files/550e8400/content');
      expect(viewModel.userId).toBe(USER_ID);
      expect(viewModel.spaceId).toBe(SPACE_ID);
      expect(viewModel.createdAt).toEqual(CREATED_AT);
      expect(viewModel.updatedAt).toEqual(UPDATED_AT);
    });
  });

  describe('validate()', () => {
    it('should throw FieldIsRequiredException when filename is missing', () => {
      expect(() =>
        new FileBuilder()
          .withId(FILE_ID)
          .withMimeType(FileMimeTypeEnum.IMAGE_PNG)
          .withSize(1)
          .withStorageKey(FILE_ID)
          .withUrl('/x')
          .withUserId(USER_ID)
          .withSpaceId(SPACE_ID)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });

    it('should throw FieldIsRequiredException when mimeType is missing', () => {
      expect(() =>
        new FileBuilder()
          .withId(FILE_ID)
          .withFilename('rose.png')
          .withSize(1)
          .withStorageKey(FILE_ID)
          .withUrl('/x')
          .withUserId(USER_ID)
          .withSpaceId(SPACE_ID)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });

    it('should throw FieldIsRequiredException when size is missing', () => {
      expect(() =>
        new FileBuilder()
          .withId(FILE_ID)
          .withFilename('rose.png')
          .withMimeType(FileMimeTypeEnum.IMAGE_PNG)
          .withStorageKey(FILE_ID)
          .withUrl('/x')
          .withUserId(USER_ID)
          .withSpaceId(SPACE_ID)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });

    it('should throw FieldIsRequiredException when storageKey is missing', () => {
      expect(() =>
        new FileBuilder()
          .withId(FILE_ID)
          .withFilename('rose.png')
          .withMimeType(FileMimeTypeEnum.IMAGE_PNG)
          .withSize(1)
          .withUrl('/x')
          .withUserId(USER_ID)
          .withSpaceId(SPACE_ID)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });

    it('should throw FieldIsRequiredException when url is missing', () => {
      expect(() =>
        new FileBuilder()
          .withId(FILE_ID)
          .withFilename('rose.png')
          .withMimeType(FileMimeTypeEnum.IMAGE_PNG)
          .withSize(1)
          .withStorageKey(FILE_ID)
          .withUserId(USER_ID)
          .withSpaceId(SPACE_ID)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });

    it('should throw FieldIsRequiredException when userId is missing', () => {
      expect(() =>
        new FileBuilder()
          .withId(FILE_ID)
          .withFilename('rose.png')
          .withMimeType(FileMimeTypeEnum.IMAGE_PNG)
          .withSize(1)
          .withStorageKey(FILE_ID)
          .withUrl('/x')
          .withSpaceId(SPACE_ID)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });

    it('should throw FieldIsRequiredException when spaceId is missing', () => {
      expect(() =>
        new FileBuilder()
          .withId(FILE_ID)
          .withFilename('rose.png')
          .withMimeType(FileMimeTypeEnum.IMAGE_PNG)
          .withSize(1)
          .withStorageKey(FILE_ID)
          .withUrl('/x')
          .withUserId(USER_ID)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });

    it('should throw FieldIsRequiredException when size is 0 (falsy but not undefined)', () => {
      // size uses `=== undefined` (not a falsy check), so 0 must be accepted as
      // "provided" and validation should fail on the next required field instead.
      expect(() =>
        new FileBuilder()
          .withId(FILE_ID)
          .withFilename('rose.png')
          .withMimeType(FileMimeTypeEnum.IMAGE_PNG)
          .withSize(0)
          .withUserId(USER_ID)
          .withSpaceId(SPACE_ID)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });
  });
});
