import { ApiProperty } from '@nestjs/swagger';

export class CareScheduleRestResponseDto {
  @ApiProperty({ description: 'UUID of the care schedule' })
  id!: string;

  @ApiProperty({ description: 'UUID of the plant being cared for' })
  plantId!: string;

  @ApiProperty({ example: 'WATERING', description: 'Activity type' })
  activityType!: string;

  @ApiProperty({ example: 3, description: 'Recurrence interval in days' })
  intervalDays!: number;

  @ApiProperty({ nullable: true, description: 'Dosage quantity' })
  quantity!: number | null;

  @ApiProperty({ nullable: true, example: 'ML', description: 'Dosage unit' })
  unit!: string | null;

  @ApiProperty({ nullable: true, description: 'Notes' })
  notes!: string | null;

  @ApiProperty({ description: 'When the next care is due' })
  nextDueAt!: Date;

  @ApiProperty({ nullable: true, description: 'When care was last completed' })
  lastCompletedAt!: Date | null;

  @ApiProperty({ description: 'Whether the schedule is active' })
  active!: boolean;

  @ApiProperty({ description: 'UUID of the creator' })
  userId!: string;

  @ApiProperty({ description: 'UUID of the space' })
  spaceId!: string;

  @ApiProperty({ description: 'When the record was created' })
  createdAt!: Date;

  @ApiProperty({ description: 'When the record was last updated' })
  updatedAt!: Date;
}
