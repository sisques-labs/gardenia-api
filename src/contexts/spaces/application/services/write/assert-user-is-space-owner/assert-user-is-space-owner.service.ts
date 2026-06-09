import { Injectable } from '@nestjs/common';
import { IBaseService } from '@sisques-labs/nestjs-kit';

import { SpaceMembership } from '@contexts/spaces/domain/entities/space-membership.entity';
import { NotSpaceOwnerException } from '@contexts/spaces/domain/exceptions/not-space-owner.exception';

export interface AssertUserIsSpaceOwnerServiceInput {
  membership: SpaceMembership;
  userId: string;
  spaceId: string;
}

@Injectable()
export class AssertUserIsSpaceOwnerService implements IBaseService {
  async execute(input: AssertUserIsSpaceOwnerServiceInput): Promise<void> {
    if (!input.membership.role.isOwner()) {
      throw new NotSpaceOwnerException(input.userId, input.spaceId);
    }
  }
}
