import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseDatabaseRepository,
  Criteria,
  PaginatedResult,
  SortDirection,
} from '@sisques-labs/nestjs-kit';
import { applyCriteriaToQueryBuilder } from '@sisques-labs/nestjs-kit/typeorm';
import { Repository } from 'typeorm';

import { IPlantPhotoReadRepository } from '@contexts/plant-photos/domain/repositories/read/plant-photo-read.repository';
import { PlantPhotoViewModel } from '@contexts/plant-photos/domain/view-models/plant-photo.view-model';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { createTenantRepository } from '@shared/tenant-repository/create-tenant-repository.factory';
import { PlantPhotoTypeOrmEntity } from '../entities/plant-photo.entity';
import { PlantPhotoTypeOrmMapper } from '../mappers/plant-photo-typeorm.mapper';

const ALIAS = 'photo';

@Injectable()
export class PlantPhotoTypeOrmReadRepository
  extends BaseDatabaseRepository
  implements IPlantPhotoReadRepository
{
  private readonly repository: Repository<PlantPhotoTypeOrmEntity>;

  constructor(
    @InjectRepository(PlantPhotoTypeOrmEntity)
    rawRepo: Repository<PlantPhotoTypeOrmEntity>,
    private readonly mapper: PlantPhotoTypeOrmMapper,
    private readonly spaceContext: SpaceContext,
  ) {
    super();
    this.repository = createTenantRepository(rawRepo, spaceContext);
  }

  async findById(id: string): Promise<PlantPhotoViewModel | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.mapper.toViewModel(entity) : null;
  }

  async findByCriteria(
    criteria: Criteria,
  ): Promise<PaginatedResult<PlantPhotoViewModel>> {
    const { page, limit, skip } = await this.calculatePagination(criteria);

    const qb = this.repository
      .createQueryBuilder(ALIAS)
      .where(`${ALIAS}.space_id = :spaceId`, {
        spaceId: this.spaceContext.require(),
      })
      .skip(skip)
      .take(limit);

    applyCriteriaToQueryBuilder(qb, criteria, {
      alias: ALIAS,
      defaultSort: { field: 'createdAt', direction: SortDirection.DESC },
    });

    const [entities, total] = await qb.getManyAndCount();
    const items = entities.map((e) => this.mapper.toViewModel(e));
    return new PaginatedResult(items, total, page, limit);
  }

  async save(_viewModel: PlantPhotoViewModel): Promise<void> {}

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
