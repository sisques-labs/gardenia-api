import { Field, InputType } from '@nestjs/graphql';
import { BaseFindByCriteriaInput } from '@sisques-labs/nestjs-kit';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';

import { HarvestFilterInput } from '@contexts/harvests/transport/graphql/dtos/requests/harvest/harvest-filter.input';
import { HarvestSortInput } from '@contexts/harvests/transport/graphql/dtos/requests/harvest/harvest-sort.input';

@InputType('HarvestFindByCriteriaRequestDto')
export class HarvestFindByCriteriaRequestDto extends BaseFindByCriteriaInput {
  @Field(() => [HarvestFilterInput], {
    nullable: true,
    description: 'The filters to find by',
    defaultValue: [],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => HarvestFilterInput)
  declare filters?: HarvestFilterInput[];

  @Field(() => [HarvestSortInput], {
    nullable: true,
    description: 'The sorts to find by',
    defaultValue: [],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => HarvestSortInput)
  declare sorts?: HarvestSortInput[];
}
