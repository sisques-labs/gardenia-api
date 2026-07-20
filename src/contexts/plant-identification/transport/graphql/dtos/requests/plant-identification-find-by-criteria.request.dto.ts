import { Field, InputType } from '@nestjs/graphql';
import { BaseFindByCriteriaInput } from '@sisques-labs/nestjs-kit/graphql';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';

import { PlantIdentificationFilterInput } from '@contexts/plant-identification/transport/graphql/dtos/requests/plant-identification-filter.input';
import { PlantIdentificationSortInput } from '@contexts/plant-identification/transport/graphql/dtos/requests/plant-identification-sort.input';

@InputType('PlantIdentificationFindByCriteriaRequestDto')
export class PlantIdentificationFindByCriteriaRequestDto extends BaseFindByCriteriaInput {
  @Field(() => [PlantIdentificationFilterInput], {
    nullable: true,
    description: 'The filters to find by',
    defaultValue: [],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PlantIdentificationFilterInput)
  declare filters?: PlantIdentificationFilterInput[];

  @Field(() => [PlantIdentificationSortInput], {
    nullable: true,
    description: 'The sorts to find by',
    defaultValue: [],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PlantIdentificationSortInput)
  declare sorts?: PlantIdentificationSortInput[];
}
