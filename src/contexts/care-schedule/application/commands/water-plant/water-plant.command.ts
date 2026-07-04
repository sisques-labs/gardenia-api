import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { ICareSchedulePrimitives } from '@contexts/care-schedule/domain/primitives/care-schedule.primitives';

export type WaterPlantCommandInput = Pick<
  ICareSchedulePrimitives,
  'plantId' | 'userId' | 'spaceId'
> & {
  performedAt?: Date;
};

/**
 * Orchestration command: waters a single plant using the hybrid mechanism —
 * completes its active WATERING care schedule if one exists, otherwise
 * records an ad-hoc care-log entry. It does not build or mutate a
 * `CareSchedule` aggregate itself (that already happens inside
 * `CompleteCareScheduleCommand` and `CreateCareLogEntryCommand`).
 */
export class WaterPlantCommand {
  public readonly plantId: UuidValueObject;
  public readonly userId: UuidValueObject;
  public readonly spaceId: UuidValueObject;
  public readonly performedAt: DateValueObject | null;

  constructor(input: WaterPlantCommandInput) {
    this.plantId = new UuidValueObject(input.plantId);
    this.userId = new UuidValueObject(input.userId);
    this.spaceId = new UuidValueObject(input.spaceId);
    this.performedAt = input.performedAt
      ? new DateValueObject(input.performedAt)
      : null;
  }
}
