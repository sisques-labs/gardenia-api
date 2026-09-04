import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export interface DeletePlantCommandInput {
  plantId: string;
  requestingUserId: string;
}

export class DeletePlantCommand {
  public readonly plantId: UuidValueObject;
  public readonly requestingUserId: UuidValueObject;

  constructor(input: DeletePlantCommandInput) {
    this.plantId = new UuidValueObject(input.plantId);
    this.requestingUserId = new UuidValueObject(input.requestingUserId);
  }
}
