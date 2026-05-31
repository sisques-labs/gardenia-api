import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

@InputType('SpaceRemoveMemberRequestDto')
export class SpaceRemoveMemberRequestDto {
  @Field(() => String, { description: 'The id of the space' })
  @IsUUID()
  @IsNotEmpty()
  spaceId!: string;

  @Field(() => String, { description: 'The id of the user to remove' })
  @IsUUID()
  @IsNotEmpty()
  targetUserId!: string;
}
