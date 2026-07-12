import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

@InputType('NodeFindByIdRequestDto')
export class NodeFindByIdRequestDto {
  @Field(() => String, { description: 'The id of the node to find' })
  @IsUUID()
  @IsNotEmpty()
  id!: string;
}
