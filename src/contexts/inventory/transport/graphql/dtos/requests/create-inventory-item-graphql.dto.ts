import { Field, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

import { InventoryItemTypeEnum } from '@contexts/inventory/domain/enums/inventory-item-type.enum';
import { InventoryUnitEnum } from '@contexts/inventory/domain/enums/inventory-unit.enum';

@InputType('CreateInventoryItemInput')
export class CreateInventoryItemGraphQLDto {
  @Field(() => InventoryItemTypeEnum, { description: 'Item type' })
  @IsEnum(InventoryItemTypeEnum)
  itemType!: InventoryItemTypeEnum;

  @Field(() => String, { description: 'Item name (free text)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @Field(() => String, { nullable: true, description: 'Brand' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  brand?: string;

  @Field(() => String, { nullable: true, description: 'Notes' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @Field(() => Number, { description: 'Quantity in stock (>= 0)' })
  @IsNumber()
  @Min(0)
  quantity!: number;

  @Field(() => InventoryUnitEnum, { description: 'Unit of measurement' })
  @IsEnum(InventoryUnitEnum)
  unit!: InventoryUnitEnum;

  @Field(() => Number, {
    nullable: true,
    description: 'Low-stock threshold (>= 0)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number;

  @Field(() => Date, {
    nullable: true,
    description: 'When the item was acquired',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  acquiredAt?: Date;

  @Field(() => Date, { nullable: true, description: 'When the item expires' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiresAt?: Date;
}
