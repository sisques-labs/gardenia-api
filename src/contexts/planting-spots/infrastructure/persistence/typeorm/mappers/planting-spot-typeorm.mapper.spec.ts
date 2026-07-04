import { PlantingSpotBuilder } from '@contexts/planting-spots/domain/builders/planting-spot.builder';
import { PlantingSpotStatusEnum } from '@contexts/planting-spots/domain/enums/planting-spot-status.enum';
import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';
import { PlantingSpotTypeOrmEntity } from '../entities/planting-spot.entity';
import { PlantingSpotTypeOrmMapper } from './planting-spot-typeorm.mapper';

const makeBuilder = () => new PlantingSpotBuilder();

const SPOT_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440002';

const entityFixture = (): PlantingSpotTypeOrmEntity => {
  const e = new PlantingSpotTypeOrmEntity();
  e.id = SPOT_ID;
  e.name = 'Bancal Norte';
  e.type = PlantingSpotTypeEnum.RAISED_BED;
  e.description = 'A raised bed';
  e.status = PlantingSpotStatusEnum.ACTIVE;
  e.fallowSince = null;
  e.userId = USER_ID;
  e.spaceId = SPACE_ID;
  e.createdAt = new Date('2024-01-01T00:00:00.000Z');
  e.updatedAt = new Date('2024-01-02T00:00:00.000Z');
  return e;
};

describe('PlantingSpotTypeOrmMapper', () => {
  let mapper: PlantingSpotTypeOrmMapper;

  beforeEach(() => {
    mapper = new PlantingSpotTypeOrmMapper(makeBuilder());
  });

  describe('toDomain', () => {
    it('should map entity to aggregate with all fields', () => {
      const entity = entityFixture();
      const aggregate = mapper.toDomain(entity);
      const primitives = aggregate.toPrimitives();

      expect(primitives.id).toBe(entity.id);
      expect(primitives.name).toBe(entity.name);
      expect(primitives.type).toBe(entity.type);
      expect(primitives.description).toBe(entity.description);
      expect(primitives.userId).toBe(entity.userId);
      expect(primitives.spaceId).toBe(entity.spaceId);
      expect(primitives.status).toBe(entity.status);
      expect(primitives.fallowSince).toBe(entity.fallowSince);
    });

    it('should map entity with null description', () => {
      const entity = entityFixture();
      entity.description = null;
      const aggregate = mapper.toDomain(entity);
      expect(aggregate.toPrimitives().description).toBeNull();
    });

    it('should map entity with fallow status and fallowSince', () => {
      const entity = entityFixture();
      entity.status = PlantingSpotStatusEnum.FALLOW;
      entity.fallowSince = new Date('2026-05-01T00:00:00.000Z');
      const aggregate = mapper.toDomain(entity);
      const primitives = aggregate.toPrimitives();
      expect(primitives.status).toBe(PlantingSpotStatusEnum.FALLOW);
      expect(primitives.fallowSince).toEqual(entity.fallowSince);
    });
  });

  describe('toPersistence', () => {
    it('should map aggregate to entity with all fields', () => {
      const entity = entityFixture();
      const aggregate = mapper.toDomain(entity);
      const result = mapper.toPersistence(aggregate);

      expect(result.id).toBe(entity.id);
      expect(result.name).toBe(entity.name);
      expect(result.type).toBe(entity.type);
      expect(result.description).toBe(entity.description);
      expect(result.userId).toBe(entity.userId);
      expect(result.spaceId).toBe(entity.spaceId);
      expect(result.status).toBe(entity.status);
      expect(result.fallowSince).toBe(entity.fallowSince);
    });
  });
});
