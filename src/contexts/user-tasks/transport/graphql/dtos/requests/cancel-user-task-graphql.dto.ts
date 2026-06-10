import { Field, ID, InputType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@InputType('CancelUserTaskInput')
export class CancelUserTaskGraphQLDto {
  @Field(() => ID)
  @IsUUID()
  id!: string;
}
