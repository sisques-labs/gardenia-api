import { Field, ID, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

@InputType('SpaceFindByIdRequestDto')
export class SpaceFindByIdRequestDto {
  @Field(() => ID, { description: 'The id of the space to find' })
  @IsUUID()
  @IsNotEmpty()
  id!: string;
}
