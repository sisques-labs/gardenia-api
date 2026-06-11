import { PlantSpeciesScientificNameValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-scientific-name/plant-species-scientific-name.value-object';

export interface EnrichPlantSpeciesCommandInput {
  scientificName: string;
}

export class EnrichPlantSpeciesCommand {
  public readonly scientificName: PlantSpeciesScientificNameValueObject;

  constructor(input: EnrichPlantSpeciesCommandInput) {
    this.scientificName = new PlantSpeciesScientificNameValueObject(
      input.scientificName,
    );
  }
}
