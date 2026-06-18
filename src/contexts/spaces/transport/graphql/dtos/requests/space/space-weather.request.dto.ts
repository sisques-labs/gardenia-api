import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

@InputType('SpaceWeatherRequestDto')
export class SpaceWeatherRequestDto {
  @Field(() => String)
  @IsUUID()
  @IsNotEmpty()
  spaceId!: string;
}
