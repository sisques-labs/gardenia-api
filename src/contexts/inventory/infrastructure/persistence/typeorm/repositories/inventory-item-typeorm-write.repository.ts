import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseDatabaseRepository,
  Criteria,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { InventoryItemAggregate } from '@contexts/inventory/domain/aggregates/inventory-item.aggregate';
import { IInventoryItemWriteRepository } from '@contexts/inventory/domain/repositories/write/inventory-item-write.repository';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { createTenantRepository } from '@shared/tenant-repository/create-tenant-repository.factory';
import { InventoryItemTypeOrmEntity } from '../entities/inventory-item.entity';
import { InventoryItemTypeOrmMapper } from '../mappers/inventory-item-typeorm.mapper';

@Injectable()
export class InventoryItemTypeOrmWriteRepository
  extends BaseDatabaseRepository
  implements IInventoryItemWriteRepository
{
  private readonly repository: Repository<InventoryItemTypeOrmEntity>;

  constructor(
    private readonly mapper: InventoryItemTypeOrmMapper,
    @InjectRepository(InventoryItemTypeOrmEntity)
    rawRepo: Repository<InventoryItemTypeOrmEntity>,
    private readonly spaceContext: SpaceContext,
  ) {
    super();
    this.repository = createTenantRepository(rawRepo, spaceContext);
  }

  async save(
    aggregate: InventoryItemAggregate,
  ): Promise<InventoryItemAggregate> {
    const entity = this.mapper.toPersistence(aggregate);
    const saved = await this.repository.save(entity);
    return this.mapper.toDomain(saved);
  }

  async findById(id: string): Promise<InventoryItemAggregate | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findByCriteria(
    _criteria: Criteria,
  ): Promise<PaginatedResult<InventoryItemAggregate>> {
    const [entities, total] = await this.repository.findAndCount();
    const items = entities.map((e) => this.mapper.toDomain(e));
    return new PaginatedResult(items, total, 1, 20);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
