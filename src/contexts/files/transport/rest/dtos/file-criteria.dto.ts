import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

import { FileMimeTypeEnum } from '@contexts/files/domain/enums/file-mime-type.enum';

export class FileCriteriaDto {
  @ApiPropertyOptional({
    enum: FileMimeTypeEnum,
    description: 'Filter by exact MIME type',
  })
  @IsOptional()
  @IsEnum(FileMimeTypeEnum)
  mimeType?: FileMimeTypeEnum;

  @ApiPropertyOptional({ description: 'Filter by partial filename match' })
  @IsOptional()
  @IsString()
  filename?: string;

  @ApiPropertyOptional({ example: 1, description: '1-based page number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, description: 'Items per page (max 100)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
