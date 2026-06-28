import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
import { CareScheduleUnitEnum } from '@contexts/care-schedule/domain/enums/care-schedule-unit.enum';

export class UpdateCareScheduleDto {
  @ApiPropertyOptional({ enum: CareScheduleActivityTypeEnum })
  @IsOptional()
  @IsEnum(CareScheduleActivityTypeEnum)
  activityType?: CareScheduleActivityTypeEnum;

  @ApiPropertyOptional({
    example: 5,
    description:
      'Interval in days (>= 1). Send null to clear it (one-time schedule).',
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  intervalDays?: number | null;

  @ApiPropertyOptional({
    example: 250,
    description: 'Dosage quantity. Send null to clear.',
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.001)
  quantity?: number | null;

  @ApiPropertyOptional({
    enum: CareScheduleUnitEnum,
    description: 'Send null to clear.',
    nullable: true,
  })
  @IsOptional()
  @IsEnum(CareScheduleUnitEnum)
  unit?: CareScheduleUnitEnum | null;

  @ApiPropertyOptional({
    description: 'Notes. Send null or empty to clear.',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
