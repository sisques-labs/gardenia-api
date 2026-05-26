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
  entity.createdAt = CREATED_AT;
  entity.updatedAt = UPDATED_AT;
  return entity;
};

const buildAggregate = (): UserAggregate =>
  new UserBuilder()
    .withId(USER_ID)
    .withStatus(UserStatusEnum.ACTIVE)
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
    });

    it('should preserve createdAt and updatedAt from aggregate', () => {
      const aggregate = buildAggregate();

      const result = mapper.toEntity(aggregate);

      expect(result.createdAt).toEqual(aggregate.createdAt.value);
      expect(result.updatedAt).toEqual(aggregate.updatedAt.value);
    });
  });

  describe('round-trip (toAggregate → toEntity)', () => {
    it('should produce an entity equal to the original when round-tripped from entity', () => {
      const original = buildEntity();

      const aggregate = mapper.toAggregate(original);
      const result = mapper.toEntity(aggregate);

      expect(result.id).toBe(original.id);
      expect(result.status).toBe(original.status);
      expect(result.createdAt).toEqual(original.createdAt);
      expect(result.updatedAt).toEqual(original.updatedAt);
    });
  });
});
