import { Field, InputType, Int } from '@nestjs/graphql';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

import { CareLogActivityTypeEnum } from '@contexts/care-log/domain/enums/care-log-activity-type.enum';

@InputType()
export class CareLogFindBySpaceGraphQLDto {
  @Field(() => [CareLogActivityTypeEnum], { nullable: true })
  @IsOptional()
  @IsEnum(CareLogActivityTypeEnum, { each: true })
  activityTypes?: string[];

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fromDate?: Date;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  toDate?: Date;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @IsPositive()
  page?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Max(100)
  limit?: number;
}
