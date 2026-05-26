import { UserStatusEnum } from '@sisques-labs/nestjs-kit';

import { UserAggregate } from '@contexts/users/domain/aggregates/user.aggregate';
import { UserBuilder } from '@contexts/users/domain/builders/user.builder';
import { UserTypeOrmEntity } from '../entities/user.entity';
import { UserTypeOrmMapper } from './user-typeorm.mapper';

const USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const CREATED_AT = new Date('2024-01-01T00:00:00.000Z');
const UPDATED_AT = new Date('2024-01-01T00:00:00.000Z');

const buildEntity = (): UserTypeOrmEntity => {
  const entity = new UserTypeOrmEntity();
  entity.id = USER_ID;
  entity.status = UserStatusEnum.ACTIVE;
  entity.username = 'johndoe';
  entity.firstName = 'John';
  entity.lastName = 'Doe';
  entity.avatarUrl = 'https://example.com/avatar.png';
  entity.bio = 'A short bio.';
  entity.locale = 'es-AR';
  entity.timezone = 'America/Buenos_Aires';
  entity.createdAt = CREATED_AT;
  entity.updatedAt = UPDATED_AT;
  return entity;
};

const buildEntityNullableFields = (): UserTypeOrmEntity => {
  const entity = new UserTypeOrmEntity();
  entity.id = USER_ID;
  entity.status = UserStatusEnum.ACTIVE;
  entity.username = 'johndoe';
  entity.firstName = null;
  entity.lastName = null;
  entity.avatarUrl = null;
  entity.bio = null;
  entity.locale = null;
  entity.timezone = null;
  entity.createdAt = CREATED_AT;
  entity.updatedAt = UPDATED_AT;
  return entity;
};

const buildAggregate = (): UserAggregate =>
  new UserBuilder()
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

const buildAggregateNullableFields = (): UserAggregate =>
  new UserBuilder()
    .withId(USER_ID)
    .withStatus(UserStatusEnum.ACTIVE)
    .withUsername('johndoe')
    .withCreatedAt(CREATED_AT)
    .withUpdatedAt(UPDATED_AT)
    .build();

describe('UserTypeOrmMapper', () => {
  let mapper: UserTypeOrmMapper;

  beforeEach(() => {
    const userBuilder = new UserBuilder();
    mapper = new UserTypeOrmMapper(userBuilder);
  });

  describe('toAggregate()', () => {
    it('should return a UserAggregate with VOs wrapping entity primitives', () => {
      const entity = buildEntity();

      const result = mapper.toAggregate(entity);

      expect(result).toBeInstanceOf(UserAggregate);
      expect(result.id.value).toBe(entity.id);
      expect(result.status.value).toBe(entity.status);
      expect(result.username.value).toBe(entity.username);
    });

    it('should map all profile fields from entity', () => {
      const entity = buildEntity();

      const result = mapper.toAggregate(entity);

      expect(result.firstName).toBe(entity.firstName);
      expect(result.lastName).toBe(entity.lastName);
      expect(result.avatarUrl).toBe(entity.avatarUrl);
      expect(result.bio).toBe(entity.bio);
      expect(result.locale).toBe(entity.locale);
      expect(result.timezone).toBe(entity.timezone);
    });

    it('should map nullable profile fields as null when entity has null values', () => {
      const entity = buildEntityNullableFields();

      const result = mapper.toAggregate(entity);

      expect(result.firstName).toBeNull();
      expect(result.lastName).toBeNull();
      expect(result.avatarUrl).toBeNull();
      expect(result.bio).toBeNull();
      expect(result.locale).toBeNull();
      expect(result.timezone).toBeNull();
    });

    it('should preserve createdAt and updatedAt from entity', () => {
      const entity = buildEntity();

      const result = mapper.toAggregate(entity);

      expect(result.createdAt.value).toEqual(entity.createdAt);
      expect(result.updatedAt.value).toEqual(entity.updatedAt);
    });
  });

  describe('toEntity()', () => {
    it('should return a UserTypeOrmEntity with plain primitives from aggregate', () => {
      const aggregate = buildAggregate();

      const result = mapper.toEntity(aggregate);

      expect(result).toBeInstanceOf(UserTypeOrmEntity);
      expect(result.id).toBe(aggregate.id.value);
      expect(result.status).toBe(aggregate.status.value);
      expect(result.username).toBe(aggregate.username.value);
    });

    it('should map all profile fields to entity', () => {
      const aggregate = buildAggregate();

      const result = mapper.toEntity(aggregate);

      expect(result.firstName).toBe(aggregate.firstName);
      expect(result.lastName).toBe(aggregate.lastName);
      expect(result.avatarUrl).toBe(aggregate.avatarUrl);
      expect(result.bio).toBe(aggregate.bio);
      expect(result.locale).toBe(aggregate.locale);
      expect(result.timezone).toBe(aggregate.timezone);
    });

    it('should map null profile fields to entity as null', () => {
      const aggregate = buildAggregateNullableFields();

      const result = mapper.toEntity(aggregate);

      expect(result.firstName).toBeNull();
      expect(result.lastName).toBeNull();
      expect(result.avatarUrl).toBeNull();
      expect(result.bio).toBeNull();
      expect(result.locale).toBeNull();
      expect(result.timezone).toBeNull();
    });

    it('should preserve createdAt and updatedAt from aggregate', () => {
      const aggregate = buildAggregate();

      const result = mapper.toEntity(aggregate);

      expect(result.createdAt).toEqual(aggregate.createdAt.value);
      expect(result.updatedAt).toEqual(aggregate.updatedAt.value);
    });
  });

  describe('round-trip (toAggregate → toEntity)', () => {
    it('should produce an entity equal to the original when round-tripped from entity with all fields', () => {
      const original = buildEntity();

      const aggregate = mapper.toAggregate(original);
      const result = mapper.toEntity(aggregate);

      expect(result.id).toBe(original.id);
      expect(result.status).toBe(original.status);
      expect(result.username).toBe(original.username);
      expect(result.firstName).toBe(original.firstName);
      expect(result.lastName).toBe(original.lastName);
      expect(result.avatarUrl).toBe(original.avatarUrl);
      expect(result.bio).toBe(original.bio);
      expect(result.locale).toBe(original.locale);
      expect(result.timezone).toBe(original.timezone);
      expect(result.createdAt).toEqual(original.createdAt);
      expect(result.updatedAt).toEqual(original.updatedAt);
    });

    it('should produce an entity with null profile fields when round-tripped from entity with null fields', () => {
      const original = buildEntityNullableFields();

      const aggregate = mapper.toAggregate(original);
      const result = mapper.toEntity(aggregate);

      expect(result.id).toBe(original.id);
      expect(result.username).toBe(original.username);
      expect(result.firstName).toBeNull();
      expect(result.lastName).toBeNull();
      expect(result.avatarUrl).toBeNull();
      expect(result.bio).toBeNull();
      expect(result.locale).toBeNull();
      expect(result.timezone).toBeNull();
    });
  });
});
