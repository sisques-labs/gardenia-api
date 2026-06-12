import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseDatabaseRepository,
  Criteria,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import {
  CareLogSpaceCriteria,
  ICareLogEntryReadRepository,
  Pagination,
} from '@contexts/care-log/domain/repositories/read/care-log-entry-read.repository';
import { CareLogEntryViewModel } from '@contexts/care-log/domain/view-models/care-log-entry.view-model';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { createTenantRepository } from '@shared/tenant-repository/create-tenant-repository.factory';
import { CareLogEntryTypeOrmEntity } from '../entities/care-log-entry.entity';
import { CareLogEntryTypeOrmMapper } from '../mappers/care-log-entry-typeorm.mapper';

@Injectable()
export class CareLogEntryTypeOrmReadRepository
  extends BaseDatabaseRepository
  implements ICareLogEntryReadRepository
{
  private readonly repository: Repository<CareLogEntryTypeOrmEntity>;

  constructor(
    @InjectRepository(CareLogEntryTypeOrmEntity)
    rawRepo: Repository<CareLogEntryTypeOrmEntity>,
    private readonly mapper: CareLogEntryTypeOrmMapper,
    private readonly spaceContext: SpaceContext,
  ) {
    super();
    this.repository = createTenantRepository(rawRepo, spaceContext);
  }

  async findByCriteria(
    _criteria: Criteria,
  ): Promise<PaginatedResult<CareLogEntryViewModel>> {
    throw new Error('Method not implemented.');
  }

  async findById(id: string): Promise<CareLogEntryViewModel | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.mapper.toViewModel(entity) : null;
  }

  async findByPlant(
    plantId: string,
    pagination: Pagination,
  ): Promise<CareLogEntryViewModel[]> {
    const skip = (pagination.page - 1) * pagination.limit;
    const entities = await this.repository.find({
      where: { plantId },
      order: { performedAt: 'DESC' },
      skip,
      take: pagination.limit,
    });
    return entities.map((e) => this.mapper.toViewModel(e));
  }

  async findBySpace(
    criteria: CareLogSpaceCriteria,
  ): Promise<CareLogEntryViewModel[]> {
    const skip = (criteria.page - 1) * criteria.limit;
    const qb = this.repository
      .createQueryBuilder('entry')
      .orderBy('entry.performedAt', 'DESC')
      .skip(skip)
      .take(criteria.limit);

    if (criteria.activityTypes?.length) {
      qb.andWhere('entry.activityType IN (:...activityTypes)', {
        activityTypes: criteria.activityTypes,
      });
    }

    if (criteria.fromDate) {
      qb.andWhere('entry.performedAt >= :fromDate', {
        fromDate: criteria.fromDate,
      });
    }

    if (criteria.toDate) {
      qb.andWhere('entry.performedAt <= :toDate', {
        toDate: criteria.toDate,
      });
    }

    const entities = await qb.getMany();
    return entities.map((e) => this.mapper.toViewModel(e));
  }

  async findLastByType(
    plantId: string,
    activityType: string,
  ): Promise<CareLogEntryViewModel | null> {
    const entity = await this.repository.findOne({
      where: { plantId, activityType },
      order: { performedAt: 'DESC' },
    });
    return entity ? this.mapper.toViewModel(entity) : null;
  }

  async save(_viewModel: CareLogEntryViewModel): Promise<void> {}

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
