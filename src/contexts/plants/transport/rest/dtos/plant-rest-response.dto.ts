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
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'UUID of the linked plant species catalog entry',
  })
  plantSpeciesId?: string | null;

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

  @ApiPropertyOptional({
    example: 'd4e5f6a7-b8c9-4123-defa-234567890123',
    description: 'UUID of the linked QR code (resolve via GraphQL qr field)',
  })
  qrId?: string | null;

  @ApiProperty({ description: 'When the plant was created' })
  createdAt!: Date;

  @ApiProperty({ description: 'When the plant was last updated' })
  updatedAt!: Date;
}
