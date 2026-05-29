import { DateValueObject } from '@sisques-labs/nestjs-kit';

import { SpaceMembership } from '../entities/space-membership.entity';
import { SpaceIdVO } from '../value-objects/space-id/space-id.vo';
import { SpaceNameVO } from '../value-objects/space-name/space-name.vo';

export interface ISpace {
  id: SpaceIdVO;
  name: SpaceNameVO;
  ownerId: string;
  memberships: SpaceMembership[];
  createdAt: DateValueObject;
  updatedAt: DateValueObject;
}
