import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  applyCriteriaToQueryBuilder,
  BaseDatabaseRepository,
  Criteria,
  PaginatedResult,
  SortDirection,
} from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { IPlantingSpotReadRepository } from '@contexts/planting-spots/domain/repositories/read/planting-spot-read.repository';
import { PlantingSpotViewModel } from '@contexts/planting-spots/domain/view-models/planting-spot.view-model';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { createTenantRepository } from '@shared/tenant-repository/create-tenant-repository.factory';
import { PlantingSpotTypeOrmEntity } from '../entities/planting-spot.entity';
import { PlantingSpotTypeOrmMapper } from '../mappers/planting-spot-typeorm.mapper';

const ALIAS = 'spot';

@Injectable()
export class PlantingSpotTypeOrmReadRepository
  extends BaseDatabaseRepository
  implements IPlantingSpotReadRepository
{
  private readonly repository: Repository<PlantingSpotTypeOrmEntity>;

  constructor(
    @InjectRepository(PlantingSpotTypeOrmEntity)
    rawRepo: Repository<PlantingSpotTypeOrmEntity>,
    private readonly mapper: PlantingSpotTypeOrmMapper,
    private readonly spaceContext: SpaceContext,
  ) {
    super();
    this.repository = createTenantRepository(rawRepo, spaceContext);
  }

  async findById(id: string): Promise<PlantingSpotViewModel | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.mapper.toViewModel(entity) : null;
  }

  async findByCriteria(
    criteria: Criteria,
  ): Promise<PaginatedResult<PlantingSpotViewModel>> {
    const { page, limit, skip } = await this.calculatePagination(criteria);

    // createQueryBuilder bypasses createTenantRepository's find/findOne
    // proxy interception, so the space scope must be applied explicitly here.
    const qb = this.repository
      .createQueryBuilder(ALIAS)
      .where(`${ALIAS}.spaceId = :spaceId`, {
        spaceId: this.spaceContext.require(),
      });

    applyCriteriaToQueryBuilder(qb, criteria, {
      alias: ALIAS,
      defaultSort: { field: 'createdAt', direction: SortDirection.DESC },
    });

    const [entities, total] = await qb.skip(skip).take(limit).getManyAndCount();

    const items = entities.map((e) => this.mapper.toViewModel(e));
    return new PaginatedResult(items, total, page, limit);
  }

  async save(_viewModel: PlantingSpotViewModel): Promise<void> {}

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
