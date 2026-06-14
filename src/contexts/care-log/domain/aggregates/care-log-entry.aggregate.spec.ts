import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { CareLogEntryCreatedEvent } from '@contexts/care-log/domain/events/care-log-entry-created/care-log-entry-created.event';
import { CareLogEntryDeletedEvent } from '@contexts/care-log/domain/events/care-log-entry-deleted/care-log-entry-deleted.event';
import { CareLogEntryUpdatedEvent } from '@contexts/care-log/domain/events/care-log-entry-updated/care-log-entry-updated.event';
import { CareLogActivityTypeChangedEvent } from '@contexts/care-log/domain/events/field-changed/care-log-activity-type-changed/care-log-activity-type-changed.event';
import { CareLogActivityTypeEnum } from '@contexts/care-log/domain/enums/care-log-activity-type.enum';
import { CareLogUnitEnum } from '@contexts/care-log/domain/enums/care-log-unit.enum';
import { CareLogQuantityUnitMismatchException } from '@contexts/care-log/domain/exceptions/care-log-quantity-unit-mismatch.exception';
import { CareLogIdValueObject } from '@contexts/care-log/domain/value-objects/care-log-id/care-log-id.value-object';
import { CareLogActivityTypeValueObject } from '@contexts/care-log/domain/value-objects/care-log-activity-type/care-log-activity-type.value-object';
import { CareLogPerformedAtValueObject } from '@contexts/care-log/domain/value-objects/care-log-performed-at/care-log-performed-at.value-object';
import { CareLogNotesValueObject } from '@contexts/care-log/domain/value-objects/care-log-notes/care-log-notes.value-object';
import { CareLogQuantityValueObject } from '@contexts/care-log/domain/value-objects/care-log-quantity/care-log-quantity.value-object';
import { CareLogUnitValueObject } from '@contexts/care-log/domain/value-objects/care-log-unit/care-log-unit.value-object';

import { CareLogEntryAggregate } from './care-log-entry.aggregate';

const ENTRY_ID = '550e8400-e29b-41d4-a716-446655440000';
const PLANT_ID = '550e8400-e29b-41d4-a716-446655440001';
const USER_ID = '550e8400-e29b-41d4-a716-446655440002';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440003';
const NOW = new Date('2024-01-01T00:00:00.000Z');

const buildAggregate = (overrides?: Partial<{
  quantity: CareLogQuantityValueObject | null;
  unit: CareLogUnitValueObject | null;
  notes: CareLogNotesValueObject | null;
}>): CareLogEntryAggregate =>
  new CareLogEntryAggregate({
    id: new CareLogIdValueObject(ENTRY_ID),
    plantId: new UuidValueObject(PLANT_ID),
    userId: new UuidValueObject(USER_ID),
    spaceId: new UuidValueObject(SPACE_ID),
    activityType: new CareLogActivityTypeValueObject(CareLogActivityTypeEnum.WATERING),
    performedAt: new CareLogPerformedAtValueObject(NOW),
    notes: overrides?.notes !== undefined ? overrides.notes : null,
    quantity: overrides?.quantity !== undefined ? overrides.quantity : null,
    unit: overrides?.unit !== undefined ? overrides.unit : null,
    createdAt: new DateValueObject(NOW),
    updatedAt: new DateValueObject(NOW),
  });

describe('CareLogEntryAggregate', () => {
  describe('create()', () => {
    it('should emit a CareLogEntryCreatedEvent', () => {
      const entry = buildAggregate();
      entry.create();
      const events = entry.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(CareLogEntryCreatedEvent);
    });

    it('should throw CareLogQuantityUnitMismatchException when quantity provided without unit', () => {
      const entry = buildAggregate({
        quantity: new CareLogQuantityValueObject(100),
        unit: null,
      });
      expect(() => entry.create()).toThrow(CareLogQuantityUnitMismatchException);
    });

    it('should throw CareLogQuantityUnitMismatchException when unit provided without quantity', () => {
      const entry = buildAggregate({
        quantity: null,
        unit: new CareLogUnitValueObject(CareLogUnitEnum.ML),
      });
      expect(() => entry.create()).toThrow(CareLogQuantityUnitMismatchException);
    });

    it('should not throw when both quantity and unit are null', () => {
      const entry = buildAggregate({ quantity: null, unit: null });
      expect(() => entry.create()).not.toThrow();
    });

    it('should not throw when both quantity and unit are provided', () => {
      const entry = buildAggregate({
        quantity: new CareLogQuantityValueObject(100),
        unit: new CareLogUnitValueObject(CareLogUnitEnum.ML),
      });
      expect(() => entry.create()).not.toThrow();
    });
  });

  describe('update()', () => {
    it('should emit field-changed event and CareLogEntryUpdatedEvent when activityType changes', () => {
      const entry = buildAggregate();
      entry.update({
        activityType: new CareLogActivityTypeValueObject(CareLogActivityTypeEnum.FERTILIZING),
      });
      const events = entry.getUncommittedEvents();
      expect(events.some((e) => e instanceof CareLogActivityTypeChangedEvent)).toBe(true);
      expect(events.some((e) => e instanceof CareLogEntryUpdatedEvent)).toBe(true);
    });

    it('should only emit CareLogEntryUpdatedEvent when no field changes', () => {
      const entry = buildAggregate();
      entry.update({});
      const events = entry.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(CareLogEntryUpdatedEvent);
    });

    it('should throw CareLogQuantityUnitMismatchException on quantity/unit mismatch', () => {
      const entry = buildAggregate({
        quantity: new CareLogQuantityValueObject(100),
        unit: new CareLogUnitValueObject(CareLogUnitEnum.ML),
      });
      expect(() =>
        entry.update({ unit: null }),
      ).toThrow(CareLogQuantityUnitMismatchException);
    });
  });

  describe('delete()', () => {
    it('should emit a CareLogEntryDeletedEvent', () => {
      const entry = buildAggregate();
      entry.delete();
      const events = entry.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(CareLogEntryDeletedEvent);
    });
  });

  describe('toPrimitives()', () => {
    it('should return correct shape', () => {
      const entry = buildAggregate({
        notes: new CareLogNotesValueObject('some notes'),
        quantity: new CareLogQuantityValueObject(250),
        unit: new CareLogUnitValueObject(CareLogUnitEnum.ML),
      });
      const primitives = entry.toPrimitives();
      expect(primitives.id).toBe(ENTRY_ID);
      expect(primitives.plantId).toBe(PLANT_ID);
      expect(primitives.userId).toBe(USER_ID);
      expect(primitives.spaceId).toBe(SPACE_ID);
      expect(primitives.activityType).toBe(CareLogActivityTypeEnum.WATERING);
      expect(primitives.performedAt).toEqual(NOW);
      expect(primitives.notes).toBe('some notes');
      expect(primitives.quantity).toBe(250);
      expect(primitives.unit).toBe(CareLogUnitEnum.ML);
    });

    it('should return null for optional fields when not provided', () => {
      const entry = buildAggregate();
      const primitives = entry.toPrimitives();
      expect(primitives.notes).toBeNull();
      expect(primitives.quantity).toBeNull();
      expect(primitives.unit).toBeNull();
    });
  });
});
