import { PlantSpeciesGbifKeyValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-gbif-key/plant-species-gbif-key.value-object';
import { PlantSpeciesScientificNameValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-scientific-name/plant-species-scientific-name.value-object';

export interface CreatePlantSpeciesCommandInput {
  scientificName: string;
  gbifKey: number;
}

export class CreatePlantSpeciesCommand {
  public readonly scientificName: PlantSpeciesScientificNameValueObject;
  public readonly gbifKey: PlantSpeciesGbifKeyValueObject;

  constructor(input: CreatePlantSpeciesCommandInput) {
    this.scientificName = new PlantSpeciesScientificNameValueObject(
      input.scientificName,
    );
    this.gbifKey = new PlantSpeciesGbifKeyValueObject(input.gbifKey);
  }
}
