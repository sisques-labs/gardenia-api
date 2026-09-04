import { ICareSchedulePrimitives } from '@contexts/care-schedule/domain/primitives/care-schedule.primitives';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export type DeleteCareScheduleCommandInput = Pick<
  ICareSchedulePrimitives,
  'id'
>;

export class DeleteCareScheduleCommand {
  public readonly id: UuidValueObject;

  constructor(input: DeleteCareScheduleCommandInput) {
    this.id = new UuidValueObject(input.id);
  }
}
