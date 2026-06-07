import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class ScheduleTaskRestDto {
  @ApiProperty()
  @IsUUID()
  templateId!: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  payload?: Record<string, unknown>;

  @ApiPropertyOptional({ minimum: 1, maximum: 10 })
  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  priority?: number;

  @ApiPropertyOptional({ description: 'Delay in milliseconds before execution' })
  @IsInt()
  @Min(0)
  @IsOptional()
  delayMs?: number;

  @ApiPropertyOptional({ description: '5-field cron expression' })
  @IsString()
  @IsOptional()
  cronExpression?: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @ApiPropertyOptional({ description: 'Max times to run (null = infinite)' })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxRuns?: number;

  @ApiPropertyOptional({ description: 'Idempotency key to prevent duplicate scheduling' })
  @IsString()
  @IsOptional()
  idempotencyKey?: string;
}
