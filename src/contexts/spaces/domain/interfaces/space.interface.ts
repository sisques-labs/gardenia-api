import { DateValueObject } from '@sisques-labs/nestjs-kit';

import { SpaceEnvironmentEnum } from '../enums/space-environment.enum';
import { SpaceIdValueObject } from '../value-objects/space-id/space-id.value-object';
import { SpaceNameValueObject } from '../value-objects/space-name/space-name.value-object';

export interface ISpace {
  id: SpaceIdValueObject;
  name: SpaceNameValueObject;
  ownerId: SpaceIdValueObject;
  createdAt: DateValueObject;
  updatedAt: DateValueObject;
  latitude?: number | null;
  longitude?: number | null;
  environment?: SpaceEnvironmentEnum | null;
}
