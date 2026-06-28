import { Field, ID, ObjectType } from '@nestjs/graphql';
import { BasePaginatedResultDto } from '@sisques-labs/nestjs-kit';

import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
import { CareScheduleUnitEnum } from '@contexts/care-schedule/domain/enums/care-schedule-unit.enum';

@ObjectType('CareScheduleResponseDto')
export class CareScheduleResponseDto {
  @Field(() => ID, { description: 'UUID of the care schedule' })
  id!: string;

  @Field(() => String, { description: 'UUID of the plant being cared for' })
  plantId!: string;

  @Field(() => CareScheduleActivityTypeEnum, { description: 'Activity type' })
  activityType!: CareScheduleActivityTypeEnum;

  @Field(() => Number, {
    nullable: true,
    description: 'Recurrence interval in days (null for one-time schedules)',
  })
  intervalDays!: number | null;

  @Field(() => Number, { nullable: true, description: 'Dosage quantity' })
  quantity!: number | null;

  @Field(() => CareScheduleUnitEnum, {
    nullable: true,
    description: 'Dosage unit',
  })
  unit!: CareScheduleUnitEnum | null;

  @Field(() => String, { nullable: true, description: 'Notes' })
  notes!: string | null;

  @Field(() => Date, { description: 'When the next care is due' })
  nextDueAt!: Date;

  @Field(() => Date, {
    nullable: true,
    description: 'When the care was last completed',
  })
  lastCompletedAt!: Date | null;

  @Field(() => Boolean, { description: 'Whether the schedule is active' })
  active!: boolean;

  @Field(() => String, { description: 'UUID of the creator' })
  userId!: string;

  @Field(() => String, { description: 'UUID of the space' })
  spaceId!: string;

  @Field(() => Date, { description: 'When the record was created' })
  createdAt!: Date;

  @Field(() => Date, { description: 'When the record was last updated' })
  updatedAt!: Date;
}

@ObjectType('PaginatedCareSchedulesResultDto')
export class PaginatedCareSchedulesResultDto extends BasePaginatedResultDto {
  @Field(() => [CareScheduleResponseDto], {
    description: 'Care schedules in the current page',
  })
  items!: CareScheduleResponseDto[];
}
