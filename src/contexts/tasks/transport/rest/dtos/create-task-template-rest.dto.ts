import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
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

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  handlerKey!: string;

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

  @ApiPropertyOptional({ default: 'exponential', enum: ['exponential', 'linear', 'fixed'] })
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
}
