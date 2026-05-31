import { PlantSpeciesNameValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-name/plant-species-name.value-object';

export interface CreatePlantSpeciesCommandInput {
  name: string;
}

export class CreatePlantSpeciesCommand {
  public readonly name: PlantSpeciesNameValueObject;

  constructor(input: CreatePlantSpeciesCommandInput) {
    this.name = new PlantSpeciesNameValueObject(input.name);
  }
}
