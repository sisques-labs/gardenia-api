import { FieldIsRequiredException } from '@sisques-labs/nestjs-kit';

import { PlantBuilder } from './plant.builder';

const ID = '550e8400-e29b-41d4-a716-446655440000';
const SPECIES_ID = '880e8400-e29b-41d4-a716-446655440003';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const QR_ID = '990e8400-e29b-41d4-a716-446655440004';
const SPOT_ID = 'aa0e8400-e29b-41d4-a716-446655440005';
const CREATED_AT = new Date('2026-01-01T00:00:00.000Z');
const UPDATED_AT = new Date('2026-01-02T00:00:00.000Z');

const base = (): PlantBuilder =>
  new PlantBuilder()
    .withId(ID)
    .withName('Aloe')
    .withUserId(USER_ID)
    .withSpaceId(SPACE_ID)
    .withCreatedAt(CREATED_AT)
    .withUpdatedAt(UPDATED_AT);

describe('PlantBuilder', () => {
  describe('build()', () => {
    it('builds an aggregate with required fields and null optionals', () => {
      const aggregate = base().build();

      expect(aggregate.id.value).toBe(ID);
      expect(aggregate.name.value).toBe('Aloe');
      expect(aggregate.userId.value).toBe(USER_ID);
      expect(aggregate.spaceId.value).toBe(SPACE_ID);
      expect(aggregate.plantSpeciesId).toBeNull();
      expect(aggregate.imageUrl).toBeNull();
      expect(aggregate.qrId).toBeNull();
      expect(aggregate.plantingSpotId).toBeNull();
    });

    it('wraps optional id fields when provided', () => {
      const aggregate = base()
        .withPlantSpeciesId(SPECIES_ID)
        .withImageUrl('https://example.com/aloe.png')
        .withQrId(QR_ID)
        .withPlantingSpotId(SPOT_ID)
        .build();

      expect(aggregate.plantSpeciesId?.value).toBe(SPECIES_ID);
      expect(aggregate.imageUrl?.value).toBe('https://example.com/aloe.png');
      expect(aggregate.qrId?.value).toBe(QR_ID);
      expect(aggregate.plantingSpotId?.value).toBe(SPOT_ID);
    });
  });

  describe('buildViewModel()', () => {
    it('builds a view model with primitive values and null nested view models', () => {
      const vm = base().withPlantSpeciesId(SPECIES_ID).buildViewModel();

      expect(vm.id).toBe(ID);
      expect(vm.name).toBe('Aloe');
      expect(vm.plantSpeciesId).toBe(SPECIES_ID);
      expect(vm.species).toBeNull();
      expect(vm.qr).toBeNull();
      expect(vm.plantingSpot).toBeNull();
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

    it('throws when spaceId is missing', () => {
      expect(() =>
        base()
          .withSpaceId(undefined as unknown as string)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });
  });
});
