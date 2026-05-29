import { Injectable } from '@nestjs/common';

import { SpaceMembershipBuilder } from '@contexts/spaces/domain/builders/space-membership.builder';
import { SpaceMembership } from '@contexts/spaces/domain/entities/space-membership.entity';
import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';
import { SpaceMembershipEntity } from '../entities/space-membership.entity';

@Injectable()
export class SpaceMembershipTypeOrmMapper {
  constructor(private readonly membershipBuilder: SpaceMembershipBuilder) {}

  public toDomain(entity: SpaceMembershipEntity): SpaceMembership {
    return this.membershipBuilder
      .withUserId(entity.userId)
      .withSpaceId(entity.spaceId)
      .withRole(entity.role as MembershipRoleEnum)
      .withJoinedAt(entity.joinedAt)
      .build();
  }

  public toPersistence(
    membership: SpaceMembership,
  ): Partial<SpaceMembershipEntity> {
    const entity = new SpaceMembershipEntity();
    entity.userId = membership.userId;
    entity.spaceId = membership.spaceId;
    entity.role = membership.role.value;
    entity.joinedAt = membership.joinedAt;
    return entity;
  }
}
