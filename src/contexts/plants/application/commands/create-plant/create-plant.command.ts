export interface CreatePlantCommandInput {
  name: string;
  species?: string | null;
  imageUrl?: string | null;
  userId: string;
}

export class CreatePlantCommand {
  public readonly name: string;
  public readonly species: string | null;
  public readonly imageUrl: string | null;
  public readonly userId: string;

  constructor(input: CreatePlantCommandInput) {
    this.name = input.name;
    this.species = input.species ?? null;
    this.imageUrl = input.imageUrl ?? null;
    this.userId = input.userId;
  }
}
