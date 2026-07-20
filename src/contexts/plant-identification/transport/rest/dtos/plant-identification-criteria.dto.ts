import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

import { PlantIdentificationStatusEnum } from '@contexts/plant-identification/domain/enums/plant-identification-status.enum';

export class PlantIdentificationCriteriaDto {
  @ApiPropertyOptional({ enum: PlantIdentificationStatusEnum })
  @IsOptional()
  @IsEnum(PlantIdentificationStatusEnum)
  status?: PlantIdentificationStatusEnum;

  @ApiPropertyOptional({ example: 1, description: '1-based page number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, description: 'Items per page (max 100)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
