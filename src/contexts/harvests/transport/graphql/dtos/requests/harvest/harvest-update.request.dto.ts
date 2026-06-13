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
  IsUUID,
} from 'class-validator';

import { HarvestUnitEnum } from '@contexts/harvests/domain/enums/harvest-unit.enum';

@InputType('HarvestUpdateRequestDto')
export class HarvestUpdateRequestDto {
  @Field(() => String, { description: 'UUID of the harvest to update' })
  @IsUUID()
  @IsNotEmpty()
  id!: string;

  @Field(() => String, { nullable: true, description: 'Updated crop type' })
  @IsOptional()
  @IsString()
  cropType?: string;

  @Field(() => Number, { nullable: true, description: 'Updated quantity' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  quantity?: number;

  @Field(() => HarvestUnitEnum, { nullable: true, description: 'Updated unit' })
  @IsOptional()
  @IsEnum(HarvestUnitEnum)
  unit?: HarvestUnitEnum;

  @Field(() => Date, { nullable: true, description: 'Updated harvest date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  harvestedAt?: Date;
}
