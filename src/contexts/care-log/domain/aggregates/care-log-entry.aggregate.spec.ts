import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { CareLogEntryCreatedEvent } from '@contexts/care-log/domain/events/care-log-entry-created/care-log-entry-created.event';
import { CareLogEntryDeletedEvent } from '@contexts/care-log/domain/events/care-log-entry-deleted/care-log-entry-deleted.event';
import { CareLogEntryUpdatedEvent } from '@contexts/care-log/domain/events/care-log-entry-updated/care-log-entry-updated.event';
import { CareLogActivityTypeChangedEvent } from '@contexts/care-log/domain/events/field-changed/care-log-activity-type-changed/care-log-activity-type-changed.event';
import { CareLogNotesChangedEvent } from '@contexts/care-log/domain/events/field-changed/care-log-notes-changed/care-log-notes-changed.event';
import { CareLogPerformedAtChangedEvent } from '@contexts/care-log/domain/events/field-changed/care-log-performed-at-changed/care-log-performed-at-changed.event';
import { CareLogQuantityChangedEvent } from '@contexts/care-log/domain/events/field-changed/care-log-quantity-changed/care-log-quantity-changed.event';
import { CareLogUnitChangedEvent } from '@contexts/care-log/domain/events/field-changed/care-log-unit-changed/care-log-unit-changed.event';
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

