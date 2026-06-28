import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';

export class CompleteCareScheduleDto {
  @ApiPropertyOptional({
    example: '2026-06-27T08:00:00.000Z',
    description: 'When the care was completed (defaults to now)',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  completedAt?: Date;
}
