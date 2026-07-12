import { Field, InputType } from '@nestjs/graphql';
import { BaseFindByCriteriaInput } from '@sisques-labs/nestjs-kit/graphql';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';

import { BridgeFilterInput } from '@contexts/nodes/transport/graphql/dtos/requests/bridge-filter.input';
import { BridgeSortInput } from '@contexts/nodes/transport/graphql/dtos/requests/bridge-sort.input';

@InputType('BridgeFindByCriteriaRequestDto')
export class BridgeFindByCriteriaRequestDto extends BaseFindByCriteriaInput {
  @Field(() => [BridgeFilterInput], {
    nullable: true,
    description: 'The filters to find by',
    defaultValue: [],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => BridgeFilterInput)
  declare filters?: BridgeFilterInput[];

  @Field(() => [BridgeSortInput], {
    nullable: true,
    description: 'The sorts to find by',
    defaultValue: [],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => BridgeSortInput)
  declare sorts?: BridgeSortInput[];
}
