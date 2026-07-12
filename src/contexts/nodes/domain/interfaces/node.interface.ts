import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { NodeIdValueObject } from '../value-objects/node-id/node-id.value-object';
import { NodeNameValueObject } from '../value-objects/node-name/node-name.value-object';
import { NodeStatusValueObject } from '../value-objects/node-status/node-status.value-object';

export interface INode {
  id: NodeIdValueObject;
  spaceId: UuidValueObject;
  bridgeId: UuidValueObject;
  name: NodeNameValueObject | null;
  status: NodeStatusValueObject;
  lastSeenAt: Date | null;
  createdAt: DateValueObject;
  updatedAt: DateValueObject;
}
