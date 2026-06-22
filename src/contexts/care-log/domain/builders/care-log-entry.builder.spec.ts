import { FieldIsRequiredException } from '@sisques-labs/nestjs-kit';

import { CareLogActivityTypeEnum } from '@contexts/care-log/domain/enums/care-log-activity-type.enum';
import { CareLogUnitEnum } from '@contexts/care-log/domain/enums/care-log-unit.enum';
import { CareLogEntryBuilder } from './care-log-entry.builder';

const ID = '550e8400-e29b-41d4-a716-446655440000';
const PLANT_ID = '110e8400-e29b-41d4-a716-446655440000';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const CREATED_AT = new Date('2026-01-01T00:00:00.000Z');
const UPDATED_AT = new Date('2026-01-02T00:00:00.000Z');
const PERFORMED_AT = new Date('2026-01-03T00:00:00.000Z');

const base = (): CareLogEntryBuilder =>
  new CareLogEntryBuilder()
    .withId(ID)
    .withPlantId(PLANT_ID)
    .withUserId(USER_ID)
    .withSpaceId(SPACE_ID)
    .withActivityType(CareLogActivityTypeEnum.WATERING)
    .withPerformedAt(PERFORMED_AT)
    .withCreatedAt(CREATED_AT)
    .withUpdatedAt(UPDATED_AT);

describe('CareLogEntryBuilder', () => {
  describe('build()', () => {
    it('builds an aggregate with required fields and null optionals', () => {
      const aggregate = base().build();

      expect(aggregate.id.value).toBe(ID);
      expect(aggregate.plantId.value).toBe(PLANT_ID);
      expect(aggregate.activityType.value).toBe(
        CareLogActivityTypeEnum.WATERING,
      );
      expect(aggregate.notes).toBeNull();
      expect(aggregate.quantity).toBeNull();
      expect(aggregate.unit).toBeNull();
    });

    it('wraps optional fields when provided', () => {
      const aggregate = base()
        .withNotes('Watered thoroughly')
        .withQuantity(500)
        .withUnit(CareLogUnitEnum.ML)
        .build();

      expect(aggregate.notes?.value).toBe('Watered thoroughly');
      expect(aggregate.quantity?.value).toBe(500);
      expect(aggregate.unit?.value).toBe(CareLogUnitEnum.ML);
    });
  });

  describe('buildViewModel()', () => {
    it('builds a view model with primitive values', () => {
      const vm = base().withNotes('note').buildViewModel();

      expect(vm.id).toBe(ID);
      expect(vm.plantId).toBe(PLANT_ID);
      expect(vm.activityType).toBe(CareLogActivityTypeEnum.WATERING);
      expect(vm.notes).toBe('note');
      expect(vm.quantity).toBeNull();
    });
  });

  describe('validate()', () => {
    it('throws when plantId is missing', () => {
      expect(() =>
        base()
          .withPlantId(undefined as unknown as string)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });

    it('throws when activityType is missing', () => {
      expect(() =>
        base()
          .withActivityType(undefined as unknown as string)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });

    it('throws when performedAt is missing', () => {
      expect(() =>
        base()
          .withPerformedAt(undefined as unknown as Date)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });
  });
});
