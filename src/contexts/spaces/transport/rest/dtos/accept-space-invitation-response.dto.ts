import { ApiProperty } from '@nestjs/swagger';

import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';

export class AcceptSpaceInvitationResponseDto {
  @ApiProperty()
  spaceId!: string;

  @ApiProperty({ enum: MembershipRoleEnum })
  role!: MembershipRoleEnum;
}
