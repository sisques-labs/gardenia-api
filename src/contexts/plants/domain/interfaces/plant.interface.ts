import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PlantIdValueObject } from '../value-objects/plant-id/plant-id.value-object';
import { PlantImageUrlValueObject } from '../value-objects/plant-image-url/plant-image-url.value-object';
import { PlantLinkedSpeciesIdValueObject } from '../value-objects/plant-linked-species-id/plant-linked-species-id.value-object';
import { PlantNameValueObject } from '../value-objects/plant-name/plant-name.value-object';

export interface IPlant {
  id: PlantIdValueObject;
  name: PlantNameValueObject;
  plantSpeciesId: PlantLinkedSpeciesIdValueObject | null;
  imageUrl: PlantImageUrlValueObject | null;
  userId: UuidValueObject;
  spaceId: UuidValueObject;
  qrId: UuidValueObject | null;
  plantingSpotId: UuidValueObject | null;
  createdAt: DateValueObject;
  updatedAt: DateValueObject;
}
