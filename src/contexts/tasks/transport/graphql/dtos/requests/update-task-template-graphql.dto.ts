import { Field, ID, InputType, Int } from '@nestjs/graphql';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

@InputType('UpdateTaskTemplateInput')
export class UpdateTaskTemplateGraphQLDto {
  @Field(() => ID)
  @IsUUID()
  id!: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  description?: string | null;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  handlerKey?: string | null;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  defaultPriority?: number;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @Min(0)
  @Max(10)
  @IsOptional()
  defaultRetryCount?: number;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  defaultBackoffStrategy?: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @Min(1)
  @IsOptional()
  defaultTimeoutMs?: number;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  maxConcurrency?: number;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  defaultCronExpression?: string | null;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  defaultIsRecurring?: boolean;
}
