import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PlantQrRestResponseDto {
  @ApiProperty({ description: 'UUID of the QR record' })
  id!: string;

  @ApiProperty({ description: 'UUID of the space' })
  spaceId!: string;

  @ApiProperty({ description: 'Deep link URL encoded in the QR' })
  targetUrl!: string;

  @ApiProperty({ description: 'Number of times the QR has been regenerated' })
  generation!: number;

  @ApiProperty({ description: 'Base64-encoded PNG of the QR image' })
  image!: string;

  @ApiProperty({ description: 'When the QR was created' })
  createdAt!: Date;

  @ApiProperty({ description: 'When the QR was last updated' })
  updatedAt!: Date;
}

export class PlantSpeciesRestResponseDto {
  @ApiProperty({ description: 'UUID of the plant species catalog entry' })
  id!: string;

  @ApiProperty({ description: 'Globally unique species name' })
  name!: string;

  @ApiProperty({ description: 'When the catalog entry was created' })
  createdAt!: Date;

  @ApiProperty({ description: 'When the catalog entry was last updated' })
  updatedAt!: Date;
}

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
    description: 'Resolved plant species catalog entry',
    type: PlantSpeciesRestResponseDto,
  })
  species?: PlantSpeciesRestResponseDto | null;

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
    description: 'QR code associated with this plant',
    type: PlantQrRestResponseDto,
  })
  qr?: PlantQrRestResponseDto | null;

  @ApiProperty({
    description: 'When the plant was created',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'When the plant was last updated',
  })
  updatedAt!: Date;
}
