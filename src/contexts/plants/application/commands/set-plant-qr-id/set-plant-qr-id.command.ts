import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PlantIdValueObject } from '@contexts/plants/domain/value-objects/plant-id/plant-id.value-object';

export interface SetPlantQrIdCommandInput {
  plantId: string;
  qrId: string;
}

export class SetPlantQrIdCommand {
  public readonly plantId: PlantIdValueObject;
  public readonly qrId: UuidValueObject;

  constructor(input: SetPlantQrIdCommandInput) {
    this.plantId = new PlantIdValueObject(input.plantId);
    this.qrId = new UuidValueObject(input.qrId);
  }
}
