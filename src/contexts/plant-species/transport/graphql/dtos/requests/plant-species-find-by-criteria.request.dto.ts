import { Field, InputType } from '@nestjs/graphql';
import { BaseFindByCriteriaInput } from '@sisques-labs/nestjs-kit/graphql';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';

import { PlantSpeciesFilterInput } from '@contexts/plant-species/transport/graphql/dtos/requests/plant-species-filter.input';
import { PlantSpeciesSortInput } from '@contexts/plant-species/transport/graphql/dtos/requests/plant-species-sort.input';

@InputType('PlantSpeciesFindByCriteriaRequestDto')
export class PlantSpeciesFindByCriteriaRequestDto extends BaseFindByCriteriaInput {
  @Field(() => [PlantSpeciesFilterInput], {
    nullable: true,
    description: 'The filters to find by',
    defaultValue: [],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PlantSpeciesFilterInput)
  declare filters?: PlantSpeciesFilterInput[];

  @Field(() => [PlantSpeciesSortInput], {
    nullable: true,
    description: 'The sorts to find by',
    defaultValue: [],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PlantSpeciesSortInput)
  declare sorts?: PlantSpeciesSortInput[];
}
