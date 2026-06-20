import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class CreateInventoryItemDto {
  @ApiProperty({
    enum: InventoryItemTypeEnum,
    example: InventoryItemTypeEnum.SEEDS,
  })
  @IsEnum(InventoryItemTypeEnum)
  itemType!: InventoryItemTypeEnum;

  @ApiProperty({
    example: 'Lettuce seeds',
    description: 'Item name (free text)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ example: 'Batlle', description: 'Brand' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  brand?: string;

  @ApiPropertyOptional({ example: 'Stored in the shed' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiProperty({ example: 5, description: 'Quantity in stock (>= 0)' })
  @IsNumber()
  @Min(0)
  quantity!: number;

  @ApiProperty({ enum: InventoryUnitEnum, example: InventoryUnitEnum.PACKETS })
  @IsEnum(InventoryUnitEnum)
  unit!: InventoryUnitEnum;

  @ApiPropertyOptional({
    example: 2,
    description: 'Low-stock threshold (>= 0)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number;

  @ApiPropertyOptional({ example: '2026-03-01T00:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  acquiredAt?: Date;

  @ApiPropertyOptional({ example: '2027-03-01T00:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiresAt?: Date;
}
