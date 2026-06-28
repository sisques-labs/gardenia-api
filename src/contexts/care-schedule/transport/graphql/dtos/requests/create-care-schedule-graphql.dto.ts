import { Field, InputType } from '@nestjs/graphql';
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

@InputType('CreateCareScheduleInput')
export class CreateCareScheduleGraphQLDto {
  @Field(() => String, {
    description: 'UUID of the plant to schedule care for',
  })
  @IsUUID()
  @IsNotEmpty()
  plantId!: string;

  @Field(() => CareScheduleActivityTypeEnum, { description: 'Activity type' })
  @IsEnum(CareScheduleActivityTypeEnum)
  activityType!: CareScheduleActivityTypeEnum;

  @Field(() => Number, {
    nullable: true,
    description:
      'Recurrence interval in days (>= 1). Omit for a one-time schedule due on nextDueAt.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  intervalDays?: number | null;

  @Field(() => Number, { nullable: true, description: 'Dosage quantity (> 0)' })
  @IsOptional()
  @IsNumber()
  @Min(0.001)
  quantity?: number;

  @Field(() => CareScheduleUnitEnum, { nullable: true, description: 'Unit' })
  @IsOptional()
  @IsEnum(CareScheduleUnitEnum)
  unit?: CareScheduleUnitEnum;

  @Field(() => String, { nullable: true, description: 'Notes' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @Field(() => Date, {
    nullable: true,
    description: 'First due date (defaults to now)',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  nextDueAt?: Date;

  @Field(() => Boolean, {
    nullable: true,
    description: 'Whether the schedule is active (defaults to true)',
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
