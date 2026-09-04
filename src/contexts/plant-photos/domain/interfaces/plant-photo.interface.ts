import { IBaseAggregate, UuidValueObject } from '@sisques-labs/nestjs-kit';
import { PlantPhotoUrlValueObject } from '@contexts/plant-photos/domain/value-objects/plant-photo-url/plant-photo-url.value-object';

export interface IPlantPhoto extends IBaseAggregate {
  plantId: UuidValueObject;
  fileId: UuidValueObject;
  url: PlantPhotoUrlValueObject;
  userId: UuidValueObject;
  spaceId: UuidValueObject;
}
