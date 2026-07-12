import { BridgeIdValueObject } from '@contexts/nodes/domain/value-objects/bridge-id/bridge-id.value-object';

export interface ClaimBridgeCommandInput {
  bridgeId: string;
  pairingCode: string;
  spaceId: string;
}

export class ClaimBridgeCommand {
  public readonly bridgeId: BridgeIdValueObject;
  public readonly pairingCode: string;
  public readonly spaceId: string;

  constructor(input: ClaimBridgeCommandInput) {
    this.bridgeId = new BridgeIdValueObject(input.bridgeId);
    this.pairingCode = input.pairingCode;
    this.spaceId = input.spaceId;
  }
}
