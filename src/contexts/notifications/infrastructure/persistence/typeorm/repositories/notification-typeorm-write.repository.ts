import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseDatabaseRepository,
  Criteria,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { NotificationAggregate } from '@contexts/notifications/domain/aggregates/notification.aggregate';
import { NotificationStatusEnum } from '@contexts/notifications/domain/enums/notification-status.enum';
import { INotificationWriteRepository } from '@contexts/notifications/domain/repositories/write/notification-write.repository';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { createTenantRepository } from '@shared/tenant-repository/create-tenant-repository.factory';
import { NotificationTypeOrmEntity } from '../entities/notification.entity';
import { NotificationTypeOrmMapper } from '../mappers/notification-typeorm.mapper';

@Injectable()
export class NotificationTypeOrmWriteRepository
  extends BaseDatabaseRepository
  implements INotificationWriteRepository
{
  private readonly repository: Repository<NotificationTypeOrmEntity>;

  constructor(
    private readonly mapper: NotificationTypeOrmMapper,
    @InjectRepository(NotificationTypeOrmEntity)
    rawRepo: Repository<NotificationTypeOrmEntity>,
    private readonly spaceContext: SpaceContext,
  ) {
    super();
    this.repository = createTenantRepository(rawRepo, spaceContext);
  }

  async save(aggregate: NotificationAggregate): Promise<NotificationAggregate> {
    const entity = this.mapper.toPersistence(aggregate);
    const saved = await this.repository.save(entity);
    return this.mapper.toDomain(saved);
  }

  async saveMany(aggregates: NotificationAggregate[]): Promise<void> {
    if (aggregates.length === 0) return;
    const entities = aggregates.map((a) => this.mapper.toPersistence(a));
    await this.repository.save(entities);
  }

  async findById(id: string): Promise<NotificationAggregate | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findUnreadByUserId(userId: string): Promise<NotificationAggregate[]> {
    const entities = await this.repository.find({
      where: { userId, status: NotificationStatusEnum.UNREAD },
    });
    return entities.map((e) => this.mapper.toDomain(e));
  }

  async findByCriteria(
    _criteria: Criteria,
  ): Promise<PaginatedResult<NotificationAggregate>> {
    const [entities, total] = await this.repository.findAndCount();
    const items = entities.map((e) => this.mapper.toDomain(e));
    return new PaginatedResult(items, total, 1, 20);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
