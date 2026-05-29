import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseDatabaseRepository,
  Criteria,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { SpaceMembership } from '@contexts/spaces/domain/entities/space-membership.entity';
import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';
import { IMembershipReadRepository } from '@contexts/spaces/domain/repositories/read/membership-read.repository';
import { ISpaceReadRepository } from '@contexts/spaces/domain/repositories/read/space-read.repository';
import { SpaceViewModel } from '@contexts/spaces/domain/view-models/space.view-model';
import { SpaceMembershipEntity } from '../entities/space-membership.entity';
import { SpaceEntity } from '../entities/space.entity';
import { SpaceMembershipTypeOrmMapper } from '../mappers/space-membership-typeorm.mapper';
import { SpaceTypeOrmMapper } from '../mappers/space-typeorm.mapper';

@Injectable()
export class SpaceTypeOrmReadRepository
  extends BaseDatabaseRepository
  implements ISpaceReadRepository, IMembershipReadRepository
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

    const where =
      criteria.filters?.reduce(
        (acc, f) => ({ ...acc, [f.field]: f.value }),
        {},
      ) ?? {};

    const [entities, total] = await this.spaceRepo.findAndCount({
      where,
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

  async findByUserAndSpace(
    userId: string,
    spaceId: string,
  ): Promise<SpaceMembership | null> {
    const entity = await this.membershipRepo.findOne({
      where: { userId, spaceId },
    });
    return entity ? this.membershipMapper.toDomain(entity) : null;
  }

  async countByOwner(userId: string): Promise<number> {
    return this.membershipRepo.count({
      where: { userId, role: MembershipRoleEnum.OWNER },
    });
  }
}
