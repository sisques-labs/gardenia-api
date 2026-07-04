import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { IPlantingSpotPrimitives } from '@contexts/planting-spots/domain/primitives/planting-spot.primitives';
import { PlantingSpotIdValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-id/planting-spot-id.value-object';

export type WaterPlantingSpotCommandInput = Pick<
  IPlantingSpotPrimitives,
  'id' | 'spaceId'
> & {
  userId: string;
  performedAt?: Date;
};

export class WaterPlantingSpotCommand {
  public readonly id: PlantingSpotIdValueObject;
  public readonly userId: UuidValueObject;
  public readonly spaceId: UuidValueObject;
  public readonly performedAt: DateValueObject | null;

  constructor(input: WaterPlantingSpotCommandInput) {
    this.id = new PlantingSpotIdValueObject(input.id);
    this.userId = new UuidValueObject(input.userId);
    this.spaceId = new UuidValueObject(input.spaceId);
    this.performedAt = input.performedAt
      ? new DateValueObject(input.performedAt)
      : null;
  }
}
