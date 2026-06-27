import { ICareSchedulePrimitives } from '@contexts/care-schedule/domain/primitives/care-schedule.primitives';
import { CareScheduleIdValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-id/care-schedule-id.value-object';

export type CareScheduleFindByIdQueryInput = Pick<
  ICareSchedulePrimitives,
  'id'
>;

export class CareScheduleFindByIdQuery {
  public readonly id: CareScheduleIdValueObject;

  constructor(input: CareScheduleFindByIdQueryInput) {
    this.id = new CareScheduleIdValueObject(input.id);
  }
}
