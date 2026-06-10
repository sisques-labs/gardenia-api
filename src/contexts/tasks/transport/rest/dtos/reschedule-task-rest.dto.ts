import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class RescheduleTaskRestDto {
  @ApiProperty()
  @IsDateString()
  scheduledAt!: string;
}
