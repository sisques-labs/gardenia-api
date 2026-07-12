import { Field, InputType } from '@nestjs/graphql';
import { BaseFindByCriteriaInput } from '@sisques-labs/nestjs-kit/graphql';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';

import { NodeFilterInput } from '@contexts/nodes/transport/graphql/dtos/requests/node-filter.input';
import { NodeSortInput } from '@contexts/nodes/transport/graphql/dtos/requests/node-sort.input';

@InputType('NodeFindByCriteriaRequestDto')
export class NodeFindByCriteriaRequestDto extends BaseFindByCriteriaInput {
  @Field(() => [NodeFilterInput], {
    nullable: true,
    description: 'The filters to find by',
    defaultValue: [],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => NodeFilterInput)
  declare filters?: NodeFilterInput[];

  @Field(() => [NodeSortInput], {
    nullable: true,
    description: 'The sorts to find by',
    defaultValue: [],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => NodeSortInput)
  declare sorts?: NodeSortInput[];
}
