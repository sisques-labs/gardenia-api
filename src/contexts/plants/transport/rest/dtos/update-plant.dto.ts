import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdatePlantDto {
  @ApiPropertyOptional({
    example: 'My Updated Plant',
    description: 'Name of the plant',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 2882337,
    description:
      "GBIF's numeric usageKey of the species to link (from a live search result); null to unlink",
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(1)
  gbifSpeciesKey?: number | null;

  @ApiPropertyOptional({
    example: 'Monstera deliciosa',
    description:
      'Scientific name of the species to link, as chosen from a live search result; null to unlink',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @IsNotEmpty()
  speciesScientificName?: string | null;

  @ApiPropertyOptional({
    example: 'https://example.com/plant.jpg',
    description: 'Image URL of the plant',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'UUID of the planting spot to assign; null to unassign',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  plantingSpotId?: string | null;
}
