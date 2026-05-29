import { Injectable } from '@nestjs/common';
import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { SpaceMembership } from '@contexts/spaces/domain/entities/space-membership.entity';
import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';
import { MembershipRoleValueObject } from '@contexts/spaces/domain/value-objects/membership-role/membership-role.value-object';
import { SpaceIdValueObject } from '@contexts/spaces/domain/value-objects/space-id/space-id.value-object';
import { SpaceMembershipEntity } from '../entities/space-membership.entity';

@Injectable()
export class SpaceMembershipTypeOrmMapper {
  public toDomain(entity: SpaceMembershipEntity): SpaceMembership {
    return new SpaceMembership({
      userId: new UuidValueObject(entity.userId),
      spaceId: new SpaceIdValueObject(entity.spaceId),
      role: new MembershipRoleValueObject(entity.role as MembershipRoleEnum),
      joinedAt: new DateValueObject(entity.joinedAt),
    });
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
