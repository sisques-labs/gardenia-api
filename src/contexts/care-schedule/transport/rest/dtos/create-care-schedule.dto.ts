import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
import { CareScheduleUnitEnum } from '@contexts/care-schedule/domain/enums/care-schedule-unit.enum';

export class CreateCareScheduleDto {
  @ApiProperty({ description: 'UUID of the plant to schedule care for' })
  @IsUUID()
  @IsNotEmpty()
  plantId!: string;

  @ApiProperty({
    enum: CareScheduleActivityTypeEnum,
    example: CareScheduleActivityTypeEnum.WATERING,
  })
  @IsEnum(CareScheduleActivityTypeEnum)
  activityType!: CareScheduleActivityTypeEnum;

  @ApiProperty({
    example: 3,
    description: 'Recurrence interval in days (>= 1)',
  })
  @IsInt()
  @Min(1)
  intervalDays!: number;

  @ApiPropertyOptional({ example: 250, description: 'Dosage quantity (> 0)' })
  @IsOptional()
  @IsNumber()
  @Min(0.001)
  quantity?: number;

  @ApiPropertyOptional({
    enum: CareScheduleUnitEnum,
    example: CareScheduleUnitEnum.ML,
  })
  @IsOptional()
  @IsEnum(CareScheduleUnitEnum)
  unit?: CareScheduleUnitEnum;

  @ApiPropertyOptional({ example: 'Deep watering in the morning' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({
    example: '2026-06-28T08:00:00.000Z',
    description: 'First due date (defaults to now)',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  nextDueAt?: Date;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the schedule is active (defaults to true)',
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
