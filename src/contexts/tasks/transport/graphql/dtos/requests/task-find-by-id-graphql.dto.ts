import { Field, ID, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

@InputType('TaskFindByIdInput')
export class TaskFindByIdGraphQLDto {
  @Field(() => ID, { description: 'The id of the task to find' })
  @IsUUID()
  @IsNotEmpty()
  id!: string;
}
