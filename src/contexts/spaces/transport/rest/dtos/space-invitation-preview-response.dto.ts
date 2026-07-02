import { ApiProperty } from '@nestjs/swagger';

import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';

export class SpaceInvitationPreviewResponseDto {
  @ApiProperty()
  spaceName!: string;

  @ApiProperty({ enum: MembershipRoleEnum })
  role!: MembershipRoleEnum;

  @ApiProperty()
  expiresAt!: string;

  @ApiProperty()
  isExpired!: boolean;
}
