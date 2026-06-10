import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class RescheduleUserTaskRestDto {
  @ApiProperty()
  @IsDateString()
  newScheduledDate!: string;
}
