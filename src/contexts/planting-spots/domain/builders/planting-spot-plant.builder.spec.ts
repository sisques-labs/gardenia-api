import { FieldIsRequiredException } from '@sisques-labs/nestjs-kit';

import { PlantingSpotPlantBuilder } from './planting-spot-plant.builder';

const ID = '550e8400-e29b-41d4-a716-446655440000';
const SPECIES_ID = '880e8400-e29b-41d4-a716-446655440003';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const CREATED_AT = new Date('2026-01-01T00:00:00.000Z');
const UPDATED_AT = new Date('2026-01-02T00:00:00.000Z');

const base = (): PlantingSpotPlantBuilder =>
  new PlantingSpotPlantBuilder()
    .withId(ID)
    .withName('Basil')
    .withUserId(USER_ID)
    .withSpaceId(SPACE_ID)
    .withCreatedAt(CREATED_AT)
    .withUpdatedAt(UPDATED_AT);

describe('PlantingSpotPlantBuilder', () => {
  describe('build()', () => {
    it('builds an aggregate with required fields and null optionals', () => {
      const aggregate = base().build();

      expect(aggregate.id.value).toBe(ID);
      expect(aggregate.name.value).toBe('Basil');
      expect(aggregate.userId.value).toBe(USER_ID);
      expect(aggregate.spaceId.value).toBe(SPACE_ID);
      expect(aggregate.plantSpeciesId).toBeNull();
      expect(aggregate.imageUrl).toBeNull();
    });

    it('wraps optional fields when provided', () => {
      const aggregate = base()
        .withPlantSpeciesId(SPECIES_ID)
        .withImageUrl('https://example.com/basil.png')
        .build();

      expect(aggregate.plantSpeciesId?.value).toBe(SPECIES_ID);
      expect(aggregate.imageUrl?.value).toBe('https://example.com/basil.png');
    });
  });

  describe('buildViewModel()', () => {
    it('builds a view model with primitive values', () => {
      const vm = base().withPlantSpeciesId(SPECIES_ID).buildViewModel();

      expect(vm.id).toBe(ID);
      expect(vm.name).toBe('Basil');
      expect(vm.plantSpeciesId).toBe(SPECIES_ID);
      expect(vm.imageUrl).toBeNull();
    });
  });

  describe('validate()', () => {
    it('throws when name is missing', () => {
      expect(() =>
        base()
          .withName(undefined as unknown as string)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });

    it('throws when userId is missing', () => {
      expect(() =>
        base()
          .withUserId(undefined as unknown as string)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });
  });
});
