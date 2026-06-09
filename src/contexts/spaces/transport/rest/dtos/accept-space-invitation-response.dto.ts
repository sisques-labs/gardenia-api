import { ApiProperty } from '@nestjs/swagger';

export class AcceptSpaceInvitationResponseDto {
  @ApiProperty()
  userId!: string;
}
