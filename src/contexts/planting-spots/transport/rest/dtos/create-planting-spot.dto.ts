import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';

export class PlantingSpotDimensionsDto {
  @ApiPropertyOptional({ example: 2.4, description: 'Width in metres' })
  @IsOptional()
  @IsNumber()
  width?: number | null;

  @ApiPropertyOptional({ example: 0.3, description: 'Height in metres' })
  @IsOptional()
  @IsNumber()
  height?: number | null;

  @ApiPropertyOptional({ example: 1.2, description: 'Length in metres' })
  @IsOptional()
  @IsNumber()
  length?: number | null;
}

export class CreatePlantingSpotDto {
  @ApiProperty({
    example: 'North Bed',
    description: 'Name of the planting spot',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    enum: PlantingSpotTypeEnum,
    example: PlantingSpotTypeEnum.RAISED_BED,
    description: 'Type of the planting spot',
  })
  @IsEnum(PlantingSpotTypeEnum)
  type!: PlantingSpotTypeEnum;

  @ApiPropertyOptional({
    example: 'A raised bed in the north corner',
    description: 'Optional description of the planting spot',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 8,
    description: 'Maximum number of plants (soft limit)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({ example: 1, description: 'Row position in grid' })
  @IsOptional()
  @IsInt()
  @Min(1)
  row?: number;

  @ApiPropertyOptional({ example: 2, description: 'Column position in grid' })
  @IsOptional()
  @IsInt()
  @Min(1)
  column?: number;

  @ApiPropertyOptional({
    type: PlantingSpotDimensionsDto,
    description: 'Physical dimensions (width, height, length in metres)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PlantingSpotDimensionsDto)
  dimensions?: PlantingSpotDimensionsDto | null;

  @ApiPropertyOptional({ example: 'Loamy', description: 'Type of soil' })
  @IsOptional()
  @IsString()
  soilType?: string;
}
