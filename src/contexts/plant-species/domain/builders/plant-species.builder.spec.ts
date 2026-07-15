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

describe('PlantSpeciesBuilder', () => {
  describe('build()', () => {
    it('builds an aggregate with required fields and null gbifKey', () => {
      const aggregate = base().build();

      expect(aggregate.id.value).toBe(ID);
      expect(aggregate.scientificName.value).toBe('Monstera deliciosa');
      expect(aggregate.gbifKey).toBeNull();
    });

    it('wraps gbifKey when provided', () => {
      const aggregate = base().withGbifKey(2882337).build();

      expect(aggregate.gbifKey?.value).toBe(2882337);
    });
  });

  describe('buildViewModel()', () => {
    it('builds a view model with primitive values', () => {
      const vm = base().withGbifKey(2882337).buildViewModel();

      expect(vm.id).toBe(ID);
      expect(vm.scientificName).toBe('Monstera deliciosa');
      expect(vm.gbifKey).toBe(2882337);
    });

    it('builds a view model with null gbifKey when absent', () => {
      const vm = base().buildViewModel();

      expect(vm.gbifKey).toBeNull();
    });
  });

  describe('validate()', () => {
    it('throws when scientificName is missing', () => {
      expect(() =>
        base()
          .withScientificName(undefined as unknown as string)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });

    it('throws when id is missing', () => {
      expect(() =>
        new PlantSpeciesBuilder()
          .withScientificName('Monstera deliciosa')
          .withCreatedAt(CREATED_AT)
          .withUpdatedAt(UPDATED_AT)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });
  });
});
