import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

@InputType('SpaceAddMemberRequestDto')
export class SpaceAddMemberRequestDto {
  @Field(() => String, { description: 'The id of the space' })
  @IsUUID()
  @IsNotEmpty()
  spaceId!: string;

  @Field(() => String, { description: 'The id of the user to add' })
  @IsUUID()
  @IsNotEmpty()
  targetUserId!: string;
}
