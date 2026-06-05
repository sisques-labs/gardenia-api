import { ApiProperty } from '@nestjs/swagger';

export class QrRestResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  spaceId!: string;

  @ApiProperty()
  targetUrl!: string;

  @ApiProperty()
  generation!: number;

  @ApiProperty({ nullable: true, required: false, type: Date })
  expiresAt!: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
