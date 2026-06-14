import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

import { CareLogActivityTypeEnum } from '@contexts/care-log/domain/enums/care-log-activity-type.enum';
import { CareLogUnitEnum } from '@contexts/care-log/domain/enums/care-log-unit.enum';

export class CreateCareLogEntryDto {
  @ApiProperty({ description: 'UUID of the plant this entry belongs to' })
  @IsUUID()
  plantId!: string;

  @ApiProperty({ enum: CareLogActivityTypeEnum })
  @IsEnum(CareLogActivityTypeEnum)
  activityType!: string;

  @ApiPropertyOptional({
    description: 'When the activity was performed; defaults to now',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  performedAt?: Date;

  @ApiPropertyOptional({ description: 'Optional notes (max 2000 chars)' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({
    description: 'Quantity used (must be paired with unit)',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  quantity?: number;

  @ApiPropertyOptional({
    enum: CareLogUnitEnum,
    description: 'Unit for quantity (must be paired with quantity)',
  })
  @IsOptional()
  @IsEnum(CareLogUnitEnum)
  unit?: string;
}
