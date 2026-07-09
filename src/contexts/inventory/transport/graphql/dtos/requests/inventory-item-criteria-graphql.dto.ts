import { Field, InputType } from '@nestjs/graphql';
import { BaseFindByCriteriaInput } from '@sisques-labs/nestjs-kit/graphql';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';

import { InventoryItemFilterInput } from '@contexts/inventory/transport/graphql/dtos/requests/inventory-item-filter.input';
import { InventoryItemSortInput } from '@contexts/inventory/transport/graphql/dtos/requests/inventory-item-sort.input';

@InputType('InventoryItemCriteriaInput')
export class InventoryItemCriteriaGraphQLDto extends BaseFindByCriteriaInput {
  @Field(() => [InventoryItemFilterInput], {
    nullable: true,
    description: 'The filters to find by',
    defaultValue: [],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => InventoryItemFilterInput)
  declare filters?: InventoryItemFilterInput[];

  @Field(() => [InventoryItemSortInput], {
    nullable: true,
    description: 'The sorts to find by',
    defaultValue: [],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => InventoryItemSortInput)
  declare sorts?: InventoryItemSortInput[];
}
