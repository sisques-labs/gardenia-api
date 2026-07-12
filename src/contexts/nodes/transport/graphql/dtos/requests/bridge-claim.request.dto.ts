import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

@InputType('BridgeClaimRequestDto')
export class BridgeClaimRequestDto {
  @Field(() => String, { description: 'The id of the bridge to claim' })
  @IsUUID()
  @IsNotEmpty()
  bridgeId!: string;

  @Field(() => String, { description: 'The pairing code shown by the bridge' })
  @IsString()
  @IsNotEmpty()
  pairingCode!: string;
}
