import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

import { HarvestUnitEnum } from '@contexts/harvests/domain/enums/harvest-unit.enum';

export class CreateHarvestDto {
  @ApiProperty({
    example: 'Tomate Cherry Rojo',
    description: 'Crop type (free text)',
  })
  @IsString()
  @IsNotEmpty()
  cropType!: string;

  @ApiProperty({ example: 2.5, description: 'Quantity (positive decimal)' })
  @IsNumber()
  @IsPositive()
  quantity!: number;

  @ApiProperty({ enum: HarvestUnitEnum, example: HarvestUnitEnum.KG })
  @IsEnum(HarvestUnitEnum)
  unit!: HarvestUnitEnum;

  @ApiPropertyOptional({
    example: '2026-06-12T10:00:00.000Z',
    description: 'When the harvest occurred. Defaults to now if omitted.',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  harvestedAt?: Date;
}
