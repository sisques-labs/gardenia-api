import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

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
    return this.membershipReadRepository.findByUserAndSpace(
      query.userId.value,
      query.spaceId.value,
    );
  }
}
