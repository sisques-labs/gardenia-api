import { BridgeIdValueObject } from '@contexts/nodes/domain/value-objects/bridge-id/bridge-id.value-object';

export interface BootstrapBridgeCommandInput {
  bridgeId: string;
}

export class BootstrapBridgeCommand {
  public readonly bridgeId: BridgeIdValueObject;

  constructor(input: BootstrapBridgeCommandInput) {
    this.bridgeId = new BridgeIdValueObject(input.bridgeId);
  }
}
