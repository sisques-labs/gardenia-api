import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Criteria, PaginatedResult } from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { NodeAggregate } from '@contexts/nodes/domain/aggregates/node.aggregate';
import { INodeWriteRepository } from '@contexts/nodes/domain/repositories/write/node-write.repository';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { createTenantRepository } from '@shared/tenant-repository/create-tenant-repository.factory';
import { NodeTypeOrmEntity } from '../entities/node.entity';
import { NodeTypeOrmMapper } from '../mappers/node-typeorm.mapper';

@Injectable()
export class NodeTypeOrmWriteRepository implements INodeWriteRepository {
  private readonly repository: Repository<NodeTypeOrmEntity>;

  constructor(
    private readonly mapper: NodeTypeOrmMapper,
    @InjectRepository(NodeTypeOrmEntity)
    rawRepo: Repository<NodeTypeOrmEntity>,
    private readonly spaceContext: SpaceContext,
  ) {
    this.repository = createTenantRepository(rawRepo, spaceContext);
  }

  async findById(id: string): Promise<NodeAggregate | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.mapper.toAggregate(entity) : null;
  }

  async findByCriteria(
    _criteria: Criteria,
  ): Promise<PaginatedResult<NodeAggregate>> {
    throw new Error('Method not implemented.');
  }

  async save(aggregate: NodeAggregate): Promise<NodeAggregate> {
    const entity = this.mapper.toEntity(aggregate);
    await this.repository.save(entity);
    return this.mapper.toAggregate(entity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
