import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PlantPhotoIdValueObject } from '@contexts/plant-photos/domain/value-objects/plant-photo-id/plant-photo-id.value-object';

export type DeletePlantPhotoCommandInput = {
  id: string;
  requestingUserId: string;
};

export class DeletePlantPhotoCommand {
  public readonly id: PlantPhotoIdValueObject;
  public readonly requestingUserId: UuidValueObject;

  constructor(input: DeletePlantPhotoCommandInput) {
    this.id = new PlantPhotoIdValueObject(input.id);
    this.requestingUserId = new UuidValueObject(input.requestingUserId);
  }
}
