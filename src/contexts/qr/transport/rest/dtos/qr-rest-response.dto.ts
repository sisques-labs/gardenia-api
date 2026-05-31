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

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
