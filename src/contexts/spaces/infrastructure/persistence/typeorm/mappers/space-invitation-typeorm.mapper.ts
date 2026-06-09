import { Injectable } from '@nestjs/common';

import { SpaceInvitationAggregate } from '@contexts/spaces/domain/aggregates/space-invitation.aggregate';
import { SpaceInvitationBuilder } from '@contexts/spaces/domain/builders/space-invitation.builder';
import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';
import { SpaceInvitationViewModel } from '@contexts/spaces/domain/view-models/space-invitation.view-model';
import { SpaceInvitationEntity } from '../entities/space-invitation.entity';

@Injectable()
export class SpaceInvitationTypeOrmMapper {
  constructor(
    private readonly spaceInvitationBuilder: SpaceInvitationBuilder,
  ) {}

  toAggregate(entity: SpaceInvitationEntity): SpaceInvitationAggregate {
    return this.spaceInvitationBuilder
      .withId(entity.id)
      .withSpaceId(entity.spaceId)
      .withCreatedByUserId(entity.createdByUserId)
      .withRole(entity.role as MembershipRoleEnum)
      .withCode(entity.code)
      .withDisplayCode(entity.displayCode)
      .withQrId(entity.qrId)
      .withExpiresAt(entity.expiresAt)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt)
      .build();
  }

  toViewModel(entity: SpaceInvitationEntity): SpaceInvitationViewModel {
    return this.spaceInvitationBuilder
      .withId(entity.id)
      .withSpaceId(entity.spaceId)
      .withCreatedByUserId(entity.createdByUserId)
      .withRole(entity.role as MembershipRoleEnum)
      .withCode(entity.code)
      .withDisplayCode(entity.displayCode)
      .withQrId(entity.qrId)
      .withExpiresAt(entity.expiresAt)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt)
      .buildViewModel();
  }

  toEntity(
    invitation: SpaceInvitationAggregate,
  ): Partial<SpaceInvitationEntity> {
    const primitives = invitation.toPrimitives();
    const entity = new SpaceInvitationEntity();

    entity.id = primitives.id;
    entity.spaceId = primitives.spaceId;
    entity.createdByUserId = primitives.createdByUserId;
    entity.role = primitives.role;
    entity.code = primitives.code;
    entity.displayCode = primitives.displayCode;
    entity.qrId = primitives.qrId;
    entity.expiresAt = primitives.expiresAt;
    entity.createdAt = primitives.createdAt;
    entity.updatedAt = primitives.updatedAt;

    return entity;
  }
}
