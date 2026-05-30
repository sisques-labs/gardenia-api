import { BasePaginatedResultDto } from '@sisques-labs/nestjs-kit';
import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType('PlantResponseDto')
export class PlantResponseDto {
  @Field(() => ID, { description: 'The id of the plant' })
  id!: string;

  @Field(() => String, { description: 'The name of the plant' })
  name!: string;

  @Field(() => String, {
    nullable: true,
    description: 'The species of the plant',
  })
  species?: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'The image URL of the plant',
  })
  imageUrl?: string | null;

  @Field(() => String, { description: 'The id of the plant owner' })
  userId!: string;

  @Field(() => String, { description: 'The id of the space' })
  spaceId!: string;

  @Field(() => Date, { description: 'When the plant was created' })
  createdAt!: Date;

  @Field(() => Date, {
    nullable: true,
    description: 'When the plant was last updated',
  })
  updatedAt?: Date;
}

@ObjectType('PaginatedPlantResultDto')
export class PaginatedPlantResultDto extends BasePaginatedResultDto {
  @Field(() => [PlantResponseDto], {
    description: 'The plants in the current page',
  })
  items!: PlantResponseDto[];
}
