export interface ImportPlantSpeciesCommandInput {
  limit: number;
  offset: number;
}

export class ImportPlantSpeciesCommand {
  public readonly limit: number;
  public readonly offset: number;

  constructor(input: ImportPlantSpeciesCommandInput) {
    this.limit = input.limit;
    this.offset = input.offset;
  }
}
