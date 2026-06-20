import { Field, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

import { InventoryItemTypeEnum } from '@contexts/inventory/domain/enums/inventory-item-type.enum';
import { InventoryUnitEnum } from '@contexts/inventory/domain/enums/inventory-unit.enum';

@InputType('UpdateInventoryItemInput')
export class UpdateInventoryItemGraphQLDto {
  @Field(() => String, { description: 'UUID of the item to update' })
  @IsUUID()
  @IsNotEmpty()
  id!: string;

  @Field(() => InventoryItemTypeEnum, { nullable: true })
  @IsOptional()
  @IsEnum(InventoryItemTypeEnum)
  itemType?: InventoryItemTypeEnum;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Send null/empty to clear',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  brand?: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'Send null/empty to clear',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;

  @Field(() => InventoryUnitEnum, { nullable: true })
  @IsOptional()
  @IsEnum(InventoryUnitEnum)
  unit?: InventoryUnitEnum;

  @Field(() => Number, { nullable: true, description: 'Send null to clear' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number | null;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  acquiredAt?: Date | null;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiresAt?: Date | null;
}
