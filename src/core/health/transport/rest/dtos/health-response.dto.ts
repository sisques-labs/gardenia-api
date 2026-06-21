import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty()
  status!: string;

  @ApiProperty()
  timestamp!: string;

  @ApiProperty({
    description: 'MQTT transport state',
    enum: ['disabled', 'up', 'down'],
  })
  mqtt!: 'disabled' | 'up' | 'down';
}
