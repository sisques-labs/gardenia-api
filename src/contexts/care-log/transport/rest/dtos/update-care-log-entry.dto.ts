import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

import { CareLogActivityTypeEnum } from '@contexts/care-log/domain/enums/care-log-activity-type.enum';
import { CareLogUnitEnum } from '@contexts/care-log/domain/enums/care-log-unit.enum';

export class UpdateCareLogEntryDto {
  @ApiPropertyOptional({ enum: CareLogActivityTypeEnum })
  @IsOptional()
  @IsEnum(CareLogActivityTypeEnum)
  activityType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  performedAt?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  notes?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @IsPositive()
  quantity?: number | null;

  @ApiPropertyOptional({ enum: CareLogUnitEnum })
  @IsOptional()
  @IsEnum(CareLogUnitEnum)
  unit?: string | null;
}
