import { DateValueObject } from '@sisques-labs/nestjs-kit';

import { PlantSpeciesGbifKeyValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-gbif-key/plant-species-gbif-key.value-object';
import { PlantSpeciesIdValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-id/plant-species-id.value-object';
import { PlantSpeciesScientificNameValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-scientific-name/plant-species-scientific-name.value-object';

export interface IPlantSpecies {
  id: PlantSpeciesIdValueObject;
  scientificName: PlantSpeciesScientificNameValueObject;
  gbifKey: PlantSpeciesGbifKeyValueObject | null;
  createdAt: DateValueObject;
  updatedAt: DateValueObject;
}
