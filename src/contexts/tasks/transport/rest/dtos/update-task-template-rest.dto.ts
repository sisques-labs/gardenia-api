import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateTaskTemplateRestDto {
  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string | null;

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  handlerKey?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 10 })
  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  defaultPriority?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 10 })
  @IsInt()
  @Min(0)
  @Max(10)
  @IsOptional()
  defaultRetryCount?: number;

  @ApiPropertyOptional({ enum: ['exponential', 'linear', 'fixed'] })
  @IsString()
  @IsOptional()
  defaultBackoffStrategy?: string;

  @ApiPropertyOptional({ minimum: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  defaultTimeoutMs?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100 })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  maxConcurrency?: number;
}
