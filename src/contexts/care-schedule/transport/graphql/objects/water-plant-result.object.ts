import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class WaterPlantResultObject {
  @Field(() => String, { description: 'UUID of the watered plant' })
  plantId!: string;

  @Field(() => String, {
    description:
      'SCHEDULE_COMPLETED if an active care schedule was completed, CARE_LOG_CREATED if an ad-hoc care-log entry was created instead',
  })
  mode!: string;

  @Field(() => String, {
    nullable: true,
    description:
      'UUID of the completed care schedule, when mode is SCHEDULE_COMPLETED',
  })
  careScheduleId?: string;
}
