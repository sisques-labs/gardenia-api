import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AcceptSpaceInvitationDto {
  @ApiProperty({ example: 'LIM · 2026 · K0' })
  @IsString()
  @IsNotEmpty()
  code!: string;
}
