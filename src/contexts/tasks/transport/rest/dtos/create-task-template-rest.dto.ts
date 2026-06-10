import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateTaskTemplateRestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string | null;

  @ApiPropertyOptional({
    description:
      'Handler key for automation scheduling. Null for informative-only templates.',
  })
  @IsString()
  @IsOptional()
  handlerKey?: string | null;

  @ApiPropertyOptional({ default: 5, minimum: 1, maximum: 10 })
  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  defaultPriority?: number;

  @ApiPropertyOptional({ default: 3, minimum: 0, maximum: 10 })
  @IsInt()
  @Min(0)
  @Max(10)
  @IsOptional()
  defaultRetryCount?: number;

  @ApiPropertyOptional({
    default: 'exponential',
    enum: ['exponential', 'linear', 'fixed'],
  })
  @IsString()
  @IsOptional()
  defaultBackoffStrategy?: string;

  @ApiPropertyOptional({ default: 30000, minimum: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  defaultTimeoutMs?: number;

  @ApiPropertyOptional({ default: 5, minimum: 1, maximum: 100 })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  maxConcurrency?: number;

  @ApiPropertyOptional({
    description: '5-field cron expression applied to tasks by default',
  })
  @IsString()
  @IsOptional()
  defaultCronExpression?: string | null;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  defaultIsRecurring?: boolean;
}
