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

    it('should return a UserAggregate with all profile fields set', () => {
      const user = builder
        .withId(USER_ID)
        .withStatus(UserStatusEnum.ACTIVE)
        .withUsername('johndoe')
        .withFirstName('John')
        .withLastName('Doe')
        .withAvatarUrl('https://example.com/avatar.png')
        .withBio('A short bio.')
        .withLocale('es-AR')
        .withTimezone('America/Buenos_Aires')
        .withCreatedAt(CREATED_AT)
        .withUpdatedAt(UPDATED_AT)
        .build();

      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('Doe');
      expect(user.avatarUrl).toBe('https://example.com/avatar.png');
      expect(user.bio).toBe('A short bio.');
      expect(user.locale).toBe('es-AR');
      expect(user.timezone).toBe('America/Buenos_Aires');
    });

    it('should default all nullable profile fields to null when not provided', () => {
      const user = builder
        .withId(USER_ID)
        .withStatus(UserStatusEnum.ACTIVE)
        .withUsername('johndoe')
        .withCreatedAt(CREATED_AT)
        .withUpdatedAt(UPDATED_AT)
        .build();

      expect(user.firstName).toBeNull();
      expect(user.lastName).toBeNull();
      expect(user.avatarUrl).toBeNull();
      expect(user.bio).toBeNull();
      expect(user.locale).toBeNull();
      expect(user.timezone).toBeNull();
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

    it('should support chaining — withFirstName returns the builder instance', () => {
      const result = builder.withFirstName('John');

      expect(result).toBe(builder);
    });

    it('should support chaining — withLastName returns the builder instance', () => {
      const result = builder.withLastName('Doe');

      expect(result).toBe(builder);
    });

    it('should support chaining — withAvatarUrl returns the builder instance', () => {
      const result = builder.withAvatarUrl('https://example.com/avatar.png');

      expect(result).toBe(builder);
    });

    it('should support chaining — withBio returns the builder instance', () => {
      const result = builder.withBio('A bio.');

      expect(result).toBe(builder);
    });

    it('should support chaining — withLocale returns the builder instance', () => {
      const result = builder.withLocale('es-AR');

      expect(result).toBe(builder);
    });

    it('should support chaining — withTimezone returns the builder instance', () => {
      const result = builder.withTimezone('America/Buenos_Aires');

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

    it('should return a UserViewModel with all profile fields', () => {
      const viewModel = builder
        .withId(USER_ID)
        .withStatus(UserStatusEnum.ACTIVE)
        .withUsername('johndoe')
        .withFirstName('John')
        .withLastName('Doe')
        .withAvatarUrl('https://example.com/avatar.png')
        .withBio('A short bio.')
        .withLocale('es-AR')
        .withTimezone('America/Buenos_Aires')
        .withCreatedAt(CREATED_AT)
        .withUpdatedAt(UPDATED_AT)
        .buildViewModel();

      expect(viewModel.firstName).toBe('John');
      expect(viewModel.lastName).toBe('Doe');
      expect(viewModel.avatarUrl).toBe('https://example.com/avatar.png');
      expect(viewModel.bio).toBe('A short bio.');
      expect(viewModel.locale).toBe('es-AR');
      expect(viewModel.timezone).toBe('America/Buenos_Aires');
    });

    it('should return a UserViewModel with null profile fields when not provided', () => {
      const viewModel = builder
        .withId(USER_ID)
        .withStatus(UserStatusEnum.ACTIVE)
        .withUsername('johndoe')
        .withCreatedAt(CREATED_AT)
        .withUpdatedAt(UPDATED_AT)
        .buildViewModel();

      expect(viewModel.firstName).toBeNull();
      expect(viewModel.lastName).toBeNull();
      expect(viewModel.avatarUrl).toBeNull();
      expect(viewModel.bio).toBeNull();
      expect(viewModel.locale).toBeNull();
      expect(viewModel.timezone).toBeNull();
    });
  });
});
