import { DateValueObject, StringValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

export interface IPlantingSpotPlant {
  id: UuidValueObject;
  name: StringValueObject;
  plantSpeciesId: UuidValueObject | null;
  imageUrl: StringValueObject | null;
  userId: UuidValueObject;
  spaceId: UuidValueObject;
  createdAt: DateValueObject;
  updatedAt: DateValueObject;
}
