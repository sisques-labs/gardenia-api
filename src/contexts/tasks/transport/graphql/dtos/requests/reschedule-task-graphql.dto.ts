import { Field, ID, InputType } from '@nestjs/graphql';
import { IsDateString, IsUUID } from 'class-validator';

@InputType('RescheduleTaskInput')
export class RescheduleTaskGraphQLDto {
  @Field(() => ID)
  @IsUUID()
  id!: string;

  @Field(() => String)
  @IsDateString()
  scheduledAt!: string;
}
