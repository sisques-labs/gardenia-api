import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdatePlantSpeciesDto {
  @ApiPropertyOptional({
    example: 'Monstera deliciosa',
    description: 'Updated globally unique species scientific name',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  scientificName?: string;

  @ApiPropertyOptional({
    example: 'A tropical flowering plant species.',
    description: 'Updated species description',
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({
    example: 'https://example.com/monstera.jpg',
    description: 'Updated species image URL',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string | null;
}
