import { Field, InputType } from '@nestjs/graphql';
import { BaseFindByCriteriaInput } from '@sisques-labs/nestjs-kit';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';

import { PlantingSpotFilterInput } from '@contexts/planting-spots/transport/graphql/dtos/requests/planting-spot/planting-spot-filter.input';
import { PlantingSpotSortInput } from '@contexts/planting-spots/transport/graphql/dtos/requests/planting-spot/planting-spot-sort.input';

@InputType('PlantingSpotFindByCriteriaRequestDto')
export class PlantingSpotFindByCriteriaRequestDto extends BaseFindByCriteriaInput {
  @Field(() => [PlantingSpotFilterInput], {
    nullable: true,
    description: 'The filters to find by',
    defaultValue: [],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PlantingSpotFilterInput)
  declare filters?: PlantingSpotFilterInput[];

  @Field(() => [PlantingSpotSortInput], {
    nullable: true,
    description: 'The sorts to find by',
    defaultValue: [],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PlantingSpotSortInput)
  declare sorts?: PlantingSpotSortInput[];
}
