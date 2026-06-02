import { BasePaginatedResultDto } from '@sisques-labs/nestjs-kit';
import { Field, ID, ObjectType } from '@nestjs/graphql';

import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';

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

  @Field(() => String, { description: 'UUID of the owner user' })
  userId!: string;

  @Field(() => String, {
    description: 'UUID of the space this spot belongs to',
  })
  spaceId!: string;

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
