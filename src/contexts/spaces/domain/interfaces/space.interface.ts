import { DateValueObject } from '@sisques-labs/nestjs-kit';

import { SpaceIdValueObject } from '../value-objects/space-id/space-id.value-object';
import { SpaceNameValueObject } from '../value-objects/space-name/space-name.value-object';

export interface ISpace {
  id: SpaceIdValueObject;
  name: SpaceNameValueObject;
  ownerId: SpaceIdValueObject;
  createdAt: DateValueObject;
  updatedAt: DateValueObject;
}
