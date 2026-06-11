import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PlantSpeciesRestResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'UUID of the plant species catalog entry',
  })
  id!: string;

  @ApiProperty({
    example: 'Monstera deliciosa',
    description: 'Globally unique species scientific name',
  })
  scientificName!: string;

  @ApiPropertyOptional({
    example: 'A tropical flowering plant species.',
    description: 'Species description',
    nullable: true,
  })
  description!: string | null;

  @ApiPropertyOptional({
    example: 'https://example.com/monstera.jpg',
    description: 'Species image URL',
    nullable: true,
  })
  imageUrl!: string | null;

  @ApiProperty({ description: 'When the catalog entry was created' })
  createdAt!: Date;

  @ApiProperty({ description: 'When the catalog entry was last updated' })
  updatedAt!: Date;
}
