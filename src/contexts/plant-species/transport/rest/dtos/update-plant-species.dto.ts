import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdatePlantSpeciesDto {
  @ApiPropertyOptional({
    example: 'Monstera deliciosa',
    description: 'Updated globally unique species name',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;
}
