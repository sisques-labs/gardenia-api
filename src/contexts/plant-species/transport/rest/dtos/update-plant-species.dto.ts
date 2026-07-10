import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class UpdatePlantSpeciesDto {
  @ApiPropertyOptional({
    example: 'Monstera deliciosa',
    description: 'Updated species scientific name',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  scientificName?: string;

  @ApiPropertyOptional({
    example: 2882337,
    description: 'Updated GBIF usageKey identifying the species',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  gbifKey?: number;
}
