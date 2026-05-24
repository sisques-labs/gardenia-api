import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

@InputType('UserFindByIdRequestDto')
export class UserFindByIdRequestDto {
  @Field(() => String, {
    description: 'The id of the user to find',
  })
  @IsUUID()
  @IsNotEmpty()
  id!: string;
}
