import { Field, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
} from 'class-validator';

import { HarvestUnitEnum } from '@contexts/harvests/domain/enums/harvest-unit.enum';

@InputType('HarvestCreateRequestDto')
export class HarvestCreateRequestDto {
  @Field(() => String, { description: 'Crop type (free text)' })
  @IsString()
  @IsNotEmpty()
  cropType!: string;

  @Field(() => Number, { description: 'Quantity (positive decimal)' })
  @IsNumber()
  @IsPositive()
  quantity!: number;

  @Field(() => HarvestUnitEnum, { description: 'Unit of measurement' })
  @IsEnum(HarvestUnitEnum)
  unit!: HarvestUnitEnum;

  @Field(() => Date, { description: 'When the harvest occurred' })
  @Type(() => Date)
  @IsDate()
  harvestedAt!: Date;
}
