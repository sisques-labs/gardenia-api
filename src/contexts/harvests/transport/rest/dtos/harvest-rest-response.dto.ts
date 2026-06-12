import { ApiProperty } from '@nestjs/swagger';

export class HarvestRestResponseDto {
  @ApiProperty({ description: 'UUID of the harvest' })
  id!: string;

  @ApiProperty({ example: 'Tomate Cherry Rojo', description: 'Crop type' })
  cropType!: string;

  @ApiProperty({ example: 2.5, description: 'Quantity harvested' })
  quantity!: number;

  @ApiProperty({ example: 'KG', description: 'Unit of measurement' })
  unit!: string;

  @ApiProperty({ description: 'When the harvest occurred' })
  harvestedAt!: Date;

  @ApiProperty({ description: 'UUID of the user who recorded this harvest' })
  userId!: string;

  @ApiProperty({ description: 'UUID of the space' })
  spaceId!: string;

  @ApiProperty({ description: 'When the record was created' })
  createdAt!: Date;

  @ApiProperty({ description: 'When the record was last updated' })
  updatedAt!: Date;
}
