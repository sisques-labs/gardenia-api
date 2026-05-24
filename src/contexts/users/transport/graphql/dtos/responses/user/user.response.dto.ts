import { BasePaginatedResultDto } from '@sisques-labs/nestjs-kit';
import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType('UserResponseDto')
export class UserResponseDto {
  @Field(() => ID, { description: 'The id of the user' })
  id!: string;

  @Field(() => String, { description: 'The status of the user' })
  status!: string;

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
