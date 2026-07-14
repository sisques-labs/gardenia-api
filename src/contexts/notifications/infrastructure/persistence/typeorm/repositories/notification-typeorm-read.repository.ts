import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseDatabaseRepository,
  Criteria,
  PaginatedResult,
  SortDirection,
} from '@sisques-labs/nestjs-kit';
import { applyCriteriaToQueryBuilder } from '@sisques-labs/nestjs-kit/typeorm';
import { IsNull, Repository } from 'typeorm';

import { NotificationStatusEnum } from '@contexts/notifications/domain/enums/notification-status.enum';
import { INotificationReadRepository } from '@contexts/notifications/domain/repositories/read/notification-read.repository';
import { NotificationViewModel } from '@contexts/notifications/domain/view-models/notification.view-model';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { createTenantRepository } from '@shared/tenant-repository/create-tenant-repository.factory';
import { NotificationTypeOrmEntity } from '../entities/notification.entity';
import { NotificationTypeOrmMapper } from '../mappers/notification-typeorm.mapper';

const ALIAS = 'notification';

@Injectable()
export class NotificationTypeOrmReadRepository
  extends BaseDatabaseRepository
  implements INotificationReadRepository
{
  private readonly repository: Repository<NotificationTypeOrmEntity>;

  constructor(
    @InjectRepository(NotificationTypeOrmEntity)
    rawRepo: Repository<NotificationTypeOrmEntity>,
    private readonly mapper: NotificationTypeOrmMapper,
    private readonly spaceContext: SpaceContext,
  ) {
    super();
    this.repository = createTenantRepository(rawRepo, spaceContext);
  }

  async findById(id: string): Promise<NotificationViewModel | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.mapper.toViewModel(entity) : null;
  }

  async findByCriteria(
    userId: string,
    criteria: Criteria,
  ): Promise<PaginatedResult<NotificationViewModel>> {
    const { page, limit, skip } = await this.calculatePagination(criteria);

    const qb = this.repository.createQueryBuilder(ALIAS);
    qb.where(`${ALIAS}.space_id = :spaceId`, {
      spaceId: this.spaceContext.require(),
    }).andWhere(`${ALIAS}.user_id = :userId`, { userId });

    applyCriteriaToQueryBuilder(qb, criteria, {
      alias: ALIAS,
      defaultSort: { field: 'createdAt', direction: SortDirection.DESC },
    });

    qb.skip(skip).take(limit);

    const [entities, total] = await qb.getManyAndCount();
    const items = entities.map((e) => this.mapper.toViewModel(e));

    return new PaginatedResult(items, total, page, limit);
  }

  async countUnread(userId: string): Promise<number> {
    return this.repository.count({
      where: {
        userId,
        status: NotificationStatusEnum.UNREAD,
      },
    });
  }

  async findOpenByDedupeKey(
    dedupeKey: string,
  ): Promise<NotificationViewModel[]> {
    const entities = await this.repository.find({
      where: { dedupeKey, resolvedAt: IsNull() },
    });
    return entities.map((entity) => this.mapper.toViewModel(entity));
  }

  async save(_vm: NotificationViewModel): Promise<void> {}

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
