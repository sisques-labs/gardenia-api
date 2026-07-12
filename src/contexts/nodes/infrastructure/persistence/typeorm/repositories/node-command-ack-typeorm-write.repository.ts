import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { INodeCommandAckWriteRepository } from '@contexts/nodes/domain/repositories/write/node-command-ack-write.repository';
import { NodeCommandAck } from '@contexts/nodes/domain/records/node-command-ack.record';
import { NodeCommandAckTypeOrmEntity } from '../entities/node-command-ack.entity';
import { NodeCommandAckTypeOrmMapper } from '../mappers/node-command-ack-typeorm.mapper';

/** Plain, unwrapped repository — same reasoning as the telemetry write repo. */
@Injectable()
export class NodeCommandAckTypeOrmWriteRepository implements INodeCommandAckWriteRepository {
  constructor(
    @InjectRepository(NodeCommandAckTypeOrmEntity)
    private readonly repository: Repository<NodeCommandAckTypeOrmEntity>,
    private readonly mapper: NodeCommandAckTypeOrmMapper,
  ) {}

  async insert(ack: NodeCommandAck): Promise<void> {
    await this.repository.insert(this.mapper.toEntity(ack));
  }
}
