import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType('SpaceAcceptInvitationRequestDto')
export class SpaceAcceptInvitationRequestDto {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  code!: string;
}
