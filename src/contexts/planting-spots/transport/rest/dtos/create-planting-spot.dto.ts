import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';

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
}
