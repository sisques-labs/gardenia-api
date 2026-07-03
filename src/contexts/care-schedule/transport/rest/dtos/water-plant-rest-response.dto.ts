import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WaterPlantRestResponseDto {
  @ApiProperty({ description: 'UUID of the watered plant' })
  plantId!: string;

  @ApiProperty({
    example: 'SCHEDULE_COMPLETED',
    enum: ['SCHEDULE_COMPLETED', 'CARE_LOG_CREATED'],
    description:
      'Whether an active care schedule was completed or an ad-hoc care-log entry was created',
  })
  mode!: 'SCHEDULE_COMPLETED' | 'CARE_LOG_CREATED';

  @ApiPropertyOptional({
    description:
      'UUID of the completed care schedule, when mode is SCHEDULE_COMPLETED',
  })
  careScheduleId?: string;
}
