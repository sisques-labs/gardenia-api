import { Field, InputType } from '@nestjs/graphql';
import {
  IsBoolean,
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

@InputType('UpdateCareScheduleInput')
export class UpdateCareScheduleGraphQLDto {
  @Field(() => String, { description: 'UUID of the care schedule to update' })
  @IsUUID()
  @IsNotEmpty()
  id!: string;

  @Field(() => CareScheduleActivityTypeEnum, { nullable: true })
  @IsOptional()
  @IsEnum(CareScheduleActivityTypeEnum)
  activityType?: CareScheduleActivityTypeEnum;

  @Field(() => Number, {
    nullable: true,
    description:
      'Interval in days (>= 1). Send null to clear it (one-time schedule).',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  intervalDays?: number | null;

  @Field(() => Number, { nullable: true, description: 'Send null to clear' })
  @IsOptional()
  @IsNumber()
  @Min(0.001)
  quantity?: number | null;

  @Field(() => CareScheduleUnitEnum, {
    nullable: true,
    description: 'Send null to clear',
  })
  @IsOptional()
  @IsEnum(CareScheduleUnitEnum)
  unit?: CareScheduleUnitEnum | null;

  @Field(() => String, {
    nullable: true,
    description: 'Send null/empty to clear',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
