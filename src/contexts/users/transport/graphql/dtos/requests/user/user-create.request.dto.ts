import { UserStatusEnum } from '@contexts/users/domain/enums/user-status.enum';
import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType('UserCreateRequestDto')
export class UserCreateRequestDto {
  @Field(() => UserStatusEnum, {
    description: 'The status of the user',
  })
  @IsEnum(UserStatusEnum)
  @IsNotEmpty()
  status!: UserStatusEnum;

  @Field(() => String, { description: 'The username of the user' })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @Field(() => String, {
    nullable: true,
    description: 'The first name of the user',
  })
  @IsOptional()
  @IsString()
  firstName?: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'The last name of the user',
  })
  @IsOptional()
  @IsString()
  lastName?: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'The avatar URL of the user',
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'The bio of the user',
  })
  @IsOptional()
  @IsString()
  bio?: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'The locale of the user (BCP-47 tag, e.g. es-AR)',
  })
  @IsOptional()
  @IsString()
  locale?: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'The timezone of the user (IANA tz, e.g. America/Buenos_Aires)',
  })
  @IsOptional()
  @IsString()
  timezone?: string | null;
}
