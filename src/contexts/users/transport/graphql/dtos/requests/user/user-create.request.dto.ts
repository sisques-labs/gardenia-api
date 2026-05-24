import { UserStatusEnum } from '@contexts/users/domain/enums/user-status.enum';
import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty } from 'class-validator';

@InputType('UserCreateRequestDto')
export class UserCreateRequestDto {
  @Field(() => UserStatusEnum, {
    description: 'The status of the user',
  })
  @IsEnum(UserStatusEnum)
  @IsNotEmpty()
  status!: UserStatusEnum;
}
