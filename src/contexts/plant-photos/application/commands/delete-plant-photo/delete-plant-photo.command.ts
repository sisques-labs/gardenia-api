import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { IPlantPhotoPrimitives } from '@contexts/plant-photos/domain/primitives/plant-photo.primitives';

export type DeletePlantPhotoCommandInput = Pick<IPlantPhotoPrimitives, 'id'> & {
  requestingUserId: string;
};

export class DeletePlantPhotoCommand {
  public readonly id: UuidValueObject;
  public readonly requestingUserId: UuidValueObject;

  constructor(input: DeletePlantPhotoCommandInput) {
    this.id = new UuidValueObject(input.id);
    this.requestingUserId = new UuidValueObject(input.requestingUserId);
  }
}
