import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class BootstrapBridgeDto {
  @ApiProperty({ description: 'Self-generated UUID identifying the bridge' })
  @IsUUID()
  @IsNotEmpty()
  bridgeId!: string;
}
