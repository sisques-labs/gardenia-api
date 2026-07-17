import {
  BooleanValueObject,
  DateValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
import { CareScheduleCompletedEvent } from '@contexts/care-schedule/domain/events/care-schedule-completed/care-schedule-completed.event';
import { CareScheduleCreatedEvent } from '@contexts/care-schedule/domain/events/care-schedule-created/care-schedule-created.event';
import { CareScheduleDeletedEvent } from '@contexts/care-schedule/domain/events/care-schedule-deleted/care-schedule-deleted.event';
import { CareScheduleUpdatedEvent } from '@contexts/care-schedule/domain/events/care-schedule-updated/care-schedule-updated.event';
import { CareScheduleActiveChangedEvent } from '@contexts/care-schedule/domain/events/field-changed/active-changed/active-changed.event';
import { CareScheduleActivityTypeChangedEvent } from '@contexts/care-schedule/domain/events/field-changed/activity-type-changed/activity-type-changed.event';
import { CareScheduleIntervalDaysChangedEvent } from '@contexts/care-schedule/domain/events/field-changed/interval-days-changed/interval-days-changed.event';
import { CareScheduleNotesChangedEvent } from '@contexts/care-schedule/domain/events/field-changed/notes-changed/notes-changed.event';
import { CareScheduleQuantityChangedEvent } from '@contexts/care-schedule/domain/events/field-changed/quantity-changed/quantity-changed.event';
import { CareScheduleUnitChangedEvent } from '@contexts/care-schedule/domain/events/field-changed/unit-changed/unit-changed.event';
import { CareScheduleUnitEnum } from '@contexts/care-schedule/domain/enums/care-schedule-unit.enum';
import { CareScheduleActivityTypeValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-activity-type/care-schedule-activity-type.value-object';
import { CareScheduleIdValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-id/care-schedule-id.value-object';
import { CareScheduleIntervalDaysValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-interval-days/care-schedule-interval-days.value-object';
import { CareScheduleNextDueAtValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-next-due-at/care-schedule-next-due-at.value-object';
import { CareScheduleNotesValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-notes/care-schedule-notes.value-object';
import { CareScheduleQuantityValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-quantity/care-schedule-quantity.value-object';
import { CareScheduleUnitValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-unit/care-schedule-unit.value-object';
import { CareScheduleAggregate } from './care-schedule.aggregate';

function buildSchedule(intervalDays: number | null = 3): CareScheduleAggregate {
  return new CareScheduleAggregate({
    id: new CareScheduleIdValueObject('550e8400-e29b-41d4-a716-446655440000'),
    plantId: new UuidValueObject('110e8400-e29b-41d4-a716-446655440010'),
    activityType: new CareScheduleActivityTypeValueObject(
      CareScheduleActivityTypeEnum.WATERING,
    ),
    intervalDays:
      intervalDays != null
        ? new CareScheduleIntervalDaysValueObject(intervalDays)
        : null,
    quantity: null,
    unit: null,
    notes: null,
    nextDueAt: new CareScheduleNextDueAtValueObject(
      new Date('2026-06-27T00:00:00.000Z'),
    ),
    lastCompletedAt: null,
    active: new BooleanValueObject(true),
    userId: new UuidValueObject('660e8400-e29b-41d4-a716-446655440001'),
    spaceId: new UuidValueObject('770e8400-e29b-41d4-a716-446655440002'),
    createdAt: new DateValueObject(new Date()),
    updatedAt: new DateValueObject(new Date()),
  });
}

describe('CareScheduleAggregate', () => {
  it('create() applies CareScheduleCreatedEvent', () => {
    const schedule = buildSchedule();
    schedule.create();
    const events = schedule.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(CareScheduleCreatedEvent);
  });

  it('update() applies a field change event when a value differs', () => {
    const schedule = buildSchedule(3);
    schedule.update({
      intervalDays: new CareScheduleIntervalDaysValueObject(7),
    });
    const events = schedule.getUncommittedEvents();
    expect(
      events.some((e) => e instanceof CareScheduleIntervalDaysChangedEvent),
    ).toBe(true);
    expect(events.some((e) => e instanceof CareScheduleUpdatedEvent)).toBe(
      true,
    );
    expect(schedule.intervalDays?.value).toBe(7);
  });

  it('update() can clear intervalDays (make it one-time) and emits IntervalDaysChanged', () => {
    const schedule = buildSchedule(3);
    schedule.update({ intervalDays: null });
    expect(schedule.intervalDays).toBeNull();
    expect(
      schedule
        .getUncommittedEvents()
        .some((e) => e instanceof CareScheduleIntervalDaysChangedEvent),
    ).toBe(true);
  });

  it('update() sets intervalDays on a one-time schedule (from null) and emits IntervalDaysChanged', () => {
    const schedule = buildSchedule(null);
    schedule.update({
      intervalDays: new CareScheduleIntervalDaysValueObject(5),
    });
    expect(schedule.intervalDays?.value).toBe(5);
    expect(
      schedule
        .getUncommittedEvents()
        .some((e) => e instanceof CareScheduleIntervalDaysChangedEvent),
    ).toBe(true);
  });

  it('update() does NOT emit a field change event when the value is equal', () => {
    const schedule = buildSchedule(3);
    schedule.update({
      intervalDays: new CareScheduleIntervalDaysValueObject(3),
    });
    const events = schedule.getUncommittedEvents();
    expect(
      events.some((e) => e instanceof CareScheduleIntervalDaysChangedEvent),
    ).toBe(false);
    expect(events.some((e) => e instanceof CareScheduleUpdatedEvent)).toBe(
      true,
    );
  });

  it('update() can deactivate a schedule and emits ActiveChanged', () => {
    const schedule = buildSchedule();
    schedule.update({ active: new BooleanValueObject(false) });
    expect(schedule.active.value).toBe(false);
    expect(
      schedule
        .getUncommittedEvents()
        .some((e) => e instanceof CareScheduleActiveChangedEvent),
    ).toBe(true);
  });

  it('update() does NOT emit ActiveChanged when active is unchanged', () => {
    const schedule = buildSchedule();
    schedule.update({ active: new BooleanValueObject(true) });
    expect(
      schedule
        .getUncommittedEvents()
        .some((e) => e instanceof CareScheduleActiveChangedEvent),
    ).toBe(false);
  });

  it('update() changes activityType and emits ActivityTypeChanged', () => {
    const schedule = buildSchedule();
    schedule.update({
      activityType: new CareScheduleActivityTypeValueObject(
        CareScheduleActivityTypeEnum.FERTILIZING,
      ),
    });
    expect(schedule.activityType.value).toBe(
      CareScheduleActivityTypeEnum.FERTILIZING,
    );
    expect(
      schedule
        .getUncommittedEvents()
        .some((e) => e instanceof CareScheduleActivityTypeChangedEvent),
    ).toBe(true);
  });

  it('update() does NOT emit ActivityTypeChanged when activityType is unchanged', () => {
    const schedule = buildSchedule();
    schedule.update({
      activityType: new CareScheduleActivityTypeValueObject(
        CareScheduleActivityTypeEnum.WATERING,
      ),
    });
    expect(
      schedule
        .getUncommittedEvents()
        .some((e) => e instanceof CareScheduleActivityTypeChangedEvent),
    ).toBe(false);
  });

  it('update() sets quantity and unit together and emits both changed events', () => {
    const schedule = buildSchedule();
    schedule.update({
      quantity: new CareScheduleQuantityValueObject(100),
      unit: new CareScheduleUnitValueObject(CareScheduleUnitEnum.ML),
    });
    expect(schedule.quantity?.value).toBe(100);
    expect(schedule.unit?.value).toBe(CareScheduleUnitEnum.ML);
    const events = schedule.getUncommittedEvents();
    expect(
      events.some((e) => e instanceof CareScheduleQuantityChangedEvent),
    ).toBe(true);
    expect(events.some((e) => e instanceof CareScheduleUnitChangedEvent)).toBe(
      true,
    );
  });

  it('update() does NOT emit QuantityChanged/UnitChanged when both are unchanged', () => {
    const schedule = buildSchedule();
    schedule.update({
      quantity: new CareScheduleQuantityValueObject(100),
      unit: new CareScheduleUnitValueObject(CareScheduleUnitEnum.ML),
    });
    schedule.commit();
    schedule.update({
      quantity: new CareScheduleQuantityValueObject(100),
      unit: new CareScheduleUnitValueObject(CareScheduleUnitEnum.ML),
    });
    const events = schedule.getUncommittedEvents();
    expect(
      events.some((e) => e instanceof CareScheduleQuantityChangedEvent),
    ).toBe(false);
    expect(events.some((e) => e instanceof CareScheduleUnitChangedEvent)).toBe(
      false,
    );
  });

  it('update() clears quantity and unit together and emits both changed events', () => {
    const schedule = buildSchedule();
    schedule.update({
      quantity: new CareScheduleQuantityValueObject(100),
      unit: new CareScheduleUnitValueObject(CareScheduleUnitEnum.ML),
    });
    schedule.update({ quantity: null, unit: null });
    expect(schedule.quantity).toBeNull();
    expect(schedule.unit).toBeNull();
    const events = schedule.getUncommittedEvents();
    expect(
      events.some((e) => e instanceof CareScheduleQuantityChangedEvent),
    ).toBe(true);
    expect(events.some((e) => e instanceof CareScheduleUnitChangedEvent)).toBe(
      true,
    );
  });

  it('update() sets notes and emits NotesChanged', () => {
    const schedule = buildSchedule();
    schedule.update({
      notes: new CareScheduleNotesValueObject('water twice a week'),
    });
    expect(schedule.notes?.value).toBe('water twice a week');
    expect(
      schedule
        .getUncommittedEvents()
        .some((e) => e instanceof CareScheduleNotesChangedEvent),
    ).toBe(true);
  });

  it('update() does NOT emit NotesChanged when notes stays null', () => {
    const schedule = buildSchedule();
    schedule.update({ notes: null });
    expect(
      schedule
        .getUncommittedEvents()
        .some((e) => e instanceof CareScheduleNotesChangedEvent),
    ).toBe(false);
  });

  it('complete() advances nextDueAt by the interval and records lastCompletedAt', () => {
    const schedule = buildSchedule(3);
    const completedAt = new Date('2026-06-27T00:00:00.000Z');
    schedule.complete(completedAt);

    expect(schedule.lastCompletedAt?.value).toEqual(completedAt);
    expect(schedule.nextDueAt.value).toEqual(
      new Date('2026-06-30T00:00:00.000Z'),
    );
    expect(
      schedule
        .getUncommittedEvents()
        .some((e) => e instanceof CareScheduleCompletedEvent),
    ).toBe(true);
  });

  it('complete() on a one-time schedule (no interval) deactivates it and keeps nextDueAt', () => {
    const schedule = buildSchedule(null);
    const dueAt = schedule.nextDueAt.value;
    const completedAt = new Date('2026-06-27T09:00:00.000Z');
    schedule.complete(completedAt);

    expect(schedule.lastCompletedAt?.value).toEqual(completedAt);
    expect(schedule.nextDueAt.value).toEqual(dueAt);
    expect(schedule.active.value).toBe(false);
    expect(
      schedule
        .getUncommittedEvents()
        .some((e) => e instanceof CareScheduleCompletedEvent),
    ).toBe(true);
  });

  it('delete() applies CareScheduleDeletedEvent', () => {
    const schedule = buildSchedule();
    schedule.delete();
    const events = schedule.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(CareScheduleDeletedEvent);
  });

  it('toPrimitives() serializes all fields', () => {
    const primitives = buildSchedule().toPrimitives();
    expect(primitives.plantId).toBe('110e8400-e29b-41d4-a716-446655440010');
    expect(primitives.activityType).toBe(CareScheduleActivityTypeEnum.WATERING);
    expect(primitives.intervalDays).toBe(3);
    expect(primitives.active).toBe(true);
    expect(primitives.quantity).toBeNull();
  });

  it('toPrimitives() serializes a one-time schedule with null intervalDays', () => {
    const primitives = buildSchedule(null).toPrimitives();
    expect(primitives.intervalDays).toBeNull();
  });

  it('exposes all aggregate fields via getters', () => {
    const schedule = buildSchedule();
    expect(schedule.id.value).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(schedule.plantId.value).toBe('110e8400-e29b-41d4-a716-446655440010');
    expect(schedule.activityType.value).toBe(
      CareScheduleActivityTypeEnum.WATERING,
    );
    expect(schedule.intervalDays?.value).toBe(3);
    expect(schedule.quantity).toBeNull();
    expect(schedule.unit).toBeNull();
    expect(schedule.notes).toBeNull();
    expect(schedule.nextDueAt.value).toEqual(
      new Date('2026-06-27T00:00:00.000Z'),
    );
    expect(schedule.lastCompletedAt).toBeNull();
    expect(schedule.active.value).toBe(true);
    expect(schedule.userId.value).toBe('660e8400-e29b-41d4-a716-446655440001');
    expect(schedule.spaceId.value).toBe('770e8400-e29b-41d4-a716-446655440002');
  });
});
