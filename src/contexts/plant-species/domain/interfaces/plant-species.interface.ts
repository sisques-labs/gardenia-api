import { DateValueObject } from '@sisques-labs/nestjs-kit';

import { PlantSpeciesIdValueObject } from '../value-objects/plant-species-id/plant-species-id.value-object';
import { PlantSpeciesNameValueObject } from '../value-objects/plant-species-name/plant-species-name.value-object';

export interface IPlantSpecies {
  id: PlantSpeciesIdValueObject;
  name: PlantSpeciesNameValueObject;
  createdAt: DateValueObject;
  updatedAt: DateValueObject;
}
