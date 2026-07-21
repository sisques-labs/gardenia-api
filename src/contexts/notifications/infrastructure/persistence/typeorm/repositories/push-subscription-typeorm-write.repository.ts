import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseDatabaseRepository,
  Criteria,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { PushSubscriptionAggregate } from '@contexts/notifications/domain/aggregates/push-subscription.aggregate';
import { IPushSubscriptionWriteRepository } from '@contexts/notifications/domain/repositories/write/push-subscription-write.repository';

import { PushSubscriptionTypeOrmEntity } from '../entities/push-subscription.entity';
import { PushSubscriptionTypeOrmMapper } from '../mappers/push-subscription-typeorm.mapper';

@Injectable()
export class PushSubscriptionTypeOrmWriteRepository
  extends BaseDatabaseRepository
  implements IPushSubscriptionWriteRepository
{
  constructor(
    private readonly mapper: PushSubscriptionTypeOrmMapper,
    @InjectRepository(PushSubscriptionTypeOrmEntity)
    private readonly repository: Repository<PushSubscriptionTypeOrmEntity>,
  ) {
    super();
  }

  async save(
    aggregate: PushSubscriptionAggregate,
  ): Promise<PushSubscriptionAggregate> {
    const entity = this.mapper.toPersistence(aggregate);
    const saved = await this.repository.save(entity);
    return this.mapper.toDomain(saved);
  }

  async findById(id: string): Promise<PushSubscriptionAggregate | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findByEndpoint(
    endpoint: string,
  ): Promise<PushSubscriptionAggregate | null> {
    const entity = await this.repository.findOne({ where: { endpoint } });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findByUserId(userId: string): Promise<PushSubscriptionAggregate[]> {
    const entities = await this.repository.find({ where: { userId } });
    return entities.map((e) => this.mapper.toDomain(e));
  }

  async findByCriteria(
    _criteria: Criteria,
  ): Promise<PaginatedResult<PushSubscriptionAggregate>> {
    const [entities, total] = await this.repository.findAndCount();
    const items = entities.map((e) => this.mapper.toDomain(e));
    return new PaginatedResult(items, total, 1, 20);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
