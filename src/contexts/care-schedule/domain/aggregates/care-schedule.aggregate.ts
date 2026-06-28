import {
  BaseAggregate,
  BooleanValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

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
import { ICareSchedule } from '@contexts/care-schedule/domain/interfaces/care-schedule.interface';
import { ICareSchedulePrimitives } from '@contexts/care-schedule/domain/primitives/care-schedule.primitives';
import { CareScheduleActivityTypeValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-activity-type/care-schedule-activity-type.value-object';
import { CareScheduleIdValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-id/care-schedule-id.value-object';
import { CareScheduleIntervalDaysValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-interval-days/care-schedule-interval-days.value-object';
import { CareScheduleLastCompletedAtValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-last-completed-at/care-schedule-last-completed-at.value-object';
import { CareScheduleNextDueAtValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-next-due-at/care-schedule-next-due-at.value-object';
import { CareScheduleNotesValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-notes/care-schedule-notes.value-object';
import { CareScheduleQuantityValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-quantity/care-schedule-quantity.value-object';
import { CareScheduleUnitValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-unit/care-schedule-unit.value-object';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export class CareScheduleAggregate extends BaseAggregate {
  private readonly _id: CareScheduleIdValueObject;
  private readonly _plantId: UuidValueObject;
  private _activityType: CareScheduleActivityTypeValueObject;
  private _intervalDays: CareScheduleIntervalDaysValueObject;
  private _quantity: CareScheduleQuantityValueObject | null;
  private _unit: CareScheduleUnitValueObject | null;
  private _notes: CareScheduleNotesValueObject | null;
  private _nextDueAt: CareScheduleNextDueAtValueObject;
  private _lastCompletedAt: CareScheduleLastCompletedAtValueObject | null;
  private _active: BooleanValueObject;
  private readonly _userId: UuidValueObject;
  private readonly _spaceId: UuidValueObject;

  constructor(props: ICareSchedule) {
    super(props.createdAt, props.updatedAt);
    this._id = props.id;
    this._plantId = props.plantId;
    this._activityType = props.activityType;
    this._intervalDays = props.intervalDays;
    this._quantity = props.quantity;
    this._unit = props.unit;
    this._notes = props.notes;
    this._nextDueAt = props.nextDueAt;
    this._lastCompletedAt = props.lastCompletedAt;
    this._active = props.active;
    this._userId = props.userId;
    this._spaceId = props.spaceId;
  }

  public create(): void {
    this.apply(
      new CareScheduleCreatedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: CareScheduleAggregate.name,
          entityId: this._id.value,
          entityType: CareScheduleAggregate.name,
          eventType: CareScheduleCreatedEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  public update(
    props: Partial<
      Omit<
        ICareSchedule,
        | 'id'
        | 'plantId'
        | 'nextDueAt'
        | 'lastCompletedAt'
        | 'userId'
        | 'spaceId'
        | 'createdAt'
        | 'updatedAt'
      >
    >,
  ): void {
    if (props.activityType !== undefined)
      this.changeActivityType(props.activityType);
    if (props.intervalDays !== undefined)
      this.changeIntervalDays(props.intervalDays);
    if (props.quantity !== undefined) this.changeQuantity(props.quantity);
    if (props.unit !== undefined) this.changeUnit(props.unit);
    if (props.notes !== undefined) this.changeNotes(props.notes);
    if (props.active !== undefined) this.changeActive(props.active);

    this.apply(
      new CareScheduleUpdatedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: CareScheduleAggregate.name,
          entityId: this._id.value,
          entityType: CareScheduleAggregate.name,
          eventType: CareScheduleUpdatedEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  public complete(completedAt: Date): void {
    const nextDue = new Date(
      completedAt.getTime() + this._intervalDays.value * MS_PER_DAY,
    );
    this._lastCompletedAt = new CareScheduleLastCompletedAtValueObject(
      completedAt,
    );
    this._nextDueAt = new CareScheduleNextDueAtValueObject(nextDue);
    this.touch();
    this.apply(
      new CareScheduleCompletedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: CareScheduleAggregate.name,
          entityId: this._id.value,
          entityType: CareScheduleAggregate.name,
          eventType: CareScheduleCompletedEvent.name,
        },
        { id: this._id.value, completedAt, nextDueAt: nextDue },
      ),
    );
  }

  public delete(): void {
    this.apply(
      new CareScheduleDeletedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: CareScheduleAggregate.name,
          entityId: this._id.value,
          entityType: CareScheduleAggregate.name,
          eventType: CareScheduleDeletedEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  private changeActivityType(
    newActivityType: CareScheduleActivityTypeValueObject,
  ): void {
    const oldValue = this._activityType.value;
    const newValue = newActivityType.value;
    if (oldValue === newValue) return;
    this._activityType = newActivityType;
    this.touch();
    this.apply(
      new CareScheduleActivityTypeChangedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: CareScheduleAggregate.name,
          entityId: this._id.value,
          entityType: CareScheduleAggregate.name,
          eventType: CareScheduleActivityTypeChangedEvent.name,
        },
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  private changeIntervalDays(
    newIntervalDays: CareScheduleIntervalDaysValueObject,
  ): void {
    const oldValue = this._intervalDays.value;
    const newValue = newIntervalDays.value;
    if (oldValue === newValue) return;
    this._intervalDays = newIntervalDays;
    this.touch();
    this.apply(
      new CareScheduleIntervalDaysChangedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: CareScheduleAggregate.name,
          entityId: this._id.value,
          entityType: CareScheduleAggregate.name,
          eventType: CareScheduleIntervalDaysChangedEvent.name,
        },
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  private changeQuantity(
    newQuantity: CareScheduleQuantityValueObject | null,
  ): void {
    const oldValue = this._quantity?.value ?? null;
    const newValue = newQuantity?.value ?? null;
    if (oldValue === newValue) return;
    this._quantity = newQuantity;
    this.touch();
    this.apply(
      new CareScheduleQuantityChangedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: CareScheduleAggregate.name,
          entityId: this._id.value,
          entityType: CareScheduleAggregate.name,
          eventType: CareScheduleQuantityChangedEvent.name,
        },
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  private changeUnit(newUnit: CareScheduleUnitValueObject | null): void {
    const oldValue = this._unit?.value ?? null;
    const newValue = newUnit?.value ?? null;
    if (oldValue === newValue) return;
    this._unit = newUnit;
    this.touch();
    this.apply(
      new CareScheduleUnitChangedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: CareScheduleAggregate.name,
          entityId: this._id.value,
          entityType: CareScheduleAggregate.name,
          eventType: CareScheduleUnitChangedEvent.name,
        },
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  private changeNotes(newNotes: CareScheduleNotesValueObject | null): void {
    const oldValue = this._notes?.value ?? null;
    const newValue = newNotes?.value ?? null;
    if (oldValue === newValue) return;
    this._notes = newNotes;
    this.touch();
    this.apply(
      new CareScheduleNotesChangedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: CareScheduleAggregate.name,
          entityId: this._id.value,
          entityType: CareScheduleAggregate.name,
          eventType: CareScheduleNotesChangedEvent.name,
        },
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  private changeActive(newActive: BooleanValueObject): void {
    const oldValue = this._active.value;
    const newValue = newActive.value;
    if (oldValue === newValue) return;
    this._active = newActive;
    this.touch();
    this.apply(
      new CareScheduleActiveChangedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: CareScheduleAggregate.name,
          entityId: this._id.value,
          entityType: CareScheduleAggregate.name,
          eventType: CareScheduleActiveChangedEvent.name,
        },
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  public toPrimitives(): ICareSchedulePrimitives {
    return {
      id: this._id.value,
      plantId: this._plantId.value,
      activityType: this._activityType.value,
      intervalDays: this._intervalDays.value,
      quantity: this._quantity?.value ?? null,
      unit: this._unit?.value ?? null,
      notes: this._notes?.value ?? null,
      nextDueAt: this._nextDueAt.value,
      lastCompletedAt: this._lastCompletedAt?.value ?? null,
      active: this._active.value,
      userId: this._userId.value,
      spaceId: this._spaceId.value,
      createdAt: this.createdAt.value,
      updatedAt: this.updatedAt.value,
    };
  }

  get id(): CareScheduleIdValueObject {
    return this._id;
  }
  get plantId(): UuidValueObject {
    return this._plantId;
  }
  get activityType(): CareScheduleActivityTypeValueObject {
    return this._activityType;
  }
  get intervalDays(): CareScheduleIntervalDaysValueObject {
    return this._intervalDays;
  }
  get quantity(): CareScheduleQuantityValueObject | null {
    return this._quantity;
  }
  get unit(): CareScheduleUnitValueObject | null {
    return this._unit;
  }
  get notes(): CareScheduleNotesValueObject | null {
    return this._notes;
  }
  get nextDueAt(): CareScheduleNextDueAtValueObject {
    return this._nextDueAt;
  }
  get lastCompletedAt(): CareScheduleLastCompletedAtValueObject | null {
    return this._lastCompletedAt;
  }
  get active(): BooleanValueObject {
    return this._active;
  }
  get userId(): UuidValueObject {
    return this._userId;
  }
  get spaceId(): UuidValueObject {
    return this._spaceId;
  }
}
