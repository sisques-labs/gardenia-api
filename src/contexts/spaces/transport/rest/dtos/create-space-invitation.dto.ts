import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';

import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';

export class CreateSpaceInvitationDto {
  @ApiPropertyOptional({
    enum: MembershipRoleEnum,
    default: MembershipRoleEnum.MEMBER,
  })
  @IsOptional()
  @IsEnum(MembershipRoleEnum)
  role?: MembershipRoleEnum;

  @ApiPropertyOptional({ description: 'ISO-8601 expiry; defaults to 24h' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
