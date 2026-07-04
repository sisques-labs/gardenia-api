import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';

export class WaterPlantingSpotDto {
  @ApiPropertyOptional({
    example: '2026-06-27T08:00:00.000Z',
    description: 'When the plants were watered (defaults to now)',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  performedAt?: Date;
}
