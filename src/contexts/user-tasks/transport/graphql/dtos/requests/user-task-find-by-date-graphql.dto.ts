import { Field, InputType } from '@nestjs/graphql';
import { IsDateString } from 'class-validator';

@InputType('UserTaskFindByDateInput')
export class UserTaskFindByDateGraphQLDto {
  @Field(() => Date)
  @IsDateString()
  date!: Date;
}
