import { DateValueObject } from '@sisques-labs/nestjs-kit';

import { SpaceEnvironmentValueObject } from '../value-objects/space-environment/space-environment.value-object';
import { SpaceIdValueObject } from '../value-objects/space-id/space-id.value-object';
import { SpaceLatitudeValueObject } from '../value-objects/space-latitude/space-latitude.value-object';
import { SpaceLongitudeValueObject } from '../value-objects/space-longitude/space-longitude.value-object';
import { SpaceNameValueObject } from '../value-objects/space-name/space-name.value-object';

export interface ISpace {
  id: SpaceIdValueObject;
  name: SpaceNameValueObject;
  ownerId: SpaceIdValueObject;
  createdAt: DateValueObject;
  updatedAt: DateValueObject;
  latitude?: SpaceLatitudeValueObject | null;
  longitude?: SpaceLongitudeValueObject | null;
  environment?: SpaceEnvironmentValueObject | null;
}
