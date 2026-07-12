import { BridgeIdValueObject } from '@contexts/nodes/domain/value-objects/bridge-id/bridge-id.value-object';

export interface BridgeFindByIdQueryInput {
  bridgeId: string;
}

export class BridgeFindByIdQuery {
  public readonly bridgeId: BridgeIdValueObject;

  constructor(input: BridgeFindByIdQueryInput) {
    this.bridgeId = new BridgeIdValueObject(input.bridgeId);
  }
}
