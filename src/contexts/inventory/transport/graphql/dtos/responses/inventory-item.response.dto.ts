import { Field, ID, ObjectType } from '@nestjs/graphql';
import { BasePaginatedResultDto } from '@sisques-labs/nestjs-kit/graphql';

import { InventoryItemTypeEnum } from '@contexts/inventory/domain/enums/inventory-item-type.enum';
import { InventoryUnitEnum } from '@contexts/inventory/domain/enums/inventory-unit.enum';

@ObjectType('InventoryItemResponseDto')
export class InventoryItemResponseDto {
  @Field(() => ID, { description: 'UUID of the inventory item' })
  id!: string;

  @Field(() => InventoryItemTypeEnum, { description: 'Item type' })
  itemType!: InventoryItemTypeEnum;

  @Field(() => String, { description: 'Item name' })
  name!: string;

  @Field(() => String, { nullable: true, description: 'Brand' })
  brand!: string | null;

  @Field(() => String, { nullable: true, description: 'Notes' })
  notes!: string | null;

  @Field(() => Number, { description: 'Quantity in stock' })
  quantity!: number;

  @Field(() => InventoryUnitEnum, { description: 'Unit of measurement' })
  unit!: InventoryUnitEnum;

  @Field(() => Number, { nullable: true, description: 'Low-stock threshold' })
  lowStockThreshold!: number | null;

  @Field(() => Date, {
    nullable: true,
    description: 'When the item was acquired',
  })
  acquiredAt!: Date | null;

  @Field(() => Date, { nullable: true, description: 'When the item expires' })
  expiresAt!: Date | null;

  @Field(() => String, { description: 'UUID of the creator' })
  userId!: string;

  @Field(() => String, { description: 'UUID of the space' })
  spaceId!: string;

  @Field(() => Date, { description: 'When the record was created' })
  createdAt!: Date;

  @Field(() => Date, { description: 'When the record was last updated' })
  updatedAt!: Date;
}

@ObjectType('PaginatedInventoryItemsResultDto')
export class PaginatedInventoryItemsResultDto extends BasePaginatedResultDto {
  @Field(() => [InventoryItemResponseDto], {
    description: 'Inventory items in the current page',
  })
  items!: InventoryItemResponseDto[];
}
