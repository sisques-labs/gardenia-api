import { Field, ID, InputType } from '@nestjs/graphql';
import { IsDateString, IsUUID } from 'class-validator';

@InputType('RescheduleUserTaskInput')
export class RescheduleUserTaskGraphQLDto {
  @Field(() => ID)
  @IsUUID()
  id!: string;

  @Field(() => Date)
  @IsDateString()
  newScheduledDate!: Date;
}
