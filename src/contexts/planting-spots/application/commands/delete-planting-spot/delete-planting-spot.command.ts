import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PlantingSpotIdValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-id/planting-spot-id.value-object';

export interface DeletePlantingSpotCommandInput {
  spotId: string;
  requestingUserId: string;
  spaceId: string;
}

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
