import { BasePaginatedResultDto } from '@sisques-labs/nestjs-kit';
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';

@ObjectType('PlantInSpotResponseDto')
export class PlantInSpotResponseDto {
  @Field(() => ID, { description: 'UUID of the plant' })
  id!: string;

  @Field(() => String, { description: 'Name of the plant' })
  name!: string;

  @Field(() => ID, {
    nullable: true,
    description: 'UUID of the linked plant species',
  })
  plantSpeciesId?: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'Image URL of the plant',
  })
  imageUrl?: string | null;

  @Field(() => String, { description: 'UUID of the plant owner' })
  userId!: string;

  @Field(() => String, { description: 'UUID of the space' })
  spaceId!: string;

  @Field(() => Date, { description: 'When the plant was created' })
  createdAt!: Date;

  @Field(() => Date, { description: 'When the plant was last updated' })
  updatedAt!: Date;
}

@ObjectType('PlantingSpotResponseDto')
export class PlantingSpotResponseDto {
  @Field(() => ID, { description: 'UUID of the planting spot' })
  id!: string;

  @Field(() => String, { description: 'Name of the planting spot' })
  name!: string;

  @Field(() => PlantingSpotTypeEnum, {
    description: 'Type of the planting spot',
  })
  type!: PlantingSpotTypeEnum;

  @Field(() => String, {
    nullable: true,
    description: 'Optional description of the planting spot',
  })
  description?: string | null;

  @Field(() => Int, {
    nullable: true,
    description: 'Maximum number of plants this spot can hold (soft limit)',
  })
  capacity?: number | null;

  @Field(() => Int, {
    nullable: true,
    description: 'Row position of this spot in the space grid',
  })
  row?: number | null;

  @Field(() => Int, {
    nullable: true,
    description: 'Column position of this spot in the space grid',
  })
  column?: number | null;

  @Field(() => String, {
    nullable: true,
    description: 'Physical dimensions of the spot (e.g. "2.4 × 1.2 m")',
  })
  dimensions?: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'Type of soil in this spot',
  })
  soilType?: string | null;

  @Field(() => String, { description: 'UUID of the owner user' })
  userId!: string;

  @Field(() => String, {
    description: 'UUID of the space this spot belongs to',
  })
  spaceId!: string;

  @Field(() => [PlantInSpotResponseDto], {
    description: 'Plants currently assigned to this spot (populated when resolve=true)',
  })
  resolvedPlants!: PlantInSpotResponseDto[];

  @Field(() => Date, { description: 'When the planting spot was created' })
  createdAt!: Date;

  @Field(() => Date, { description: 'When the planting spot was last updated' })
  updatedAt!: Date;
}

@ObjectType('PaginatedPlantingSpotResultDto')
export class PaginatedPlantingSpotResultDto extends BasePaginatedResultDto {
  @Field(() => [PlantingSpotResponseDto], {
    description: 'The planting spots in the current page',
  })
  items!: PlantingSpotResponseDto[];
}
