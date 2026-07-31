import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegisterPushSubscriptionDto {
  @ApiProperty({
    example: 'https://fcm.googleapis.com/fcm/send/abc123',
    description: "The browser's push subscription endpoint URL",
  })
  @IsString()
  @IsNotEmpty()
  endpoint!: string;

  @ApiProperty({ description: 'The p256dh key from the browser subscription' })
  @IsString()
  @IsNotEmpty()
  p256dh!: string;

  @ApiProperty({ description: 'The auth secret from the browser subscription' })
  @IsString()
  @IsNotEmpty()
  auth!: string;

  @ApiPropertyOptional({ example: 'Mozilla/5.0 ...' })
  @IsOptional()
  @IsString()
  userAgent?: string;
}
