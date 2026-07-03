export interface WaterPlantCommandInput {
  plantId: string;
  userId: string;
  spaceId: string;
  performedAt?: Date;
}

/**
 * Orchestration command: waters a single plant using the hybrid mechanism —
 * completes its active WATERING care schedule if one exists, otherwise
 * records an ad-hoc care-log entry. It does not build or mutate a
 * `CareSchedule` aggregate itself (that already happens inside
 * `CompleteCareScheduleCommand` and `CreateCareLogEntryCommand`), so its
 * fields stay as plain primitives rather than value objects.
 */
export class WaterPlantCommand {
  public readonly plantId: string;
  public readonly userId: string;
  public readonly spaceId: string;
  public readonly performedAt: Date | null;

  constructor(input: WaterPlantCommandInput) {
    this.plantId = input.plantId;
    this.userId = input.userId;
    this.spaceId = input.spaceId;
    this.performedAt = input.performedAt ?? null;
  }
}
