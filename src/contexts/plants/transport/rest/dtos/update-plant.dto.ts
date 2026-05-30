import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdatePlantDto {
  @ApiPropertyOptional({
    example: 'My Updated Plant',
    description: 'Name of the plant',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'Rosa canina',
    description: 'Species of the plant',
  })
  @IsOptional()
  @IsString()
  species?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/plant.jpg',
    description: 'Image URL of the plant',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
