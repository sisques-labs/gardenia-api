import { BasePaginatedResultDto } from '@sisques-labs/nestjs-kit/graphql';
import { Field, Float, ID, ObjectType } from '@nestjs/graphql';

import { SpaceWeatherResponseDto } from './space-weather.response.dto';

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

  @Field(() => Float, {
    nullable: true,
    description: 'Latitude of the space location',
  })
  latitude?: number | null;

  @Field(() => Float, {
    nullable: true,
    description: 'Longitude of the space location',
  })
  longitude?: number | null;

  @Field(() => String, {
    nullable: true,
    description: 'Environment type of the space',
  })
  environment?: string | null;

  @Field(() => SpaceWeatherResponseDto, {
    nullable: true,
    description: 'Weather forecast for the space location',
  })
  weather?: SpaceWeatherResponseDto | null;
}

@ObjectType('PaginatedSpaceResultDto')
export class PaginatedSpaceResultDto extends BasePaginatedResultDto {
  @Field(() => [SpaceResponseDto], {
    description: 'The spaces in the current page',
  })
  items!: SpaceResponseDto[];
}
