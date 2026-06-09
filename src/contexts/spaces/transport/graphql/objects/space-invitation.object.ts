import { Field, ObjectType } from '@nestjs/graphql';

import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';

@ObjectType('SpaceInvitationResponseDto')
export class SpaceInvitationResponseDto {
  @Field()
  id!: string;

  @Field()
  displayCode!: string;

  @Field()
  code!: string;

  @Field(() => String, { nullable: true })
  qrId!: string | null;

  @Field()
  expiresAt!: Date;

  @Field(() => MembershipRoleEnum)
  role!: MembershipRoleEnum;

  @Field()
  spaceId!: string;
}
