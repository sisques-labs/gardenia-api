import { NodeIdValueObject } from '@contexts/nodes/domain/value-objects/node-id/node-id.value-object';

export interface SendNodeCommandCommandInput {
  nodeId: string;
  commandType: string;
  payload: unknown;
}

export class SendNodeCommandCommand {
  public readonly nodeId: NodeIdValueObject;
  public readonly commandType: string;
  public readonly payload: unknown;

  constructor(input: SendNodeCommandCommandInput) {
    this.nodeId = new NodeIdValueObject(input.nodeId);
    this.commandType = input.commandType;
    this.payload = input.payload;
  }
}
