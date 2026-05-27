import { UserStatusEnum } from '@contexts/users/domain/enums/user-status.enum';
import { Field, InputType } from '@nestjs/graphql';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';

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

  @Field(() => String, {
    nullable: true,
    description: 'The username of the user',
  })
  @IsOptional()
  @IsString()
  @Length(3, 30)
  username?: string;

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
    description: 'The bio of the user (max 500 characters)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
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
