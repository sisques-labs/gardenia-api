import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType('SpaceCreateRequestDto')
export class SpaceCreateRequestDto {
  @Field(() => String, { description: 'The name of the space' })
  @IsString()
  @IsNotEmpty()
  name!: string;
}
