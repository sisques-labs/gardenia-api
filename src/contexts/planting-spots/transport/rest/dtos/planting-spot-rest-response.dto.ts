import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PlantingSpotRestResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'UUID of the planting spot',
  })
  id!: string;

  @ApiProperty({
    example: 'North Bed',
    description: 'Name of the planting spot',
  })
  name!: string;

  @ApiProperty({
    example: 'raised_bed',
    description: 'Type of the planting spot',
  })
  type!: string;

  @ApiPropertyOptional({
    example: 'A raised bed in the north corner',
    description: 'Optional description of the planting spot',
    nullable: true,
  })
  description?: string | null;

  @ApiProperty({
    example: '660e8400-e29b-41d4-a716-446655440001',
    description: 'UUID of the owner user',
  })
  userId!: string;

  @ApiProperty({
    example: '770e8400-e29b-41d4-a716-446655440002',
    description: 'UUID of the space this spot belongs to',
  })
  spaceId!: string;

  @ApiProperty({ description: 'When the planting spot was created' })
  createdAt!: Date;

  @ApiProperty({ description: 'When the planting spot was last updated' })
  updatedAt!: Date;
}
