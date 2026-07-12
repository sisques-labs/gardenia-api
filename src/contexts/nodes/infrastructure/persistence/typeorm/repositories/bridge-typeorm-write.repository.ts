import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Criteria, PaginatedResult } from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { BridgeAggregate } from '@contexts/nodes/domain/aggregates/bridge.aggregate';
import { IBridgeWriteRepository } from '@contexts/nodes/domain/repositories/write/bridge-write.repository';
import { BridgeTypeOrmEntity } from '../entities/bridge.entity';
import { BridgeTypeOrmMapper } from '../mappers/bridge-typeorm.mapper';

/** Not tenant-wrapped — see `BridgeTypeOrmReadRepository` for rationale. */
@Injectable()
export class BridgeTypeOrmWriteRepository implements IBridgeWriteRepository {
  constructor(
    private readonly mapper: BridgeTypeOrmMapper,
    @InjectRepository(BridgeTypeOrmEntity)
    private readonly repository: Repository<BridgeTypeOrmEntity>,
  ) {}

  async findById(id: string): Promise<BridgeAggregate | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.mapper.toAggregate(entity) : null;
  }

  async findByCriteria(
    _criteria: Criteria,
  ): Promise<PaginatedResult<BridgeAggregate>> {
    throw new Error('Method not implemented.');
  }

  async save(aggregate: BridgeAggregate): Promise<BridgeAggregate> {
    const entity = this.mapper.toEntity(aggregate);
    await this.repository.save(entity);
    return this.mapper.toAggregate(entity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
