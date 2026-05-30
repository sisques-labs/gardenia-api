import { PlantIdValueObject } from '@contexts/plants/domain/value-objects/plant-id/plant-id.value-object';

export interface DeletePlantCommandInput {
  plantId: string;
  requestingUserId: string;
}

export class DeletePlantCommand {
  public readonly plantId: PlantIdValueObject;
  public readonly requestingUserId: string;

  constructor(input: DeletePlantCommandInput) {
    this.plantId = new PlantIdValueObject(input.plantId);
    this.requestingUserId = input.requestingUserId;
  }
}
