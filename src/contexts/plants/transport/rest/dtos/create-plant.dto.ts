import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreatePlantDto {
  @ApiProperty({
    example: 'My Plant',
    description: 'Name of the plant',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    example: 2882337,
    description:
      "GBIF's numeric usageKey of the species to link (from a live search result)",
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  gbifSpeciesKey?: number;

  @ApiPropertyOptional({
    example: 'Monstera deliciosa',
    description:
      'Scientific name of the species to link, as chosen from a live search result',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  speciesScientificName?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/plant.jpg',
    description: 'Image URL of the plant',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
