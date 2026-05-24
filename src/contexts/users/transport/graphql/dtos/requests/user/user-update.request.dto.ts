import { UserStatusEnum } from '@contexts/users/domain/enums/user-status.enum';
import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

@InputType('UserUpdateRequestDto')
export class UserUpdateRequestDto {
  @Field(() => String, { description: 'The id of the user to update' })
  @IsUUID()
  @IsNotEmpty()
  id!: string;

  @Field(() => UserStatusEnum, {
    nullable: true,
    description: 'The status of the user',
  })
  @IsEnum(UserStatusEnum)
  @IsOptional()
  status?: UserStatusEnum;
}
