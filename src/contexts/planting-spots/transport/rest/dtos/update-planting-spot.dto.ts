import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';

import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';

export class UpdatePlantingSpotDto {
  @ApiPropertyOptional({
    example: 'East Bed',
    description: 'Updated name of the planting spot',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    enum: PlantingSpotTypeEnum,
    example: PlantingSpotTypeEnum.POT,
    description: 'Updated type of the planting spot',
  })
  @IsOptional()
  @IsEnum(PlantingSpotTypeEnum)
  type?: PlantingSpotTypeEnum;

  @ApiPropertyOptional({
    example: 'Updated description',
    description: 'Updated description; null to clear',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  description?: string | null;
}
