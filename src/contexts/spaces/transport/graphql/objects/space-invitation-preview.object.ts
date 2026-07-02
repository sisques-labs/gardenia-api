import { Field, ObjectType } from '@nestjs/graphql';

import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';

@ObjectType('SpaceInvitationPreviewResponseDto')
export class SpaceInvitationPreviewResponseDto {
  @Field()
  spaceName!: string;

  @Field(() => MembershipRoleEnum)
  role!: MembershipRoleEnum;

  @Field()
  expiresAt!: Date;

  @Field()
  isExpired!: boolean;
}
