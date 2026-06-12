export interface CareLogFindByPlantQueryInput {
  plantId: string;
  page?: number;
  limit?: number;
}

export class CareLogFindByPlantQuery {
  public readonly plantId: string;
  public readonly page: number;
  public readonly limit: number;

  constructor(input: CareLogFindByPlantQueryInput) {
    this.plantId = input.plantId;
    this.page = input.page ?? 1;
    this.limit = Math.min(input.limit ?? 20, 100);
  }
}
