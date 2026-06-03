import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { IPlantingSpotPrimitives } from '@contexts/planting-spots/domain/primitives/planting-spot.primitives';
import { PlantingSpotIdValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-id/planting-spot-id.value-object';

export type DeletePlantingSpotCommandInput = Pick<
  IPlantingSpotPrimitives,
  'spaceId'
> & {
  spotId: string;
  requestingUserId: string;
};

export class DeletePlantingSpotCommand {
  public readonly spotId: PlantingSpotIdValueObject;
  public readonly requestingUserId: UuidValueObject;
  public readonly spaceId: UuidValueObject;

  constructor(input: DeletePlantingSpotCommandInput) {
    this.spotId = new PlantingSpotIdValueObject(input.spotId);
    this.requestingUserId = new UuidValueObject(input.requestingUserId);
    this.spaceId = new UuidValueObject(input.spaceId);
  }
}
