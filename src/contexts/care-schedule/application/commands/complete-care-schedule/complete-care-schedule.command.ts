import { ICareSchedulePrimitives } from '@contexts/care-schedule/domain/primitives/care-schedule.primitives';

import { CareScheduleLastCompletedAtValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-last-completed-at/care-schedule-last-completed-at.value-object';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export type CompleteCareScheduleCommandInput = Pick<
  ICareSchedulePrimitives,
  'id'
> & {
  completedAt?: Date;
};

export class CompleteCareScheduleCommand {
  public readonly id: UuidValueObject;
  public readonly completedAt: CareScheduleLastCompletedAtValueObject | null;

  constructor(input: CompleteCareScheduleCommandInput) {
    this.id = new UuidValueObject(input.id);
    this.completedAt = input.completedAt
      ? new CareScheduleLastCompletedAtValueObject(input.completedAt)
      : null;
  }
}
