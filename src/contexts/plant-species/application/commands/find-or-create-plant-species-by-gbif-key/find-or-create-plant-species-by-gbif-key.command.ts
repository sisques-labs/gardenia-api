import { PlantSpeciesGbifKeyValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-gbif-key/plant-species-gbif-key.value-object';
import { PlantSpeciesScientificNameValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-scientific-name/plant-species-scientific-name.value-object';

export interface FindOrCreatePlantSpeciesByGbifKeyCommandInput {
  gbifKey: number;
  scientificName: string;
}

export class FindOrCreatePlantSpeciesByGbifKeyCommand {
  public readonly gbifKey: PlantSpeciesGbifKeyValueObject;
  public readonly scientificName: PlantSpeciesScientificNameValueObject;

  constructor(input: FindOrCreatePlantSpeciesByGbifKeyCommandInput) {
    this.gbifKey = new PlantSpeciesGbifKeyValueObject(input.gbifKey);
    this.scientificName = new PlantSpeciesScientificNameValueObject(
      input.scientificName,
    );
  }
}
