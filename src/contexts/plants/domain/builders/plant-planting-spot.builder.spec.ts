import { FieldIsRequiredException } from '@sisques-labs/nestjs-kit';

import { PlantPlantingSpotBuilder } from './plant-planting-spot.builder';

const ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const CREATED_AT = new Date('2026-01-01T00:00:00.000Z');
const UPDATED_AT = new Date('2026-01-02T00:00:00.000Z');

const base = (): PlantPlantingSpotBuilder =>
  new PlantPlantingSpotBuilder()
    .withId(ID)
    .withName('Bed A')
    .withType('raised_bed')
    .withUserId(USER_ID)
    .withSpaceId(SPACE_ID)
    .withCreatedAt(CREATED_AT)
    .withUpdatedAt(UPDATED_AT);

describe('PlantPlantingSpotBuilder', () => {
  describe('buildViewModel()', () => {
    it('builds a view model with required fields and null description', () => {
      const vm = base().buildViewModel();

      expect(vm.id).toBe(ID);
      expect(vm.name).toBe('Bed A');
      expect(vm.type).toBe('raised_bed');
      expect(vm.description).toBeNull();
    });

    it('includes description when provided', () => {
      const vm = base().withDescription('Near the wall').buildViewModel();

      expect(vm.description).toBe('Near the wall');
    });
  });

  describe('validate()', () => {
    it('throws when name is missing', () => {
      expect(() =>
        base()
          .withName(undefined as unknown as string)
          .buildViewModel(),
      ).toThrow(FieldIsRequiredException);
    });

    it('throws when type is missing', () => {
      expect(() =>
        base()
          .withType(undefined as unknown as string)
          .buildViewModel(),
      ).toThrow(FieldIsRequiredException);
    });
  });
});
