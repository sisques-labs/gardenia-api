import {
  DateValueObject,
  NumberValueObject,
  StringValueObject,
  UrlValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

export interface IPlantingSpotQr {
  id: UuidValueObject;
  spaceId: UuidValueObject;
  targetUrl: UrlValueObject;
  generation: NumberValueObject;
  image: StringValueObject;
  createdAt: DateValueObject;
  updatedAt: DateValueObject;
}
