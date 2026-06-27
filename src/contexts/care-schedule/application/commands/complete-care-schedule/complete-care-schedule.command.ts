import { ICareSchedulePrimitives } from '@contexts/care-schedule/domain/primitives/care-schedule.primitives';
import { CareScheduleIdValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-id/care-schedule-id.value-object';
import { CareScheduleLastCompletedAtValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-last-completed-at/care-schedule-last-completed-at.value-object';

export type CompleteCareScheduleCommandInput = Pick<
  ICareSchedulePrimitives,
  'id'
> & {
  completedAt?: Date;
};

export class CompleteCareScheduleCommand {
  public readonly id: CareScheduleIdValueObject;
  public readonly completedAt: CareScheduleLastCompletedAtValueObject | null;

  constructor(input: CompleteCareScheduleCommandInput) {
    this.id = new CareScheduleIdValueObject(input.id);
    this.completedAt = input.completedAt
      ? new CareScheduleLastCompletedAtValueObject(input.completedAt)
      : null;
  }
}
