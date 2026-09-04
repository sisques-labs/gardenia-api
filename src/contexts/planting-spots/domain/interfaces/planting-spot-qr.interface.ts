import {
  IBaseAggregate,
  NumberValueObject,
  StringValueObject,
  UrlValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';
export interface IPlantingSpotQr extends IBaseAggregate {
  spaceId: UuidValueObject;
  targetUrl: UrlValueObject;
  generation: NumberValueObject;
  image: StringValueObject;
}
