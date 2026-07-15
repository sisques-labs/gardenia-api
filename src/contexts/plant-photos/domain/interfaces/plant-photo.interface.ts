import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PlantPhotoIdValueObject } from '@contexts/plant-photos/domain/value-objects/plant-photo-id/plant-photo-id.value-object';
import { PlantPhotoUrlValueObject } from '@contexts/plant-photos/domain/value-objects/plant-photo-url/plant-photo-url.value-object';

export interface IPlantPhoto {
  id: PlantPhotoIdValueObject;
  plantId: UuidValueObject;
  fileId: UuidValueObject;
  url: PlantPhotoUrlValueObject;
  userId: UuidValueObject;
  spaceId: UuidValueObject;
  createdAt: DateValueObject;
  updatedAt: DateValueObject;
}
