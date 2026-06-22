import { FieldIsRequiredException } from '@sisques-labs/nestjs-kit';

import { PlantSpeciesBuilder } from './plant-species.builder';

const ID = '550e8400-e29b-41d4-a716-446655440000';
const CREATED_AT = new Date('2026-01-01T00:00:00.000Z');
const UPDATED_AT = new Date('2026-01-02T00:00:00.000Z');

const base = (): PlantSpeciesBuilder =>
  new PlantSpeciesBuilder()
    .withId(ID)
    .withScientificName('Monstera deliciosa')
    .withCreatedAt(CREATED_AT)
    .withUpdatedAt(UPDATED_AT);

describe('PlantSpeciesBuilder (plants context view model)', () => {
  describe('buildViewModel()', () => {
    it('builds a view model with required fields and null optionals', () => {
      const vm = base().buildViewModel();

      expect(vm.id).toBe(ID);
      expect(vm.scientificName).toBe('Monstera deliciosa');
      expect(vm.description).toBeNull();
      expect(vm.imageUrl).toBeNull();
    });

    it('includes optional fields when provided', () => {
      const vm = base()
        .withDescription('A tropical plant')
        .withImageUrl('https://example.com/m.png')
        .buildViewModel();

      expect(vm.description).toBe('A tropical plant');
      expect(vm.imageUrl).toBe('https://example.com/m.png');
    });
  });

  describe('validate()', () => {
    it('throws when scientificName is missing', () => {
      expect(() =>
        base()
          .withScientificName(undefined as unknown as string)
          .buildViewModel(),
      ).toThrow(FieldIsRequiredException);
    });

    it('throws when id is missing', () => {
      expect(() =>
        new PlantSpeciesBuilder()
          .withScientificName('Monstera deliciosa')
          .withCreatedAt(CREATED_AT)
          .withUpdatedAt(UPDATED_AT)
          .buildViewModel(),
      ).toThrow(FieldIsRequiredException);
    });
  });
});
