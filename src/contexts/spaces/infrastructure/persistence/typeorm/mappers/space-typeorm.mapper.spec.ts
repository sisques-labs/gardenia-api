import { SpaceBuilder } from '@contexts/spaces/domain/builders/space.builder';
import { SpaceEntity } from '../entities/space.entity';
import { SpaceTypeOrmMapper } from './space-typeorm.mapper';

const SPACE_ID = '550e8400-e29b-41d4-a716-446655440001';
const OWNER_ID = '550e8400-e29b-41d4-a716-446655440002';
const CREATED_AT = new Date('2024-01-01T00:00:00.000Z');
const UPDATED_AT = new Date('2024-01-02T00:00:00.000Z');

const buildEntity = (): SpaceEntity => {
  const entity = new SpaceEntity();
  entity.id = SPACE_ID;
  entity.name = 'My Space';
  entity.ownerId = OWNER_ID;
  entity.createdAt = CREATED_AT;
  entity.updatedAt = UPDATED_AT;
  return entity;
};

const buildAggregate = () =>
  new SpaceBuilder()
    .withId(SPACE_ID)
    .withName('My Space')
    .withOwnerId(OWNER_ID)
    .withCreatedAt(CREATED_AT)
    .withUpdatedAt(UPDATED_AT)
    .build();

describe('SpaceTypeOrmMapper', () => {
  let mapper: SpaceTypeOrmMapper;

  beforeEach(() => {
    mapper = new SpaceTypeOrmMapper(new SpaceBuilder());
  });

  describe('toDomain()', () => {
    it('should return a SpaceAggregate from entity', () => {
      const entity = buildEntity();

      const result = mapper.toDomain(entity);

      expect(result.id.value).toBe(entity.id);
      expect(result.name.value).toBe(entity.name);
      expect(result.ownerId).toBe(entity.ownerId);
    });

    it('should preserve createdAt and updatedAt', () => {
      const entity = buildEntity();

      const result = mapper.toDomain(entity);

      expect(result.createdAt.value).toEqual(entity.createdAt);
      expect(result.updatedAt.value).toEqual(entity.updatedAt);
    });
  });

  describe('toPersistence()', () => {
    it('should return a Partial<SpaceEntity> with plain primitives', () => {
      const aggregate = buildAggregate();

      const result = mapper.toPersistence(aggregate);

      expect(result.id).toBe(aggregate.id.value);
      expect(result.name).toBe(aggregate.name.value);
      expect(result.ownerId).toBe(aggregate.ownerId);
    });

    it('should preserve timestamps', () => {
      const aggregate = buildAggregate();

      const result = mapper.toPersistence(aggregate);

      expect(result.createdAt).toEqual(aggregate.createdAt.value);
      expect(result.updatedAt).toEqual(aggregate.updatedAt.value);
    });
  });

  describe('round-trip (toDomain → toPersistence)', () => {
    it('should produce a partial entity equal to the original', () => {
      const original = buildEntity();

      const aggregate = mapper.toDomain(original);
      const result = mapper.toPersistence(aggregate);

      expect(result.id).toBe(original.id);
      expect(result.name).toBe(original.name);
      expect(result.ownerId).toBe(original.ownerId);
      expect(result.createdAt).toEqual(original.createdAt);
      expect(result.updatedAt).toEqual(original.updatedAt);
    });
  });
});
