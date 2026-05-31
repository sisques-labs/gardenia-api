import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, ValidateIf } from 'class-validator';

export class UpdatePlantDto {
  @ApiPropertyOptional({
    example: 'My Updated Plant',
    description: 'Name of the plant',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'UUID of the plant species catalog entry; null to unlink',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  plantSpeciesId?: string | null;

  @ApiPropertyOptional({
    example: 'https://example.com/plant.jpg',
    description: 'Image URL of the plant',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
