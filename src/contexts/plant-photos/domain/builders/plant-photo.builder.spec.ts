import { FieldIsRequiredException } from '@sisques-labs/nestjs-kit';

import { PlantPhotoBuilder } from './plant-photo.builder';

const ID = '550e8400-e29b-41d4-a716-446655440000';
const PLANT_ID = '440e8400-e29b-41d4-a716-446655440003';
const FILE_ID = '330e8400-e29b-41d4-a716-446655440004';
const URL = '/api/files/550e8400/content';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const CREATED_AT = new Date('2026-01-01T00:00:00.000Z');
const UPDATED_AT = new Date('2026-01-02T00:00:00.000Z');

const base = (): PlantPhotoBuilder =>
  new PlantPhotoBuilder()
    .withId(ID)
    .withPlantId(PLANT_ID)
    .withFileId(FILE_ID)
    .withUrl(URL)
    .withUserId(USER_ID)
    .withSpaceId(SPACE_ID)
    .withCreatedAt(CREATED_AT)
    .withUpdatedAt(UPDATED_AT);

describe('PlantPhotoBuilder', () => {
  describe('build()', () => {
    it('builds an aggregate with all fields wrapped in value objects', () => {
      const aggregate = base().build();

      expect(aggregate.id.value).toBe(ID);
      expect(aggregate.plantId.value).toBe(PLANT_ID);
      expect(aggregate.fileId.value).toBe(FILE_ID);
      expect(aggregate.url.value).toBe(URL);
      expect(aggregate.userId.value).toBe(USER_ID);
      expect(aggregate.spaceId.value).toBe(SPACE_ID);
    });
  });

  describe('buildViewModel()', () => {
    it('builds a view model with primitive values', () => {
      const vm = base().buildViewModel();

      expect(vm.id).toBe(ID);
      expect(vm.plantId).toBe(PLANT_ID);
      expect(vm.fileId).toBe(FILE_ID);
      expect(vm.url).toBe(URL);
    });
  });

  describe('validate()', () => {
    it('throws when plantId is missing', () => {
      expect(() =>
        base()
          .withPlantId(undefined as unknown as string)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });

    it('throws when fileId is missing', () => {
      expect(() =>
        base()
          .withFileId(undefined as unknown as string)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });

    it('throws when url is missing', () => {
      expect(() =>
        base()
          .withUrl(undefined as unknown as string)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });

    it('throws when id is missing (base builder validation)', () => {
      expect(() =>
        new PlantPhotoBuilder()
          .withPlantId(PLANT_ID)
          .withFileId(FILE_ID)
          .withUrl(URL)
          .withUserId(USER_ID)
          .withSpaceId(SPACE_ID)
          .withCreatedAt(CREATED_AT)
          .withUpdatedAt(UPDATED_AT)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });
  });
});
