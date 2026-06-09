import { Inject, Injectable } from '@nestjs/common';
import {
  Criteria,
  FilterOperator,
  IBaseService,
} from '@sisques-labs/nestjs-kit';

import { DuplicateMembershipException } from '@contexts/spaces/domain/exceptions/duplicate-membership.exception';
import {
  IMembershipReadRepository,
  MEMBERSHIP_READ_REPOSITORY,
} from '@contexts/spaces/domain/repositories/read/membership-read.repository';

export interface AssertUserNotSpaceMemberServiceInput {
  userId: string;
  spaceId: string;
}

@Injectable()
export class AssertUserNotSpaceMemberService implements IBaseService {
  constructor(
    @Inject(MEMBERSHIP_READ_REPOSITORY)
    private readonly membershipReadRepository: IMembershipReadRepository,
  ) {}

  async execute(input: AssertUserNotSpaceMemberServiceInput): Promise<void> {
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

    if (result.total > 0) {
      throw new DuplicateMembershipException(input.userId, input.spaceId);
    }
  }
}
