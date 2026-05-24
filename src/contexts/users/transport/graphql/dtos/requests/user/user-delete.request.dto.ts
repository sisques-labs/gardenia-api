import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

@InputType('UserDeleteRequestDto')
export class UserDeleteRequestDto {
  @Field(() => String, { description: 'The id of the user to delete' })
  @IsUUID()
  @IsNotEmpty()
  id!: string;
}
