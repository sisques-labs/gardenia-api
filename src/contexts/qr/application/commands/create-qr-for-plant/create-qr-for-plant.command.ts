export interface CreateQrForPlantCommandInput {
  plantId: string;
  spaceId: string;
}

export class CreateQrForPlantCommand {
  public readonly plantId: string;
  public readonly spaceId: string;

  constructor(input: CreateQrForPlantCommandInput) {
    this.plantId = input.plantId;
    this.spaceId = input.spaceId;
  }
}
