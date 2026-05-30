import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseDatabaseRepository,
  Criteria,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { SpaceAggregate } from '@contexts/spaces/domain/aggregates/space.aggregate';
import { ISpaceWriteRepository } from '@contexts/spaces/domain/repositories/write/space-write.repository';
import { SpaceMembershipEntity } from '../entities/space-membership.entity';
import { SpaceEntity } from '../entities/space.entity';
import { SpaceMembershipTypeOrmMapper } from '../mappers/space-membership-typeorm.mapper';
import { SpaceTypeOrmMapper } from '../mappers/space-typeorm.mapper';

@Injectable()
export class SpaceTypeOrmWriteRepository
  extends BaseDatabaseRepository
  implements ISpaceWriteRepository
{
  constructor(
    @InjectRepository(SpaceEntity)
    private readonly spaceRepo: Repository<SpaceEntity>,
    @InjectRepository(SpaceMembershipEntity)
    private readonly membershipRepo: Repository<SpaceMembershipEntity>,
    private readonly spaceMapper: SpaceTypeOrmMapper,
    private readonly membershipMapper: SpaceMembershipTypeOrmMapper,
  ) {
    super();
  }

  async save(space: SpaceAggregate): Promise<SpaceAggregate> {
    const spaceEntity = this.spaceMapper.toPersistence(space) as SpaceEntity;
    const savedEntity = await this.spaceRepo.save(spaceEntity);

    for (const membership of space.memberships) {
      const membershipEntity = this.membershipMapper.toPersistence(membership);
      await this.membershipRepo.save(membershipEntity);
    }

    return this.spaceMapper.toDomain(savedEntity);
  }

  async findById(id: string): Promise<SpaceAggregate | null> {
    const entity = await this.spaceRepo.findOne({ where: { id } });
    return entity ? this.spaceMapper.toDomain(entity) : null;
  }

  async findByCriteria(
    criteria: Criteria,
  ): Promise<PaginatedResult<SpaceAggregate>> {
    const { page, limit, skip } = await this.calculatePagination(criteria);

    const [entities, total] = await this.spaceRepo.findAndCount({
      skip,
      take: limit,
      order: criteria.sorts?.reduce(
        (acc, s) => ({ ...acc, [s.field]: s.direction }),
        {},
      ),
    });

    const items = entities.map((e) => this.spaceMapper.toDomain(e));
    return new PaginatedResult(items, total, page, limit);
  }

  async delete(id: string): Promise<void> {
    await this.spaceRepo.delete(id);
  }
}
