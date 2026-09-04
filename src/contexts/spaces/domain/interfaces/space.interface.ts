import { IBaseAggregate, UuidValueObject } from '@sisques-labs/nestjs-kit';
import { SpaceEnvironmentValueObject } from '../value-objects/space-environment/space-environment.value-object';

import { SpaceLatitudeValueObject } from '../value-objects/space-latitude/space-latitude.value-object';
import { SpaceLongitudeValueObject } from '../value-objects/space-longitude/space-longitude.value-object';
import { SpaceNameValueObject } from '../value-objects/space-name/space-name.value-object';

export interface ISpace extends IBaseAggregate {
  name: SpaceNameValueObject;
  ownerId: UuidValueObject;
  latitude?: SpaceLatitudeValueObject | null;
  longitude?: SpaceLongitudeValueObject | null;
  environment?: SpaceEnvironmentValueObject | null;
}
