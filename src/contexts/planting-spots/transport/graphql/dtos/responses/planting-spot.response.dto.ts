import { BasePaginatedResultDto } from '@sisques-labs/nestjs-kit';
import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';

import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';

@ObjectType('PlantInSpotResponseDto')
export class PlantInSpotResponseDto {
  @Field(() => ID, { description: 'UUID of the plant' })
  id!: string;

  @Field(() => String, { description: 'Name of the plant' })
  name!: string;

  @Field(() => ID, { nullable: true, description: 'UUID of the linked plant species' })
  plantSpeciesId?: string | null;

  @Field(() => String, { nullable: true, description: 'Image URL of the plant' })
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

  @Field(() => PlantingSpotTypeEnum, { description: 'Type of the planting spot' })
  type!: PlantingSpotTypeEnum;

  @Field(() => String, { nullable: true, description: 'Optional description' })
  description?: string | null;

  @Field(() => Int, { nullable: true, description: 'Maximum plants (soft limit)' })
  capacity?: number | null;

  @Field(() => Int, { nullable: true, description: 'Row position in the space grid' })
  row?: number | null;

  @Field(() => Int, { nullable: true, description: 'Column position in the space grid' })
  column?: number | null;

  @Field(() => Float, { nullable: true, description: 'Width in metres' })
  dimensionsWidth?: number | null;

  @Field(() => Float, { nullable: true, description: 'Height in metres' })
  dimensionsHeight?: number | null;

  @Field(() => Float, { nullable: true, description: 'Length in metres' })
  dimensionsLength?: number | null;

  @Field(() => String, { nullable: true, description: 'Type of soil' })
  soilType?: string | null;

  @Field(() => String, { description: 'UUID of the owner user' })
  userId!: string;

  @Field(() => String, { description: 'UUID of the space this spot belongs to' })
  spaceId!: string;

  @Field(() => [PlantInSpotResponseDto], {
    description: 'Plants currently assigned to this spot',
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
