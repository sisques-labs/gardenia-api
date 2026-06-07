import { Field, ID, InputType, Int } from '@nestjs/graphql';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

@InputType('ScheduleTaskInput')
export class ScheduleTaskGraphQLDto {
  @Field(() => ID)
  @IsUUID()
  templateId!: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  payload?: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  priority?: number;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @Min(0)
  @IsOptional()
  delayMs?: number;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  cronExpression?: string;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxRuns?: number;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  idempotencyKey?: string;

  @Field(() => String, { nullable: true, description: 'Target entity type (e.g. plant, planting-spot, space)' })
  @IsString()
  @IsOptional()
  targetType?: string;

  @Field(() => ID, { nullable: true, description: 'UUID of the target entity' })
  @IsUUID()
  @IsOptional()
  targetId?: string;

  @Field(() => String, { nullable: true, description: 'ISO 8601 datetime — do not execute before this date' })
  @IsDateString()
  @IsOptional()
  validFrom?: string;

  @Field(() => String, { nullable: true, description: 'ISO 8601 datetime — stop recurring runs after this date' })
  @IsDateString()
  @IsOptional()
  validUntil?: string;
}
