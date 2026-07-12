import { Injectable } from '@nestjs/common';

import { NodeCommandAck } from '@contexts/nodes/domain/records/node-command-ack.record';
import { NodeCommandAckTypeOrmEntity } from '../entities/node-command-ack.entity';

@Injectable()
export class NodeCommandAckTypeOrmMapper {
  public toEntity(ack: NodeCommandAck): NodeCommandAckTypeOrmEntity {
    const entity = new NodeCommandAckTypeOrmEntity();

    entity.id = ack.id;
    entity.commandId = ack.commandId;
    entity.nodeId = ack.nodeId;
    entity.spaceId = ack.spaceId;
    entity.result = ack.result;
    entity.receivedAt = ack.receivedAt;

    return entity;
  }
}
