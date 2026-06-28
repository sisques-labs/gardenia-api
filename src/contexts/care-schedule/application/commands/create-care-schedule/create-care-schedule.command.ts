import { BooleanValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
import { CareScheduleUnitEnum } from '@contexts/care-schedule/domain/enums/care-schedule-unit.enum';
import { ICareSchedulePrimitives } from '@contexts/care-schedule/domain/primitives/care-schedule.primitives';
import { CareScheduleActivityTypeValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-activity-type/care-schedule-activity-type.value-object';
import { CareScheduleIntervalDaysValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-interval-days/care-schedule-interval-days.value-object';
import { CareScheduleNextDueAtValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-next-due-at/care-schedule-next-due-at.value-object';
import { CareScheduleNotesValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-notes/care-schedule-notes.value-object';
import { CareScheduleQuantityValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-quantity/care-schedule-quantity.value-object';
import { CareScheduleUnitValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-unit/care-schedule-unit.value-object';

export type CreateCareScheduleCommandInput = Pick<
  ICareSchedulePrimitives,
  'plantId' | 'activityType' | 'userId' | 'spaceId'
> &
  Partial<
    Pick<
      ICareSchedulePrimitives,
      'intervalDays' | 'quantity' | 'unit' | 'notes' | 'nextDueAt' | 'active'
    >
  >;

export class CreateCareScheduleCommand {
  public readonly plantId: UuidValueObject;
  public readonly activityType: CareScheduleActivityTypeValueObject;
  public readonly intervalDays: CareScheduleIntervalDaysValueObject | null;
  public readonly quantity: CareScheduleQuantityValueObject | null;
  public readonly unit: CareScheduleUnitValueObject | null;
  public readonly notes: CareScheduleNotesValueObject | null;
  public readonly nextDueAt: CareScheduleNextDueAtValueObject | null;
  public readonly active: BooleanValueObject | null;
  public readonly userId: UuidValueObject;
  public readonly spaceId: UuidValueObject;

  constructor(input: CreateCareScheduleCommandInput) {
    this.plantId = new UuidValueObject(input.plantId);
    this.activityType = new CareScheduleActivityTypeValueObject(
      input.activityType as CareScheduleActivityTypeEnum,
    );
    this.intervalDays =
      input.intervalDays !== undefined && input.intervalDays !== null
        ? new CareScheduleIntervalDaysValueObject(input.intervalDays)
        : null;
    this.quantity =
      input.quantity !== undefined && input.quantity !== null
        ? new CareScheduleQuantityValueObject(input.quantity)
        : null;
    this.unit = input.unit
      ? new CareScheduleUnitValueObject(input.unit as CareScheduleUnitEnum)
      : null;
    this.notes = input.notes
      ? new CareScheduleNotesValueObject(input.notes)
      : null;
    this.nextDueAt = input.nextDueAt
      ? new CareScheduleNextDueAtValueObject(input.nextDueAt)
      : null;
    this.active =
      input.active !== undefined && input.active !== null
        ? new BooleanValueObject(input.active)
        : null;
    this.userId = new UuidValueObject(input.userId);
    this.spaceId = new UuidValueObject(input.spaceId);
  }
}
