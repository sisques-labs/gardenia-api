import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

import { InventoryItemTypeEnum } from '@contexts/inventory/domain/enums/inventory-item-type.enum';
import { InventoryUnitEnum } from '@contexts/inventory/domain/enums/inventory-unit.enum';

export class UpdateInventoryItemDto {
  @ApiPropertyOptional({ enum: InventoryItemTypeEnum })
  @IsOptional()
  @IsEnum(InventoryItemTypeEnum)
  itemType?: InventoryItemTypeEnum;

  @ApiPropertyOptional({ example: 'Lettuce seeds' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({
    example: 'Batlle',
    description: 'Brand. Send null or empty to clear.',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  brand?: string | null;

  @ApiPropertyOptional({
    description: 'Notes. Send null or empty to clear.',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;

  @ApiPropertyOptional({ enum: InventoryUnitEnum })
  @IsOptional()
  @IsEnum(InventoryUnitEnum)
  unit?: InventoryUnitEnum;

  @ApiPropertyOptional({
    example: 2,
    description: 'Low-stock threshold. Send null to clear.',
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  acquiredAt?: Date | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiresAt?: Date | null;
}
