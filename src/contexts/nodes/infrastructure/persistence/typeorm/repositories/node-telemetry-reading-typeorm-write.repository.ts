import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { INodeTelemetryReadingWriteRepository } from '@contexts/nodes/domain/repositories/write/node-telemetry-reading-write.repository';
import { NodeTelemetryReading } from '@contexts/nodes/domain/records/node-telemetry-reading.record';
import { NodeTelemetryReadingTypeOrmEntity } from '../entities/node-telemetry-reading.entity';
import { NodeTelemetryReadingTypeOrmMapper } from '../mappers/node-telemetry-reading-typeorm.mapper';

/**
 * Plain, unwrapped repository — `insert()` isn't intercepted by
 * `createTenantRepository` (only `findOne`/`find`/`findAndCount`/`save`/
 * `delete` are), and `spaceId` is already resolved and stamped onto the
 * record before this is called (see `FindOrCreateNodeService`), so no
 * tenant wrapping is needed. See design.md §5.4.
 */
@Injectable()
export class NodeTelemetryReadingTypeOrmWriteRepository implements INodeTelemetryReadingWriteRepository {
  constructor(
    @InjectRepository(NodeTelemetryReadingTypeOrmEntity)
    private readonly repository: Repository<NodeTelemetryReadingTypeOrmEntity>,
    private readonly mapper: NodeTelemetryReadingTypeOrmMapper,
  ) {}

  async insert(reading: NodeTelemetryReading): Promise<void> {
    await this.repository.insert(this.mapper.toEntity(reading));
  }
}
