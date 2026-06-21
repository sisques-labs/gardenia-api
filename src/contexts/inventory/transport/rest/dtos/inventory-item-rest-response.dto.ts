import { ApiProperty } from '@nestjs/swagger';

export class InventoryItemRestResponseDto {
  @ApiProperty({ description: 'UUID of the inventory item' })
  id!: string;

  @ApiProperty({ example: 'SEEDS', description: 'Item type' })
  itemType!: string;

  @ApiProperty({ example: 'Lettuce seeds', description: 'Item name' })
  name!: string;

  @ApiProperty({ nullable: true, description: 'Brand' })
  brand!: string | null;

  @ApiProperty({ nullable: true, description: 'Notes' })
  notes!: string | null;

  @ApiProperty({ example: 5, description: 'Quantity in stock' })
  quantity!: number;

  @ApiProperty({ example: 'PACKETS', description: 'Unit of measurement' })
  unit!: string;

  @ApiProperty({ nullable: true, description: 'Low-stock threshold' })
  lowStockThreshold!: number | null;

  @ApiProperty({ nullable: true, description: 'When the item was acquired' })
  acquiredAt!: Date | null;

  @ApiProperty({ nullable: true, description: 'When the item expires' })
  expiresAt!: Date | null;

  @ApiProperty({ description: 'UUID of the user who created the item' })
  userId!: string;

  @ApiProperty({ description: 'UUID of the space' })
  spaceId!: string;

  @ApiProperty({ description: 'When the record was created' })
  createdAt!: Date;

  @ApiProperty({ description: 'When the record was last updated' })
  updatedAt!: Date;
}
