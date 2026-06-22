import { PlantSpeciesAggregate } from '@contexts/plant-species/domain/aggregates/plant-species.aggregate';
import { PlantSpeciesBuilder } from '@contexts/plant-species/domain/builders/plant-species.builder';
import { PlantSpeciesTypeOrmEntity } from '@contexts/plant-species/infrastructure/persistence/typeorm/entities/plant-species.entity';
import { PlantSpeciesTypeOrmMapper } from './plant-species-typeorm.mapper';

const ID = '550e8400-e29b-41d4-a716-446655440000';
const CREATED_AT = new Date('2026-01-01T00:00:00.000Z');
const UPDATED_AT = new Date('2026-01-02T00:00:00.000Z');

const buildEntity = (overrides: Partial<PlantSpeciesTypeOrmEntity> = {}) => {
  const entity = new PlantSpeciesTypeOrmEntity();
  entity.id = ID;
  entity.scientificName = 'Monstera deliciosa';
  entity.description = 'A tropical plant';
  entity.imageUrl = 'https://example.com/m.png';
  entity.createdAt = CREATED_AT;
  entity.updatedAt = UPDATED_AT;
  return Object.assign(entity, overrides);
};

describe('PlantSpeciesTypeOrmMapper', () => {
  let mapper: PlantSpeciesTypeOrmMapper;

  beforeEach(() => {
    mapper = new PlantSpeciesTypeOrmMapper(new PlantSpeciesBuilder());
  });

  describe('toDomain()', () => {
    it('wraps entity primitives into value objects', () => {
      const result = mapper.toDomain(buildEntity());

      expect(result).toBeInstanceOf(PlantSpeciesAggregate);
      expect(result.id.value).toBe(ID);
      expect(result.scientificName.value).toBe('Monstera deliciosa');
      expect(result.description?.value).toBe('A tropical plant');
      expect(result.imageUrl?.value).toBe('https://example.com/m.png');
    });

    it('maps null optional fields', () => {
      const result = mapper.toDomain(
        buildEntity({ description: null, imageUrl: null }),
      );

      expect(result.description).toBeNull();
      expect(result.imageUrl).toBeNull();
    });
  });

  describe('toPersistence()', () => {
    it('serializes the aggregate into entity primitives', () => {
      const aggregate = mapper.toDomain(buildEntity());

      const result = mapper.toPersistence(aggregate);

      expect(result.id).toBe(ID);
      expect(result.scientificName).toBe('Monstera deliciosa');
      expect(result.description).toBe('A tropical plant');
      expect(result.imageUrl).toBe('https://example.com/m.png');
    });

    it('serializes null optional fields as null', () => {
      const aggregate = mapper.toDomain(
        buildEntity({ description: null, imageUrl: null }),
      );

      const result = mapper.toPersistence(aggregate);

      expect(result.description).toBeNull();
      expect(result.imageUrl).toBeNull();
    });
  });
});
