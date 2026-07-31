import { ApiProperty } from '@nestjs/swagger';

export class PushSubscriptionRestResponseDto {
  @ApiProperty({ description: 'UUID of the push subscription' })
  id!: string;
}
