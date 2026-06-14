import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CareLogRestResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  plantId!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  spaceId!: string;

  @ApiProperty()
  activityType!: string;

  @ApiProperty()
  performedAt!: Date;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;

  @ApiPropertyOptional({ nullable: true })
  quantity!: number | null;

  @ApiPropertyOptional({ nullable: true })
  unit!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
