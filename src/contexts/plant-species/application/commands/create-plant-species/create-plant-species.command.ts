import { PlantSpeciesScientificNameValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-scientific-name/plant-species-scientific-name.value-object';

export interface CreatePlantSpeciesCommandInput {
  scientificName: string;
}

export class CreatePlantSpeciesCommand {
  public readonly scientificName: PlantSpeciesScientificNameValueObject;

  constructor(input: CreatePlantSpeciesCommandInput) {
    this.scientificName = new PlantSpeciesScientificNameValueObject(
      input.scientificName,
    );
  }
}
