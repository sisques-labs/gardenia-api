import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseDatabaseRepository,
  Criteria,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { ISpaceReadRepository } from '@contexts/spaces/domain/repositories/read/space-read.repository';
import { SpaceViewModel } from '@contexts/spaces/domain/view-models/space.view-model';
import { SpaceEntity } from '../entities/space.entity';
import { SpaceTypeOrmMapper } from '../mappers/space-typeorm.mapper';

@Injectable()
export class SpaceTypeOrmReadRepository
  extends BaseDatabaseRepository
  implements ISpaceReadRepository
{
  constructor(
    @InjectRepository(SpaceEntity)
    private readonly spaceRepo: Repository<SpaceEntity>,
    private readonly spaceMapper: SpaceTypeOrmMapper,
  ) {
    super();
  }

  async findById(id: string): Promise<SpaceViewModel | null> {
    const entity = await this.spaceRepo.findOne({ where: { id } });
    if (!entity) return null;
    const aggregate = this.spaceMapper.toDomain(entity);
    return new SpaceViewModel(aggregate.toPrimitives());
  }

  async findByCriteria(
    criteria: Criteria,
  ): Promise<PaginatedResult<SpaceViewModel>> {
    const { page, limit, skip } = await this.calculatePagination(criteria);

    const [entities, total] = await this.spaceRepo.findAndCount({
      skip,
      take: limit,
      order: criteria.sorts.reduce(
        (acc, s) => ({ ...acc, [s.field]: s.direction }),
        {},
      ),
    });

    const items = entities.map((e) => {
      const aggregate = this.spaceMapper.toDomain(e);
      return new SpaceViewModel(aggregate.toPrimitives());
    });

    return new PaginatedResult(items, total, page, limit);
  }

  async save(_viewModel: SpaceViewModel): Promise<void> {
    // read-side projection — write side handles persistence
  }

  async delete(_id: string): Promise<void> {
    // read-side projection — write side handles persistence
  }
}
