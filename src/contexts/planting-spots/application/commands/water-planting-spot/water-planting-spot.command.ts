import { PlantingSpotIdValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-id/planting-spot-id.value-object';

export interface WaterPlantingSpotCommandInput {
  plantingSpotId: string;
  userId: string;
  spaceId: string;
  performedAt?: Date;
}

export class WaterPlantingSpotCommand {
  public readonly plantingSpotId: PlantingSpotIdValueObject;
  public readonly userId: string;
  public readonly spaceId: string;
  public readonly performedAt: Date | null;

  constructor(input: WaterPlantingSpotCommandInput) {
    this.plantingSpotId = new PlantingSpotIdValueObject(input.plantingSpotId);
    this.userId = input.userId;
    this.spaceId = input.spaceId;
    this.performedAt = input.performedAt ?? null;
  }
}
