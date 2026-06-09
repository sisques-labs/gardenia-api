import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseDatabaseRepository,
  Criteria,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { InvitationCodeValueObject } from '@contexts/spaces/domain/value-objects/invitation-code/invitation-code.value-object';
import { ISpaceInvitationReadRepository } from '@contexts/spaces/domain/repositories/read/space-invitation-read.repository';
import { SpaceInvitationViewModel } from '@contexts/spaces/domain/view-models/space-invitation.view-model';
import { SpaceInvitationEntity } from '../entities/space-invitation.entity';
import { SpaceInvitationTypeOrmMapper } from '../mappers/space-invitation-typeorm.mapper';

@Injectable()
export class SpaceInvitationTypeOrmReadRepository
  extends BaseDatabaseRepository
  implements ISpaceInvitationReadRepository
{
  constructor(
    @InjectRepository(SpaceInvitationEntity)
    private readonly rawRepo: Repository<SpaceInvitationEntity>,
    private readonly mapper: SpaceInvitationTypeOrmMapper,
  ) {
    super();
  }

  async findById(id: string): Promise<SpaceInvitationViewModel | null> {
    const entity = await this.rawRepo.findOne({ where: { id } });
    return entity ? this.mapper.toViewModel(entity) : null;
  }

  async findByCode(code: string): Promise<SpaceInvitationViewModel | null> {
    const normalized = InvitationCodeValueObject.normalize(code);
    const entity = await this.rawRepo.findOne({ where: { code: normalized } });
    return entity ? this.mapper.toViewModel(entity) : null;
  }

  async findByCriteria(
    criteria: Criteria,
  ): Promise<PaginatedResult<SpaceInvitationViewModel>> {
    const { page, limit, skip } = await this.calculatePagination(criteria);

    const where =
      criteria.filters?.reduce(
        (acc, f) => ({ ...acc, [f.field]: f.value }),
        {},
      ) ?? {};

    const [entities, total] = await this.rawRepo.findAndCount({
      where,
      skip,
      take: limit,
      order: criteria.sorts?.reduce(
        (acc, s) => ({ ...acc, [s.field]: s.direction }),
        {},
      ),
    });

    const items = entities.map((e) => this.mapper.toViewModel(e));
    return new PaginatedResult(items, total, page, limit);
  }

  async save(_viewModel: SpaceInvitationViewModel): Promise<void> {
    // read-side projection
  }

  async delete(_id: string): Promise<void> {
    // read-side projection
  }
}
