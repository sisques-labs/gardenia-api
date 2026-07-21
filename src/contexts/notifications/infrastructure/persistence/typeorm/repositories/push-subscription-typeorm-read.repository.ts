import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseDatabaseRepository,
  Criteria,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { IPushSubscriptionReadRepository } from '@contexts/notifications/domain/repositories/read/push-subscription-read.repository';
import { PushSubscriptionViewModel } from '@contexts/notifications/domain/view-models/push-subscription.view-model';

import { PushSubscriptionTypeOrmEntity } from '../entities/push-subscription.entity';
import { PushSubscriptionTypeOrmMapper } from '../mappers/push-subscription-typeorm.mapper';

@Injectable()
export class PushSubscriptionTypeOrmReadRepository
  extends BaseDatabaseRepository
  implements IPushSubscriptionReadRepository
{
  constructor(
    @InjectRepository(PushSubscriptionTypeOrmEntity)
    private readonly repository: Repository<PushSubscriptionTypeOrmEntity>,
    private readonly mapper: PushSubscriptionTypeOrmMapper,
  ) {
    super();
  }

  async findById(id: string): Promise<PushSubscriptionViewModel | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.mapper.toViewModel(entity) : null;
  }

  async findByCriteria(
    _criteria: Criteria,
  ): Promise<PaginatedResult<PushSubscriptionViewModel>> {
    const [entities, total] = await this.repository.findAndCount();
    const items = entities.map((e) => this.mapper.toViewModel(e));
    return new PaginatedResult(items, total, 1, 20);
  }

  async save(_vm: PushSubscriptionViewModel): Promise<void> {}

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
