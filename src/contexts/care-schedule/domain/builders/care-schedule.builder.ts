import { Injectable } from '@nestjs/common';
import {
  BaseBuilder,
  BooleanValueObject,
  DateValueObject,
  FieldIsRequiredException,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { CareScheduleAggregate } from '@contexts/care-schedule/domain/aggregates/care-schedule.aggregate';
import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
import { CareScheduleUnitEnum } from '@contexts/care-schedule/domain/enums/care-schedule-unit.enum';
import { CareScheduleViewModel } from '@contexts/care-schedule/domain/view-models/care-schedule.view-model';
import { CareScheduleActivityTypeValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-activity-type/care-schedule-activity-type.value-object';
import { CareScheduleIdValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-id/care-schedule-id.value-object';
import { CareScheduleIntervalDaysValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-interval-days/care-schedule-interval-days.value-object';
import { CareScheduleLastCompletedAtValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-last-completed-at/care-schedule-last-completed-at.value-object';
import { CareScheduleNextDueAtValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-next-due-at/care-schedule-next-due-at.value-object';
import { CareScheduleNotesValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-notes/care-schedule-notes.value-object';
import { CareScheduleQuantityValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-quantity/care-schedule-quantity.value-object';
import { CareScheduleUnitValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-unit/care-schedule-unit.value-object';

@Injectable()
export class CareScheduleBuilder extends BaseBuilder<
  CareScheduleAggregate,
  CareScheduleViewModel
> {
  private _plantId!: string;
  private _activityType!: string;
  private _intervalDays: number | null = null;
  private _quantity: number | null = null;
  private _unit: string | null = null;
  private _notes: string | null = null;
  private _nextDueAt!: Date;
  private _lastCompletedAt: Date | null = null;
  private _active = true;
  private _userId!: string;
  private _spaceId!: string;

  withPlantId(plantId: string): this {
    this._plantId = plantId;
    return this;
  }

  withActivityType(activityType: string): this {
    this._activityType = activityType;
    return this;
  }

  withIntervalDays(intervalDays: number | null): this {
    this._intervalDays = intervalDays;
    return this;
  }

  withQuantity(quantity: number | null): this {
    this._quantity = quantity;
    return this;
  }

  withUnit(unit: string | null): this {
    this._unit = unit;
    return this;
  }

  withNotes(notes: string | null): this {
    this._notes = notes;
    return this;
  }

  withNextDueAt(nextDueAt: Date): this {
    this._nextDueAt = nextDueAt;
    return this;
  }

  withLastCompletedAt(lastCompletedAt: Date | null): this {
    this._lastCompletedAt = lastCompletedAt;
    return this;
  }

  withActive(active: boolean): this {
    this._active = active;
    return this;
  }

  withUserId(userId: string): this {
    this._userId = userId;
    return this;
  }

  withSpaceId(spaceId: string): this {
    this._spaceId = spaceId;
    return this;
  }

  public override build(): CareScheduleAggregate {
    this.validate();
    return new CareScheduleAggregate({
      id: new CareScheduleIdValueObject(this._id),
      plantId: new UuidValueObject(this._plantId),
      activityType: new CareScheduleActivityTypeValueObject(
        this._activityType as CareScheduleActivityTypeEnum,
      ),
      intervalDays:
        this._intervalDays != null
          ? new CareScheduleIntervalDaysValueObject(this._intervalDays)
          : null,
      quantity:
        this._quantity != null
          ? new CareScheduleQuantityValueObject(this._quantity)
          : null,
      unit:
        this._unit != null
          ? new CareScheduleUnitValueObject(this._unit as CareScheduleUnitEnum)
          : null,
      notes:
        this._notes != null
          ? new CareScheduleNotesValueObject(this._notes)
          : null,
      nextDueAt: new CareScheduleNextDueAtValueObject(this._nextDueAt),
      lastCompletedAt:
        this._lastCompletedAt != null
          ? new CareScheduleLastCompletedAtValueObject(this._lastCompletedAt)
          : null,
      active: new BooleanValueObject(this._active),
      userId: new UuidValueObject(this._userId),
      spaceId: new UuidValueObject(this._spaceId),
      createdAt: new DateValueObject(this._createdAt),
      updatedAt: new DateValueObject(this._updatedAt),
    });
  }

  public override buildViewModel(): CareScheduleViewModel {
    this.validate();
    return new CareScheduleViewModel({
      id: this._id,
      plantId: this._plantId,
      activityType: this._activityType,
      intervalDays: this._intervalDays,
      quantity: this._quantity,
      unit: this._unit,
      notes: this._notes,
      nextDueAt: this._nextDueAt,
      lastCompletedAt: this._lastCompletedAt,
      active: this._active,
      userId: this._userId,
      spaceId: this._spaceId,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    });
  }

  public override validate(): void {
    super.validate();
    if (!this._plantId) throw new FieldIsRequiredException('plantId');
    if (!this._activityType) throw new FieldIsRequiredException('activityType');
    if (!this._nextDueAt) throw new FieldIsRequiredException('nextDueAt');
    if (!this._userId) throw new FieldIsRequiredException('userId');
    if (!this._spaceId) throw new FieldIsRequiredException('spaceId');
  }
}
