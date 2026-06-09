import { ApiProperty } from '@nestjs/swagger';

import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';

export class SpaceInvitationRestResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  displayCode!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({ nullable: true })
  qrId!: string | null;

  @ApiProperty()
  expiresAt!: string;

  @ApiProperty({ enum: MembershipRoleEnum })
  role!: MembershipRoleEnum;

  @ApiProperty()
  spaceId!: string;
}
