import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PlantRestResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'UUID of the plant',
  })
  id!: string;

  @ApiProperty({
    example: 'My Plant',
    description: 'Name of the plant',
  })
  name!: string;

  @ApiPropertyOptional({
    example: 'Rosa canina',
    description: 'Species of the plant',
  })
  species?: string | null;

  @ApiPropertyOptional({
    example: 'https://example.com/plant.jpg',
    description: 'Image URL of the plant',
  })
  imageUrl?: string | null;

  @ApiProperty({
    example: '660e8400-e29b-41d4-a716-446655440001',
    description: 'UUID of the plant owner',
  })
  userId!: string;

  @ApiProperty({
    example: '770e8400-e29b-41d4-a716-446655440002',
    description: 'UUID of the space the plant belongs to',
  })
  spaceId!: string;

  @ApiProperty({
    description: 'When the plant was created',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'When the plant was last updated',
  })
  updatedAt!: Date;
}
