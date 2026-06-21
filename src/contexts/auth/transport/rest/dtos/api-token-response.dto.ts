import { ApiProperty } from '@nestjs/swagger';

export class ApiTokenResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty()
  spaceId!: string;

  @ApiProperty({ nullable: true })
  lastUsedAt!: Date | null;

  @ApiProperty({ nullable: true })
  revokedAt!: Date | null;

  @ApiProperty()
  createdAt!: Date;
}
