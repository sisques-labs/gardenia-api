import { BooleanValueObject } from '@sisques-labs/nestjs-kit';

import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
import { CareScheduleUnitEnum } from '@contexts/care-schedule/domain/enums/care-schedule-unit.enum';
import { ICareSchedulePrimitives } from '@contexts/care-schedule/domain/primitives/care-schedule.primitives';
import { CareScheduleActivityTypeValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-activity-type/care-schedule-activity-type.value-object';
import { CareScheduleIdValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-id/care-schedule-id.value-object';
import { CareScheduleIntervalDaysValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-interval-days/care-schedule-interval-days.value-object';
import { CareScheduleNotesValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-notes/care-schedule-notes.value-object';
import { CareScheduleQuantityValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-quantity/care-schedule-quantity.value-object';
import { CareScheduleUnitValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-unit/care-schedule-unit.value-object';

export type UpdateCareScheduleCommandInput = Pick<
  ICareSchedulePrimitives,
  'id'
> &
  Partial<
    Pick<
      ICareSchedulePrimitives,
      'activityType' | 'intervalDays' | 'quantity' | 'unit' | 'notes' | 'active'
    >
  >;

export class UpdateCareScheduleCommand {
  public readonly id: CareScheduleIdValueObject;
  public readonly activityType: CareScheduleActivityTypeValueObject | undefined;
  public readonly intervalDays:
    CareScheduleIntervalDaysValueObject | null | undefined;
  public readonly quantity: CareScheduleQuantityValueObject | null | undefined;
  public readonly unit: CareScheduleUnitValueObject | null | undefined;
  public readonly notes: CareScheduleNotesValueObject | null | undefined;
  public readonly active: BooleanValueObject | undefined;

  constructor(input: UpdateCareScheduleCommandInput) {
    this.id = new CareScheduleIdValueObject(input.id);
    this.activityType = input.activityType
      ? new CareScheduleActivityTypeValueObject(
          input.activityType as CareScheduleActivityTypeEnum,
        )
      : undefined;
    this.intervalDays =
      input.intervalDays !== undefined
        ? input.intervalDays !== null
          ? new CareScheduleIntervalDaysValueObject(input.intervalDays)
          : null
        : undefined;
    this.quantity =
      input.quantity !== undefined
        ? input.quantity !== null
          ? new CareScheduleQuantityValueObject(input.quantity)
          : null
        : undefined;
    this.unit =
      input.unit !== undefined
        ? input.unit
          ? new CareScheduleUnitValueObject(input.unit as CareScheduleUnitEnum)
          : null
        : undefined;
    this.notes =
      input.notes !== undefined
        ? input.notes
          ? new CareScheduleNotesValueObject(input.notes)
          : null
        : undefined;
    this.active =
      input.active !== undefined
        ? new BooleanValueObject(input.active)
        : undefined;
  }
}
