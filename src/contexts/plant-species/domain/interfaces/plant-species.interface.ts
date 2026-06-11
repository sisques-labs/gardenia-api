import { DateValueObject } from '@sisques-labs/nestjs-kit';

import { PlantSpeciesDescriptionValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-description/plant-species-description.value-object';
import { PlantSpeciesIdValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-id/plant-species-id.value-object';
import { PlantSpeciesImageUrlValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-image-url/plant-species-image-url.value-object';
import { PlantSpeciesScientificNameValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-scientific-name/plant-species-scientific-name.value-object';

export interface IPlantSpecies {
  id: PlantSpeciesIdValueObject;
  scientificName: PlantSpeciesScientificNameValueObject;
  description: PlantSpeciesDescriptionValueObject | null;
  imageUrl: PlantSpeciesImageUrlValueObject | null;
  createdAt: DateValueObject;
  updatedAt: DateValueObject;
}
