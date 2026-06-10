import { Field, ID, InputType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@InputType('CompleteUserTaskInput')
export class CompleteUserTaskGraphQLDto {
  @Field(() => ID)
  @IsUUID()
  id!: string;
}
