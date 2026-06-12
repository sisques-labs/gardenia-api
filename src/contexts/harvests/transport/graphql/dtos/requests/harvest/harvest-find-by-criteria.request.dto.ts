import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import { HarvestUnitEnum } from '@contexts/harvests/domain/enums/harvest-unit.enum';

@InputType('HarvestFindByCriteriaRequestDto')
export class HarvestFindByCriteriaRequestDto {
  @Field(() => String, {
    nullable: true,
    description: 'Filter by crop type (partial match)',
  })
  @IsOptional()
  @IsString()
  cropType?: string;

  @Field(() => HarvestUnitEnum, {
    nullable: true,
    description: 'Filter by unit',
  })
  @IsOptional()
  @IsEnum(HarvestUnitEnum)
  unit?: HarvestUnitEnum;

  @Field(() => Date, {
    nullable: true,
    description: 'Filter harvested_at >= dateFrom',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateFrom?: Date;

  @Field(() => Date, {
    nullable: true,
    description: 'Filter harvested_at <= dateTo',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateTo?: Date;

  @Field(() => Int, { nullable: true, defaultValue: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @Field(() => Int, { nullable: true, defaultValue: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
