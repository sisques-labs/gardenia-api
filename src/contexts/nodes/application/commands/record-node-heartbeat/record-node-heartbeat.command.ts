import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { NodeIdValueObject } from '@contexts/nodes/domain/value-objects/node-id/node-id.value-object';

export interface RecordNodeHeartbeatCommandInput {
  nodeId: string;
  bridgeId: string;
  seenAt: Date;
}

/** Internal command — dispatched only by the Kafka consumer bootstrap. */
export class RecordNodeHeartbeatCommand {
  public readonly nodeId: NodeIdValueObject;
  public readonly bridgeId: UuidValueObject;
  public readonly seenAt: Date;

  constructor(input: RecordNodeHeartbeatCommandInput) {
    this.nodeId = new NodeIdValueObject(input.nodeId);
    this.bridgeId = new UuidValueObject(input.bridgeId);
    this.seenAt = input.seenAt;
  }
}
