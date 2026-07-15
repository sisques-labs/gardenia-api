import { ApiProperty } from '@nestjs/swagger';

export class NotificationRestResponseDto {
  @ApiProperty({ description: 'UUID of the notification' })
  id!: string;

  @ApiProperty({
    example: 'CARE_SCHEDULE_DUE',
    description: 'Notification type',
  })
  type!: string;

  @ApiProperty({
    example: 'CARE_SCHEDULE',
    description: 'Referenced entity kind',
  })
  referenceType!: string;

  @ApiProperty({ description: 'UUID of the referenced entity' })
  referenceId!: string;

  @ApiProperty({
    description: 'Display-ready snapshot data, shape depends on type',
  })
  payload!: Record<string, unknown>;

  @ApiProperty({ example: 'UNREAD', description: 'Read state' })
  status!: string;

  @ApiProperty({
    description: 'When the recipient read it, if ever',
    nullable: true,
  })
  readAt!: Date | null;

  @ApiProperty({
    description: 'When the underlying condition cleared, if ever',
    nullable: true,
  })
  resolvedAt!: Date | null;

  @ApiProperty({ description: 'UUID of the recipient' })
  userId!: string;

  @ApiProperty({ description: 'UUID of the space' })
  spaceId!: string;

  @ApiProperty({ description: 'When the record was created' })
  createdAt!: Date;

  @ApiProperty({ description: 'When the record was last updated' })
  updatedAt!: Date;
}
