import { Field, ID, InputType } from '@nestjs/graphql';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

import { CareLogActivityTypeEnum } from '@contexts/care-log/domain/enums/care-log-activity-type.enum';
import { CareLogUnitEnum } from '@contexts/care-log/domain/enums/care-log-unit.enum';

@InputType()
export class CreateCareLogEntryGraphQLDto {
  @Field(() => ID)
  @IsUUID()
  plantId!: string;

  @Field(() => CareLogActivityTypeEnum)
  @IsEnum(CareLogActivityTypeEnum)
  activityType!: string;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  performedAt?: Date;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  notes?: string;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  quantity?: number;

  @Field(() => CareLogUnitEnum, { nullable: true })
  @IsOptional()
  @IsEnum(CareLogUnitEnum)
  unit?: string;
}
