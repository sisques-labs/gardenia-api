import { BasePaginatedResultDto } from '@sisques-labs/nestjs-kit/graphql';
import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType('UserResponseDto')
export class UserResponseDto {
  @Field(() => ID, { description: 'The id of the user' })
  id!: string;

  @Field(() => String, { description: 'The status of the user' })
  status!: string;

  @Field(() => String, { description: 'The username of the user' })
  username!: string;

  @Field(() => String, {
    nullable: true,
    description: 'The first name of the user',
  })
  firstName?: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'The last name of the user',
  })
  lastName?: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'The avatar URL of the user',
  })
  avatarUrl?: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'The bio of the user',
  })
  bio?: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'The locale of the user',
  })
  locale?: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'The timezone of the user',
  })
  timezone?: string | null;

  @Field(() => Date, { description: 'The created at timestamp of the user' })
  createdAt!: Date;

  @Field(() => Date, {
    nullable: true,
    description: 'The updated at timestamp of the user',
  })
  updatedAt?: Date;
}

@ObjectType('PaginatedUserResultDto')
export class PaginatedUserResultDto extends BasePaginatedResultDto {
  @Field(() => [UserResponseDto], {
    description: 'The users in the current page',
  })
  items!: UserResponseDto[];
}
