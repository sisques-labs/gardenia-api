import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Criteria, FilterOperator } from '@sisques-labs/nestjs-kit';

import { SpaceMembership } from '@contexts/spaces/domain/entities/space-membership.entity';
import {
  IMembershipReadRepository,
  MEMBERSHIP_READ_REPOSITORY,
} from '@contexts/spaces/domain/repositories/read/membership-read.repository';

import { MembershipFindByUserAndSpaceQuery } from './membership-find-by-user-and-space.query';

@QueryHandler(MembershipFindByUserAndSpaceQuery)
export class MembershipFindByUserAndSpaceQueryHandler implements IQueryHandler<
  MembershipFindByUserAndSpaceQuery,
  SpaceMembership | null
> {
  constructor(
    @Inject(MEMBERSHIP_READ_REPOSITORY)
    private readonly membershipReadRepository: IMembershipReadRepository,
  ) {}

  async execute(
    query: MembershipFindByUserAndSpaceQuery,
  ): Promise<SpaceMembership | null> {
    const criteria = new Criteria([
      {
        field: 'userId',
        operator: FilterOperator.EQUALS,
        value: query.userId.value,
      },
      {
        field: 'spaceId',
        operator: FilterOperator.EQUALS,
        value: query.spaceId.value,
      },
    ]);

    const result = await this.membershipReadRepository.findByCriteria(criteria);
    return result.total > 0 ? result.items[0] : null;
  }
}
