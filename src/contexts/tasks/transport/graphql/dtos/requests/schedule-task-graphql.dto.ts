import { Field, ID, InputType, Int } from '@nestjs/graphql';
import {
  IsBoolean,
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
}
