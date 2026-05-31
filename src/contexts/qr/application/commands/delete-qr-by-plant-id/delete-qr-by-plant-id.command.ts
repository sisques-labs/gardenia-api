export interface DeleteQrByPlantIdCommandInput {
  plantId: string;
}

export class DeleteQrByPlantIdCommand {
  public readonly plantId: string;

  constructor(input: DeleteQrByPlantIdCommandInput) {
    this.plantId = input.plantId;
  }
}
