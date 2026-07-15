import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class WaterPlantDto {
  @ApiProperty({ description: 'UUID of the plant to water' })
  @IsUUID()
  @IsNotEmpty()
  plantId!: string;

  @ApiPropertyOptional({
    example: '2026-06-27T08:00:00.000Z',
    description: 'When the plant was watered (defaults to now)',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  performedAt?: Date;
}
