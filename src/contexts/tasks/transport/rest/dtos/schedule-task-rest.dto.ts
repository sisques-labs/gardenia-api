import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
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

  @ApiPropertyOptional({ description: 'Target entity type (e.g. plant, planting-spot, space)' })
  @IsString()
  @IsOptional()
  targetType?: string;

  @ApiPropertyOptional({ description: 'UUID of the target entity' })
  @IsUUID()
  @IsOptional()
  targetId?: string;

  @ApiPropertyOptional({ description: 'ISO 8601 — do not execute before this date' })
  @IsDateString()
  @IsOptional()
  validFrom?: string;

  @ApiPropertyOptional({ description: 'ISO 8601 — stop recurring runs after this date' })
  @IsDateString()
  @IsOptional()
  validUntil?: string;
}
