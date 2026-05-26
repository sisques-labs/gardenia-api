import { FieldIsRequiredException, UserStatusEnum } from '@sisques-labs/nestjs-kit';

import { UserAggregate } from '@contexts/users/domain/aggregates/user.aggregate';
import { UserBuilder } from './user.builder';

const USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const CREATED_AT = new Date('2024-01-01T00:00:00.000Z');
const UPDATED_AT = new Date('2024-01-01T00:00:00.000Z');

describe('UserBuilder', () => {
  let builder: UserBuilder;

  beforeEach(() => {
    builder = new UserBuilder();
  });

  describe('build()', () => {
    it('should return a UserAggregate with the supplied values', () => {
      const user = builder
        .withId(USER_ID)
        .withStatus(UserStatusEnum.ACTIVE)
        .withUsername('johndoe')
        .withCreatedAt(CREATED_AT)
        .withUpdatedAt(UPDATED_AT)
        .build();

      expect(user).toBeInstanceOf(UserAggregate);
      expect(user.id.value).toBe(USER_ID);
      expect(user.status.value).toBe(UserStatusEnum.ACTIVE);
      expect(user.username.value).toBe('johndoe');
      expect(user.createdAt.value).toEqual(CREATED_AT);
      expect(user.updatedAt.value).toEqual(UPDATED_AT);
    });

    it('should default createdAt to current date when not provided', () => {
      const now = new Date();
      const user = builder
        .withId(USER_ID)
        .withStatus(UserStatusEnum.ACTIVE)
        .withUsername('johndoe')
        .withCreatedAt(now)
        .withUpdatedAt(now)
        .build();

      expect(user.createdAt.value).toEqual(now);
    });

    it('should default updatedAt to current date when not provided', () => {
      const now = new Date();
      const user = builder
        .withId(USER_ID)
        .withStatus(UserStatusEnum.ACTIVE)
        .withUsername('johndoe')
        .withCreatedAt(now)
        .withUpdatedAt(now)
        .build();

      expect(user.updatedAt.value).toEqual(now);
    });

    it('should support chaining — withStatus returns the builder instance', () => {
      const result = builder.withStatus(UserStatusEnum.ACTIVE);

      expect(result).toBe(builder);
    });

    it('should support chaining — withUsername returns the builder instance', () => {
      const result = builder.withUsername('johndoe');

      expect(result).toBe(builder);
    });
  });

  describe('validate()', () => {
    it('should throw FieldIsRequiredException when id is missing', () => {
      expect(() =>
        builder
          .withStatus(UserStatusEnum.ACTIVE)
          .withUsername('johndoe')
          .withCreatedAt(CREATED_AT)
          .withUpdatedAt(UPDATED_AT)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });

    it('should throw FieldIsRequiredException when status is missing', () => {
      expect(() =>
        builder
          .withId(USER_ID)
          .withUsername('johndoe')
          .withCreatedAt(CREATED_AT)
          .withUpdatedAt(UPDATED_AT)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });

    it('should throw FieldIsRequiredException when username is missing', () => {
      expect(() =>
        builder
          .withId(USER_ID)
          .withStatus(UserStatusEnum.ACTIVE)
          .withCreatedAt(CREATED_AT)
          .withUpdatedAt(UPDATED_AT)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });

    it('should throw FieldIsRequiredException when createdAt is missing', () => {
      expect(() =>
        builder
          .withId(USER_ID)
          .withStatus(UserStatusEnum.ACTIVE)
          .withUsername('johndoe')
          .build(),
      ).toThrow(FieldIsRequiredException);
    });
  });

  describe('buildViewModel()', () => {
    it('should return a UserViewModel with the supplied values', () => {
      const viewModel = builder
        .withId(USER_ID)
        .withStatus(UserStatusEnum.ACTIVE)
        .withUsername('johndoe')
        .withCreatedAt(CREATED_AT)
        .withUpdatedAt(UPDATED_AT)
        .buildViewModel();

      expect(viewModel.id).toBe(USER_ID);
      expect(viewModel.status).toBe(UserStatusEnum.ACTIVE);
      expect(viewModel.username).toBe('johndoe');
      expect(viewModel.createdAt).toEqual(CREATED_AT);
      expect(viewModel.updatedAt).toEqual(UPDATED_AT);
    });
  });
});
