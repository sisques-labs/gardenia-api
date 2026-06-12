import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseDatabaseRepository,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import {
  HarvestCriteria,
  IHarvestReadRepository,
} from '@contexts/harvests/domain/repositories/read/harvest-read.repository';
import { HarvestViewModel } from '@contexts/harvests/domain/view-models/harvest.view-model';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { createTenantRepository } from '@shared/tenant-repository/create-tenant-repository.factory';
import { HarvestTypeOrmEntity } from '../entities/harvest.entity';
import { HarvestTypeOrmMapper } from '../mappers/harvest-typeorm.mapper';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@Injectable()
export class HarvestTypeOrmReadRepository
  extends BaseDatabaseRepository
  implements IHarvestReadRepository
{
  private readonly repository: Repository<HarvestTypeOrmEntity>;

  constructor(
    @InjectRepository(HarvestTypeOrmEntity)
    rawRepo: Repository<HarvestTypeOrmEntity>,
    private readonly mapper: HarvestTypeOrmMapper,
    private readonly spaceContext: SpaceContext,
  ) {
    super();
    this.repository = createTenantRepository(rawRepo, spaceContext);
  }

  async findById(id: string): Promise<HarvestViewModel | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.mapper.toViewModel(entity) : null;
  }

  async findByCriteria(
    criteria: HarvestCriteria,
  ): Promise<PaginatedResult<HarvestViewModel>> {
    const page = criteria.page ?? DEFAULT_PAGE;
    const limit = Math.min(criteria.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const skip = (page - 1) * limit;

    const qb = this.repository.createQueryBuilder('harvest');

    if (criteria.cropType) {
      qb.andWhere('LOWER(harvest.crop_type) LIKE :cropType', {
        cropType: `%${criteria.cropType.toLowerCase()}%`,
      });
    }

    if (criteria.unit) {
      qb.andWhere('harvest.unit = :unit', { unit: criteria.unit });
    }

    if (criteria.dateFrom) {
      qb.andWhere('harvest.harvested_at >= :dateFrom', {
        dateFrom: criteria.dateFrom,
      });
    }

    if (criteria.dateTo) {
      qb.andWhere('harvest.harvested_at <= :dateTo', {
        dateTo: criteria.dateTo,
      });
    }

    qb.skip(skip).take(limit);

    const [entities, total] = await qb.getManyAndCount();
    const items = entities.map((e) => this.mapper.toViewModel(e));

    return new PaginatedResult(items, total, page, limit);
  }

  async save(_vm: HarvestViewModel): Promise<void> {}

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
