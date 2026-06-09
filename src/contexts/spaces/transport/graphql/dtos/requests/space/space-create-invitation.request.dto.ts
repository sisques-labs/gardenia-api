import { Field, InputType } from '@nestjs/graphql';
import { IsDate, IsEnum, IsOptional, IsUUID } from 'class-validator';

import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';

@InputType('SpaceCreateInvitationRequestDto')
export class SpaceCreateInvitationRequestDto {
  @Field(() => String)
  @IsUUID()
  spaceId!: string;

  @Field(() => MembershipRoleEnum, {
    nullable: true,
    defaultValue: MembershipRoleEnum.MEMBER,
  })
  @IsOptional()
  @IsEnum(MembershipRoleEnum)
  role?: MembershipRoleEnum;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate()
  expiresAt?: Date;
}
