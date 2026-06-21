import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, MaxLength } from 'class-validator';

export class AdjustInventoryItemQuantityDto {
  @ApiProperty({
    example: -3,
    description:
      'Signed quantity adjustment. Negative consumes, positive restocks.',
  })
  @IsNumber()
  delta!: number;

  @ApiProperty({
    example: 'Sowed lettuce',
    description: 'Reason for the adjustment',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;
}
