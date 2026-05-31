import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePlantDto {
  @ApiProperty({
    example: 'My Plant',
    description: 'Name of the plant',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'UUID of the plant species catalog entry',
  })
  @IsOptional()
  @IsUUID()
  plantSpeciesId?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/plant.jpg',
    description: 'Image URL of the plant',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