const buildAggregate = (
  overrides?: Partial<{
    quantity: CareLogQuantityValueObject | null;
    unit: CareLogUnitValueObject | null;
    notes: CareLogNotesValueObject | null;
  }>,
): CareLogEntryAggregate =>
  new CareLogEntryAggregate({
    id: new CareLogIdValueObject(ENTRY_ID),
    plantId: new UuidValueObject(PLANT_ID),
    userId: new UuidValueObject(USER_ID),
    spaceId: new UuidValueObject(SPACE_ID),
    activityType: new CareLogActivityTypeValueObject(
      CareLogActivityTypeEnum.WATERING,
    ),
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
      expect(() => entry.create()).toThrow(
        CareLogQuantityUnitMismatchException,
      );
    });

    it('should throw CareLogQuantityUnitMismatchException when unit provided without quantity', () => {
      const entry = buildAggregate({
        quantity: null,
        unit: new CareLogUnitValueObject(CareLogUnitEnum.ML),
      });
      expect(() => entry.create()).toThrow(
        CareLogQuantityUnitMismatchException,
      );
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
        activityType: new CareLogActivityTypeValueObject(
          CareLogActivityTypeEnum.FERTILIZING,
        ),
      });
      const events = entry.getUncommittedEvents();
      expect(
        events.some((e) => e instanceof CareLogActivityTypeChangedEvent),
      ).toBe(true);
      expect(events.some((e) => e instanceof CareLogEntryUpdatedEvent)).toBe(
        true,
      );
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
      expect(() => entry.update({ unit: null })).toThrow(
        CareLogQuantityUnitMismatchException,
      );
    });

    it('should not emit CareLogActivityTypeChangedEvent when activityType is unchanged', () => {
      const entry = buildAggregate();
      entry.update({
        activityType: new CareLogActivityTypeValueObject(
          CareLogActivityTypeEnum.WATERING,
        ),
      });
      const events = entry.getUncommittedEvents();
      expect(
        events.some((e) => e instanceof CareLogActivityTypeChangedEvent),
      ).toBe(false);
      expect(events.some((e) => e instanceof CareLogEntryUpdatedEvent)).toBe(
        true,
      );
    });

    it('should emit CareLogPerformedAtChangedEvent when performedAt changes', () => {
      const entry = buildAggregate();
      const newPerformedAt = new CareLogPerformedAtValueObject(
        new Date('2023-12-31T00:00:00.000Z'),
      );
      entry.update({ performedAt: newPerformedAt });
      const events = entry.getUncommittedEvents();
      expect(
        events.some((e) => e instanceof CareLogPerformedAtChangedEvent),
      ).toBe(true);
      expect(entry.performedAt).toBe(newPerformedAt);
    });

    it('should not emit CareLogPerformedAtChangedEvent when performedAt is unchanged', () => {
      const entry = buildAggregate();
      entry.update({ performedAt: new CareLogPerformedAtValueObject(NOW) });
      const events = entry.getUncommittedEvents();
      expect(
        events.some((e) => e instanceof CareLogPerformedAtChangedEvent),
      ).toBe(false);
    });

    it('should emit CareLogNotesChangedEvent when notes changes from null to a value', () => {
      const entry = buildAggregate({ notes: null });
      entry.update({ notes: new CareLogNotesValueObject('new notes') });
      const events = entry.getUncommittedEvents();
      expect(events.some((e) => e instanceof CareLogNotesChangedEvent)).toBe(
        true,
      );
      expect(entry.notes?.value).toBe('new notes');
    });

    it('should emit CareLogNotesChangedEvent when notes changes to null', () => {
      const entry = buildAggregate({
        notes: new CareLogNotesValueObject('old notes'),
      });
      entry.update({ notes: null });
      const events = entry.getUncommittedEvents();
      expect(events.some((e) => e instanceof CareLogNotesChangedEvent)).toBe(
        true,
      );
      expect(entry.notes).toBeNull();
    });

    it('should not emit CareLogNotesChangedEvent when notes is unchanged', () => {
      const entry = buildAggregate({
        notes: new CareLogNotesValueObject('same notes'),
      });
      entry.update({ notes: new CareLogNotesValueObject('same notes') });
      const events = entry.getUncommittedEvents();
      expect(events.some((e) => e instanceof CareLogNotesChangedEvent)).toBe(
        false,
      );
    });

    it('should not emit CareLogNotesChangedEvent when notes stays null', () => {
      const entry = buildAggregate({ notes: null });
      entry.update({ notes: null });
      const events = entry.getUncommittedEvents();
      expect(events.some((e) => e instanceof CareLogNotesChangedEvent)).toBe(
        false,
      );
    });

    it('should emit CareLogQuantityChangedEvent and CareLogUnitChangedEvent when quantity and unit are set together', () => {
      const entry = buildAggregate({ quantity: null, unit: null });
      entry.update({
        quantity: new CareLogQuantityValueObject(50),
        unit: new CareLogUnitValueObject(CareLogUnitEnum.ML),
      });
      const events = entry.getUncommittedEvents();
      expect(events.some((e) => e instanceof CareLogQuantityChangedEvent)).toBe(
        true,
      );
      expect(events.some((e) => e instanceof CareLogUnitChangedEvent)).toBe(
        true,
      );
      expect(entry.quantity?.value).toBe(50);
      expect(entry.unit?.value).toBe(CareLogUnitEnum.ML);
    });

    it('should not emit CareLogQuantityChangedEvent or CareLogUnitChangedEvent when both are unchanged', () => {
      const entry = buildAggregate({
        quantity: new CareLogQuantityValueObject(50),
        unit: new CareLogUnitValueObject(CareLogUnitEnum.ML),
      });
      entry.update({
        quantity: new CareLogQuantityValueObject(50),
        unit: new CareLogUnitValueObject(CareLogUnitEnum.ML),
      });
      const events = entry.getUncommittedEvents();
      expect(events.some((e) => e instanceof CareLogQuantityChangedEvent)).toBe(
        false,
      );
      expect(events.some((e) => e instanceof CareLogUnitChangedEvent)).toBe(
        false,
      );
    });

    it('should emit CareLogQuantityChangedEvent and CareLogUnitChangedEvent when clearing quantity and unit together', () => {
      const entry = buildAggregate({
        quantity: new CareLogQuantityValueObject(50),
        unit: new CareLogUnitValueObject(CareLogUnitEnum.ML),
      });
      entry.update({ quantity: null, unit: null });
      const events = entry.getUncommittedEvents();
      expect(events.some((e) => e instanceof CareLogQuantityChangedEvent)).toBe(
        true,
      );
      expect(events.some((e) => e instanceof CareLogUnitChangedEvent)).toBe(
        true,
      );
      expect(entry.quantity).toBeNull();
      expect(entry.unit).toBeNull();
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

  describe('getters', () => {
    it('should expose all aggregate fields', () => {
      const entry = buildAggregate({
        notes: new CareLogNotesValueObject('some notes'),
        quantity: new CareLogQuantityValueObject(250),
        unit: new CareLogUnitValueObject(CareLogUnitEnum.ML),
      });
      expect(entry.id.value).toBe(ENTRY_ID);
      expect(entry.plantId.value).toBe(PLANT_ID);
      expect(entry.userId.value).toBe(USER_ID);
      expect(entry.spaceId.value).toBe(SPACE_ID);
      expect(entry.activityType.value).toBe(CareLogActivityTypeEnum.WATERING);
      expect(entry.performedAt.value).toEqual(NOW);
      expect(entry.notes?.value).toBe('some notes');
      expect(entry.quantity?.value).toBe(250);
      expect(entry.unit?.value).toBe(CareLogUnitEnum.ML);
    });
  });
});
