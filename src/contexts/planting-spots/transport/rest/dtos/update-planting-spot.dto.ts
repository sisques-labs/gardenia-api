import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';

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

  @ApiPropertyOptional({
    example: 8,
    description: 'Updated capacity; null to remove limit',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(1)
  capacity?: number | null;

  @ApiPropertyOptional({
    example: 1,
    description: 'Updated row in grid; null to unset',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(1)
  row?: number | null;

  @ApiPropertyOptional({
    example: 2,
    description: 'Updated column in grid; null to unset',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(1)
  column?: number | null;

  @ApiPropertyOptional({
    example: '2.4 × 1.2 m',
    description: 'Updated dimensions; null to clear',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  dimensions?: string | null;

  @ApiPropertyOptional({
    example: 'Loamy',
    description: 'Updated soil type; null to clear',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  soilType?: string | null;
}
