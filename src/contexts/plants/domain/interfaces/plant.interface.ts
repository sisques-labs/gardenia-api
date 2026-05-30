import { DateValueObject } from '@sisques-labs/nestjs-kit';

import { PlantIdValueObject } from '../value-objects/plant-id/plant-id.value-object';
import { PlantImageUrlValueObject } from '../value-objects/plant-image-url/plant-image-url.value-object';
import { PlantNameValueObject } from '../value-objects/plant-name/plant-name.value-object';
import { PlantSpeciesValueObject } from '../value-objects/plant-species/plant-species.value-object';

export interface IPlant {
  id: PlantIdValueObject;
  name: PlantNameValueObject;
  species: PlantSpeciesValueObject | null;
  imageUrl: PlantImageUrlValueObject | null;
  userId: string;
  spaceId: string;
  createdAt: DateValueObject;
  updatedAt: DateValueObject;
}
