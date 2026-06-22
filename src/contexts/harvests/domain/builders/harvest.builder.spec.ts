import { FieldIsRequiredException } from '@sisques-labs/nestjs-kit';

import { HarvestUnitEnum } from '@contexts/harvests/domain/enums/harvest-unit.enum';
import { HarvestBuilder } from './harvest.builder';

const ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const CREATED_AT = new Date('2026-01-01T00:00:00.000Z');
const UPDATED_AT = new Date('2026-01-02T00:00:00.000Z');
const HARVESTED_AT = new Date('2026-01-03T00:00:00.000Z');

const base = (): HarvestBuilder =>
  new HarvestBuilder()
    .withId(ID)
    .withCropType('Tomato')
    .withQuantity(2.5)
    .withUnit(HarvestUnitEnum.KG)
    .withHarvestedAt(HARVESTED_AT)
    .withUserId(USER_ID)
    .withSpaceId(SPACE_ID)
    .withCreatedAt(CREATED_AT)
    .withUpdatedAt(UPDATED_AT);

describe('HarvestBuilder', () => {
  describe('build()', () => {
    it('builds an aggregate with all fields wrapped in value objects', () => {
      const aggregate = base().build();

      expect(aggregate.id.value).toBe(ID);
      expect(aggregate.cropType.value).toBe('Tomato');
      expect(aggregate.quantity.value).toBe(2.5);
      expect(aggregate.unit.value).toBe(HarvestUnitEnum.KG);
      expect(aggregate.harvestedAt.value).toBe(HARVESTED_AT);
      expect(aggregate.userId.value).toBe(USER_ID);
      expect(aggregate.spaceId.value).toBe(SPACE_ID);
    });

    it('accepts a fractional quantity', () => {
      expect(base().withQuantity(0.5).build().quantity.value).toBe(0.5);
    });
  });

  describe('buildViewModel()', () => {
    it('builds a view model with primitive values', () => {
      const vm = base().buildViewModel();

      expect(vm.id).toBe(ID);
      expect(vm.cropType).toBe('Tomato');
      expect(vm.quantity).toBe(2.5);
      expect(vm.unit).toBe(HarvestUnitEnum.KG);
    });
  });

  describe('validate()', () => {
    it('throws when cropType is missing', () => {
      expect(() =>
        base()
          .withCropType(undefined as unknown as string)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });

    it('throws when unit is missing', () => {
      expect(() =>
        base()
          .withUnit(undefined as unknown as string)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });

    it('throws when harvestedAt is missing', () => {
      expect(() =>
        base()
          .withHarvestedAt(undefined as unknown as Date)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });

    it('throws when id is missing (base builder validation)', () => {
      expect(() =>
        new HarvestBuilder()
          .withCropType('Tomato')
          .withQuantity(1)
          .withUnit(HarvestUnitEnum.KG)
          .withHarvestedAt(HARVESTED_AT)
          .withUserId(USER_ID)
          .withSpaceId(SPACE_ID)
          .withCreatedAt(CREATED_AT)
          .withUpdatedAt(UPDATED_AT)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });
  });
});
