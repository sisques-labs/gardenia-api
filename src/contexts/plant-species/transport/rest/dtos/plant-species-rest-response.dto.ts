import { ApiProperty } from '@nestjs/swagger';

export class PlantSpeciesRestResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'UUID of the plant species catalog entry',
  })
  id!: string;

  @ApiProperty({
    example: 'Monstera',
    description: 'Globally unique species name',
  })
  name!: string;

  @ApiProperty({ description: 'When the catalog entry was created' })
  createdAt!: Date;

  @ApiProperty({ description: 'When the catalog entry was last updated' })
  updatedAt!: Date;
}
