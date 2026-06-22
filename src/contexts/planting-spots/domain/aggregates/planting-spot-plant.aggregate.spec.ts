import { PlantingSpotPlantBuilder } from '@contexts/planting-spots/domain/builders/planting-spot-plant.builder';
import { PlantingSpotPlantAggregate } from './planting-spot-plant.aggregate';

const ID = '550e8400-e29b-41d4-a716-446655440000';
const SPECIES_ID = '880e8400-e29b-41d4-a716-446655440003';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const CREATED_AT = new Date('2026-01-01T00:00:00.000Z');
const UPDATED_AT = new Date('2026-01-02T00:00:00.000Z');

const buildAggregate = (): PlantingSpotPlantAggregate =>
  new PlantingSpotPlantBuilder()
    .withId(ID)
    .withName('Basil')
    .withPlantSpeciesId(SPECIES_ID)
    .withImageUrl('https://example.com/basil.png')
    .withUserId(USER_ID)
    .withSpaceId(SPACE_ID)
    .withCreatedAt(CREATED_AT)
    .withUpdatedAt(UPDATED_AT)
    .build();

describe('PlantingSpotPlantAggregate', () => {
  describe('getters', () => {
    it('exposes all fields via getters', () => {
      const aggregate = buildAggregate();

      expect(aggregate.id.value).toBe(ID);
      expect(aggregate.name.value).toBe('Basil');
      expect(aggregate.plantSpeciesId?.value).toBe(SPECIES_ID);
      expect(aggregate.imageUrl?.value).toBe('https://example.com/basil.png');
      expect(aggregate.userId.value).toBe(USER_ID);
      expect(aggregate.spaceId.value).toBe(SPACE_ID);
    });
  });

  describe('toPrimitives()', () => {
    it('serializes all fields into primitives', () => {
      const aggregate = buildAggregate();

      expect(aggregate.toPrimitives()).toEqual({
        id: ID,
        name: 'Basil',
        plantSpeciesId: SPECIES_ID,
        imageUrl: 'https://example.com/basil.png',
        userId: USER_ID,
        spaceId: SPACE_ID,
        createdAt: CREATED_AT,
        updatedAt: UPDATED_AT,
      });
    });

    it('serializes optional null fields as null', () => {
      const aggregate = new PlantingSpotPlantBuilder()
        .withId(ID)
        .withName('Basil')
        .withUserId(USER_ID)
        .withSpaceId(SPACE_ID)
        .withCreatedAt(CREATED_AT)
        .withUpdatedAt(UPDATED_AT)
        .build();

      const primitives = aggregate.toPrimitives();

      expect(primitives.plantSpeciesId).toBeNull();
      expect(primitives.imageUrl).toBeNull();
    });
  });
});
