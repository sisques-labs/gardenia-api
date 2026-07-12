import { ApiProperty } from '@nestjs/swagger';

export class BridgeRestResponseDto {
  @ApiProperty()
  bridgeId!: string;

  @ApiProperty({
    nullable: true,
    description: 'Pairing code — null when the bridge is already claimed',
  })
  pairingCode!: string | null;
}
