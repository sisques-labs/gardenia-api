import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

import { HarvestUnitEnum } from '@contexts/harvests/domain/enums/harvest-unit.enum';

export class UpdateHarvestDto {
  @ApiPropertyOptional({ example: 'Pepino', description: 'Updated crop type' })
  @IsOptional()
  @IsString()
  cropType?: string;

  @ApiPropertyOptional({ example: 3.0, description: 'Updated quantity' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  quantity?: number;

  @ApiPropertyOptional({ enum: HarvestUnitEnum })
  @IsOptional()
  @IsEnum(HarvestUnitEnum)
  unit?: HarvestUnitEnum;

  @ApiPropertyOptional({ description: 'Updated harvest date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  harvestedAt?: Date;
}
