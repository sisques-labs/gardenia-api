import { FieldIsRequiredException } from '@sisques-labs/nestjs-kit';

import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';
import { PlantingSpotBuilder } from './planting-spot.builder';

const ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const CREATED_AT = new Date('2026-01-01T00:00:00.000Z');
const UPDATED_AT = new Date('2026-01-02T00:00:00.000Z');

const base = (): PlantingSpotBuilder =>
  new PlantingSpotBuilder()
    .withId(ID)
    .withName('Bed A')
    .withType(PlantingSpotTypeEnum.RAISED_BED)
    .withUserId(USER_ID)
    .withSpaceId(SPACE_ID)
    .withCreatedAt(CREATED_AT)
    .withUpdatedAt(UPDATED_AT);

describe('PlantingSpotBuilder', () => {
  describe('build()', () => {
    it('builds an aggregate with required fields and null optionals', () => {
      const aggregate = base().build();

      expect(aggregate.id.value).toBe(ID);
      expect(aggregate.name.value).toBe('Bed A');
      expect(aggregate.type.value).toBe(PlantingSpotTypeEnum.RAISED_BED);
      expect(aggregate.description).toBeNull();
      expect(aggregate.capacity).toBeNull();
      expect(aggregate.row).toBeNull();
      expect(aggregate.column).toBeNull();
      expect(aggregate.dimensions).toBeNull();
      expect(aggregate.soilType).toBeNull();
    });

    it('wraps scalar optional fields when provided', () => {
      const aggregate = base()
        .withDescription('Near the wall')
        .withCapacity(12)
        .withRow(2)
        .withColumn(3)
        .withSoilType('Loamy')
        .build();

      expect(aggregate.description?.value).toBe('Near the wall');
      expect(aggregate.capacity?.value).toBe(12);
      expect(aggregate.row?.value).toBe(2);
      expect(aggregate.column?.value).toBe(3);
      expect(aggregate.soilType?.value).toBe('Loamy');
    });

    it('leaves dimensions null when no dimension is provided', () => {
      const aggregate = base().build();

      expect(aggregate.dimensions).toBeNull();
    });

    it('builds dimensions when at least one dimension is provided', () => {
      const aggregate = base().withDimensionsWidth(100).build();

      expect(aggregate.dimensions).not.toBeNull();
      expect(aggregate.dimensions?.width).toBe(100);
      expect(aggregate.dimensions?.height).toBeNull();
      expect(aggregate.dimensions?.length).toBeNull();
    });

    it('builds dimensions with all three values', () => {
      const aggregate = base()
        .withDimensionsWidth(100)
        .withDimensionsHeight(50)
        .withDimensionsLength(200)
        .build();

      expect(aggregate.dimensions?.width).toBe(100);
      expect(aggregate.dimensions?.height).toBe(50);
      expect(aggregate.dimensions?.length).toBe(200);
    });
  });

  describe('buildViewModel()', () => {
    it('builds a view model with primitive dimension fields', () => {
      const vm = base()
        .withDimensionsWidth(100)
        .withDimensionsHeight(50)
        .buildViewModel();

      expect(vm.id).toBe(ID);
      expect(vm.dimensionsWidth).toBe(100);
      expect(vm.dimensionsHeight).toBe(50);
      expect(vm.dimensionsLength).toBeNull();
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

    it('throws when type is missing', () => {
      expect(() =>
        base()
          .withType(undefined as unknown as string)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });
  });
});
