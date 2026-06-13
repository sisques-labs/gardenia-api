import { Field, InputType } from '@nestjs/graphql';
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

  @Field(() => Date, {
    nullable: true,
    description: 'When the harvest occurred. Defaults to now if omitted.',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  harvestedAt?: Date;
}
