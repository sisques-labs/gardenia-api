import { BasePaginatedResultDto } from '@sisques-labs/nestjs-kit';
import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType('SpaceResponseDto')
export class SpaceResponseDto {
  @Field(() => ID, { description: 'The id of the space' })
  id!: string;

  @Field(() => String, { description: 'The name of the space' })
  name!: string;

  @Field(() => String, { description: 'The id of the space owner' })
  ownerId!: string;

  @Field(() => Date, { description: 'When the space was created' })
  createdAt!: Date;

  @Field(() => Date, {
    nullable: true,
    description: 'When the space was last updated',
  })
  updatedAt?: Date;
}

@ObjectType('PaginatedSpaceResultDto')
export class PaginatedSpaceResultDto extends BasePaginatedResultDto {
  @Field(() => [SpaceResponseDto], {
    description: 'The spaces in the current page',
  })
  items!: SpaceResponseDto[];
}
