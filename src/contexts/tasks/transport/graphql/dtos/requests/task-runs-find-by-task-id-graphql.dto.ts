import { Field, ID, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

@InputType('TaskRunsFindByTaskIdInput')
export class TaskRunsFindByTaskIdGraphQLDto {
  @Field(() => ID, { description: 'The id of the task whose runs to find' })
  @IsUUID()
  @IsNotEmpty()
  taskId!: string;
}
