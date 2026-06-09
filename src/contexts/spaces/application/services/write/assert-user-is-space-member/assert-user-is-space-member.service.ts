import { Inject, Injectable } from '@nestjs/common';
import {
  Criteria,
  FilterOperator,
  IBaseService,
} from '@sisques-labs/nestjs-kit';

import { SpaceMembership } from '@contexts/spaces/domain/entities/space-membership.entity';
import { NotASpaceMemberException } from '@contexts/spaces/domain/exceptions/not-a-space-member.exception';
import {
  IMembershipReadRepository,
  MEMBERSHIP_READ_REPOSITORY,
} from '@contexts/spaces/domain/repositories/read/membership-read.repository';

export interface AssertUserIsSpaceMemberServiceInput {
  userId: string;
  spaceId: string;
}

@Injectable()
export class AssertUserIsSpaceMemberService implements IBaseService {
  constructor(
    @Inject(MEMBERSHIP_READ_REPOSITORY)
    private readonly membershipReadRepository: IMembershipReadRepository,
  ) {}

  async execute(
    input: AssertUserIsSpaceMemberServiceInput,
  ): Promise<SpaceMembership> {
    const criteria = new Criteria([
      {
        field: 'userId',
        operator: FilterOperator.EQUALS,
        value: input.userId,
      },
      {
        field: 'spaceId',
        operator: FilterOperator.EQUALS,
        value: input.spaceId,
      },
    ]);

    const result = await this.membershipReadRepository.findByCriteria(criteria);
    const membership = result.total > 0 ? result.items[0] : null;

    if (!membership) {
      throw new NotASpaceMemberException(input.userId, input.spaceId);
    }

    return membership;
  }
}
