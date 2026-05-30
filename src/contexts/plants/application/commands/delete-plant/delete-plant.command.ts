import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PlantIdValueObject } from '@contexts/plants/domain/value-objects/plant-id/plant-id.value-object';

export interface DeletePlantCommandInput {
  plantId: string;
  requestingUserId: string;
}

export class DeletePlantCommand {
  public readonly plantId: PlantIdValueObject;
  public readonly requestingUserId: UuidValueObject;

  constructor(input: DeletePlantCommandInput) {
    this.plantId = new PlantIdValueObject(input.plantId);
    this.requestingUserId = new UuidValueObject(input.requestingUserId);
  }
}
