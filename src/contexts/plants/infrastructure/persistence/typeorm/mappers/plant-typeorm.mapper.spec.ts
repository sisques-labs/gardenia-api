import { PlantAggregate } from '@contexts/plants/domain/aggregates/plant.aggregate';
import { PlantBuilder } from '@contexts/plants/domain/builders/plant.builder';
import { PlantTypeOrmEntity } from '../entities/plant.entity';
import { PlantTypeOrmMapper } from './plant-typeorm.mapper';

const ID = '550e8400-e29b-41d4-a716-446655440000';
const SPECIES_ID = '880e8400-e29b-41d4-a716-446655440003';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const QR_ID = '990e8400-e29b-41d4-a716-446655440004';
const SPOT_ID = 'aa0e8400-e29b-41d4-a716-446655440005';
const CREATED_AT = new Date('2026-01-01T00:00:00.000Z');
const UPDATED_AT = new Date('2026-01-02T00:00:00.000Z');

const buildEntity = (
  overrides: Partial<PlantTypeOrmEntity> = {},
): PlantTypeOrmEntity => {
  const entity = new PlantTypeOrmEntity();
  entity.id = ID;
  entity.name = 'Aloe';
  entity.plantSpeciesId = SPECIES_ID;
  entity.imageUrl = 'https://example.com/aloe.png';
  entity.userId = USER_ID;
  entity.spaceId = SPACE_ID;
  entity.qrId = QR_ID;
  entity.plantingSpotId = SPOT_ID;
  entity.createdAt = CREATED_AT;
  entity.updatedAt = UPDATED_AT;
  return Object.assign(entity, overrides);
};

describe('PlantTypeOrmMapper', () => {
  let mapper: PlantTypeOrmMapper;

  beforeEach(() => {
    mapper = new PlantTypeOrmMapper(new PlantBuilder());
  });

  describe('toAggregate()', () => {
    it('wraps entity primitives into value objects', () => {
      const result = mapper.toAggregate(buildEntity());

      expect(result).toBeInstanceOf(PlantAggregate);
      expect(result.id.value).toBe(ID);
      expect(result.name.value).toBe('Aloe');
      expect(result.plantSpeciesId?.value).toBe(SPECIES_ID);
      expect(result.qrId?.value).toBe(QR_ID);
      expect(result.plantingSpotId?.value).toBe(SPOT_ID);
    });

    it('maps null optional id fields', () => {
      const result = mapper.toAggregate(
        buildEntity({
          plantSpeciesId: null,
          imageUrl: null,
          qrId: null,
          plantingSpotId: null,
        }),
      );

      expect(result.plantSpeciesId).toBeNull();
      expect(result.imageUrl).toBeNull();
      expect(result.qrId).toBeNull();
      expect(result.plantingSpotId).toBeNull();
    });
  });

  describe('toEntity()', () => {
    it('serializes the aggregate into entity primitives', () => {
      const aggregate = mapper.toAggregate(buildEntity());

      const result = mapper.toEntity(aggregate);

      expect(result).toBeInstanceOf(PlantTypeOrmEntity);
      expect(result.id).toBe(ID);
      expect(result.name).toBe('Aloe');
      expect(result.plantSpeciesId).toBe(SPECIES_ID);
      expect(result.qrId).toBe(QR_ID);
      expect(result.plantingSpotId).toBe(SPOT_ID);
    });
  });

  describe('toViewModel()', () => {
    it('maps entity primitives into a view model', () => {
      const vm = mapper.toViewModel(buildEntity());

      expect(vm.id).toBe(ID);
      expect(vm.name).toBe('Aloe');
      expect(vm.plantSpeciesId).toBe(SPECIES_ID);
    });
  });

  describe('round-trip', () => {
    it('preserves id fields through toAggregate → toEntity', () => {
      const original = buildEntity();

      const result = mapper.toEntity(mapper.toAggregate(original));

      expect(result.id).toBe(original.id);
      expect(result.qrId).toBe(original.qrId);
      expect(result.plantingSpotId).toBe(original.plantingSpotId);
    });
  });
});
