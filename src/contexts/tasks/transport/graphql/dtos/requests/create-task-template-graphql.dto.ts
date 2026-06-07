import { Field, InputType, Int } from '@nestjs/graphql';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

@InputType('CreateTaskTemplateInput')
export class CreateTaskTemplateGraphQLDto {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  description?: string | null;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  handlerKey!: string;

  @Field(() => Int, { nullable: true, defaultValue: 5 })
  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  defaultPriority?: number;

  @Field(() => Int, { nullable: true, defaultValue: 3 })
  @IsInt()
  @Min(0)
  @Max(10)
  @IsOptional()
  defaultRetryCount?: number;

  @Field(() => String, { nullable: true, defaultValue: 'exponential' })
  @IsString()
  @IsOptional()
  defaultBackoffStrategy?: string;

  @Field(() => Int, { nullable: true, defaultValue: 30000 })
  @IsInt()
  @Min(1)
  @IsOptional()
  defaultTimeoutMs?: number;

  @Field(() => Int, { nullable: true, defaultValue: 5 })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  maxConcurrency?: number;

  @Field(() => String, { nullable: true, description: '5-field cron expression applied to tasks by default' })
  @IsString()
  @IsOptional()
  defaultCronExpression?: string | null;

  @Field(() => Boolean, { nullable: true, defaultValue: false })
  @IsBoolean()
  @IsOptional()
  defaultIsRecurring?: boolean;
}
