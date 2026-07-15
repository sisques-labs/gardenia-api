import { Field, InputType } from '@nestjs/graphql';
import { BaseFindByCriteriaInput } from '@sisques-labs/nestjs-kit/graphql';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';

import { PlantFilterInput } from '@contexts/plants/transport/graphql/dtos/requests/plant/plant-filter.input';
import { PlantSortInput } from '@contexts/plants/transport/graphql/dtos/requests/plant/plant-sort.input';

@InputType('PlantFindByCriteriaRequestDto')
export class PlantFindByCriteriaRequestDto extends BaseFindByCriteriaInput {
  @Field(() => [PlantFilterInput], {
    nullable: true,
    description: 'The filters to find by',
    defaultValue: [],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PlantFilterInput)
  declare filters?: PlantFilterInput[];

  @Field(() => [PlantSortInput], {
    nullable: true,
    description: 'The sorts to find by',
    defaultValue: [],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PlantSortInput)
  declare sorts?: PlantSortInput[];
}
