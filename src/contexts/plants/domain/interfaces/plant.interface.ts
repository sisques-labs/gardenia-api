import { IBaseAggregate, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PlantImageUrlValueObject } from '../value-objects/plant-image-url/plant-image-url.value-object';

import { PlantNameValueObject } from '../value-objects/plant-name/plant-name.value-object';

export interface IPlant extends IBaseAggregate {
  name: PlantNameValueObject;
  plantSpeciesId: UuidValueObject | null;
  imageUrl: PlantImageUrlValueObject | null;
  userId: UuidValueObject;
  spaceId: UuidValueObject;
  qrId: UuidValueObject | null;
  plantingSpotId: UuidValueObject | null;
}
