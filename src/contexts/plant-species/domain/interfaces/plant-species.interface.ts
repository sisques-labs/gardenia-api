import { IBaseAggregate } from '@sisques-labs/nestjs-kit';
import { PlantSpeciesGbifKeyValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-gbif-key/plant-species-gbif-key.value-object';

import { PlantSpeciesScientificNameValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-scientific-name/plant-species-scientific-name.value-object';

export interface IPlantSpecies extends IBaseAggregate {
  scientificName: PlantSpeciesScientificNameValueObject;
  gbifKey: PlantSpeciesGbifKeyValueObject | null;
}
