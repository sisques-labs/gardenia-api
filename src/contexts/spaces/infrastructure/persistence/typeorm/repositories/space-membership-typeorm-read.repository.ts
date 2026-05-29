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
import { SpaceMembershipEntity } from '../entities/space-membership.entity';
import { SpaceMembershipTypeOrmMapper } from '../mappers/space-membership-typeorm.mapper';

@Injectable()
export class SpaceMembershipTypeOrmReadRepository
  extends BaseDatabaseRepository
  implements IMembershipReadRepository
{
  constructor(
    @InjectRepository(SpaceMembershipEntity)
    private readonly membershipRepo: Repository<SpaceMembershipEntity>,
    private readonly membershipMapper: SpaceMembershipTypeOrmMapper,
  ) {
    super();
  }

  async findById(id: string): Promise<SpaceMembership | null> {
    const entity = await this.membershipRepo.findOne({ where: { id } });
    return entity ? this.membershipMapper.toDomain(entity) : null;
  }

  async findByCriteria(
    criteria: Criteria,
  ): Promise<PaginatedResult<SpaceMembership>> {
    const { page, limit, skip } = await this.calculatePagination(criteria);

    const where =
      criteria.filters?.reduce(
        (acc, f) => ({ ...acc, [f.field]: f.value }),
        {},
      ) ?? {};

    const [entities, total] = await this.membershipRepo.findAndCount({
      where,
      skip,
      take: limit,
      order: criteria.sorts?.reduce(
        (acc, s) => ({ ...acc, [s.field]: s.direction }),
        {},
      ),
    });

    const items = entities.map((e) => this.membershipMapper.toDomain(e));
    return new PaginatedResult(items, total, page, limit);
  }

  async save(_membership: SpaceMembership): Promise<void> {
    // read-side projection — write side handles persistence
  }

  async delete(_id: string): Promise<void> {
    // read-side projection — write side handles persistence
  }

  async countByOwner(userId: string): Promise<number> {
    return this.membershipRepo.count({
      where: { userId, role: MembershipRoleEnum.OWNER },
    });
  }
}
