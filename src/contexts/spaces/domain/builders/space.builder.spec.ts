import { FieldIsRequiredException } from '@sisques-labs/nestjs-kit';

import { SpaceAggregate } from '../aggregates/space.aggregate';
import { SpaceViewModel } from '../view-models/space.view-model';
import { SpaceBuilder } from './space.builder';

const SPACE_ID = '550e8400-e29b-41d4-a716-446655440000';
const OWNER_ID = '550e8400-e29b-41d4-a716-446655440001';
const SPACE_NAME = 'My Space';
const CREATED_AT = new Date('2024-01-01T00:00:00.000Z');
const UPDATED_AT = new Date('2024-01-01T00:00:00.000Z');

describe('SpaceBuilder', () => {
  let builder: SpaceBuilder;

  beforeEach(() => {
    builder = new SpaceBuilder();
  });

  describe('build()', () => {
    it('should return a SpaceAggregate with the supplied values', () => {
      const space = builder
        .withId(SPACE_ID)
        .withName(SPACE_NAME)
        .withOwnerId(OWNER_ID)
        .withCreatedAt(CREATED_AT)
        .withUpdatedAt(UPDATED_AT)
        .build();

      expect(space).toBeInstanceOf(SpaceAggregate);
      expect(space.id.value).toBe(SPACE_ID);
      expect(space.name.value).toBe(SPACE_NAME);
      expect(space.ownerId).toBe(OWNER_ID);
    });

    it('should support method chaining', () => {
      const result = builder.withName(SPACE_NAME);
      expect(result).toBe(builder);
    });
  });

  describe('buildViewModel()', () => {
    it('should return a SpaceViewModel with the supplied values', () => {
      const viewModel = builder
        .withId(SPACE_ID)
        .withName(SPACE_NAME)
        .withOwnerId(OWNER_ID)
        .withCreatedAt(CREATED_AT)
        .withUpdatedAt(UPDATED_AT)
        .buildViewModel();

      expect(viewModel).toBeInstanceOf(SpaceViewModel);
      expect(viewModel.id).toBe(SPACE_ID);
      expect(viewModel.name).toBe(SPACE_NAME);
      expect(viewModel.ownerId).toBe(OWNER_ID);
    });
  });

  describe('validate()', () => {
    it('should throw FieldIsRequiredException when id is missing', () => {
      expect(() =>
        builder
          .withName(SPACE_NAME)
          .withOwnerId(OWNER_ID)
          .withCreatedAt(CREATED_AT)
          .withUpdatedAt(UPDATED_AT)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });

    it('should throw FieldIsRequiredException when name is missing', () => {
      expect(() =>
        builder
          .withId(SPACE_ID)
          .withOwnerId(OWNER_ID)
          .withCreatedAt(CREATED_AT)
          .withUpdatedAt(UPDATED_AT)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });

    it('should throw FieldIsRequiredException when ownerId is missing', () => {
      expect(() =>
        builder
          .withId(SPACE_ID)
          .withName(SPACE_NAME)
          .withCreatedAt(CREATED_AT)
          .withUpdatedAt(UPDATED_AT)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });

    it('should throw FieldIsRequiredException when createdAt is missing', () => {
      expect(() =>
        builder
          .withId(SPACE_ID)
          .withName(SPACE_NAME)
          .withOwnerId(OWNER_ID)
          .withUpdatedAt(UPDATED_AT)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });
  });
});
