import {
  IBaseAggregate,
  StringValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';
export interface IPlantingSpotPlant extends IBaseAggregate {
  name: StringValueObject;
  plantSpeciesId: UuidValueObject | null;
  imageUrl: StringValueObject | null;
  userId: UuidValueObject;
  spaceId: UuidValueObject;
}
