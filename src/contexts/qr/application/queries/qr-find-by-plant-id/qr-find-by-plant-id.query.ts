export interface QrFindByPlantIdQueryInput {
  plantId: string;
}

export class QrFindByPlantIdQuery {
  public readonly plantId: string;

  constructor(input: QrFindByPlantIdQueryInput) {
    this.plantId = input.plantId;
  }
}
