import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export interface SetPlantQrIdCommandInput {
  plantId: string;
  qrId: string;
}

export class SetPlantQrIdCommand {
  public readonly plantId: UuidValueObject;
  public readonly qrId: UuidValueObject;

  constructor(input: SetPlantQrIdCommandInput) {
    this.plantId = new UuidValueObject(input.plantId);
    this.qrId = new UuidValueObject(input.qrId);
  }
}
