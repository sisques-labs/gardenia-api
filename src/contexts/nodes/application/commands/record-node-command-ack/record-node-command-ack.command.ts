import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { NodeIdValueObject } from '@contexts/nodes/domain/value-objects/node-id/node-id.value-object';

export interface RecordNodeCommandAckCommandInput {
  commandId: string | null;
  nodeId: string;
  bridgeId: string;
  result: string;
  receivedAt: Date;
}

/** Internal command — dispatched only by the Kafka consumer bootstrap. */
export class RecordNodeCommandAckCommand {
  public readonly commandId: string | null;
  public readonly nodeId: NodeIdValueObject;
  public readonly bridgeId: UuidValueObject;
  public readonly result: string;
  public readonly receivedAt: Date;

  constructor(input: RecordNodeCommandAckCommandInput) {
    this.commandId = input.commandId;
    this.nodeId = new NodeIdValueObject(input.nodeId);
    this.bridgeId = new UuidValueObject(input.bridgeId);
    this.result = input.result;
    this.receivedAt = input.receivedAt;
  }
}
