import { IUserReadRepository } from '@contexts/users/domain/repositories/read/user-read.repository';
import { UserViewModel } from '@contexts/users/domain/view-models/user.view-model';
import { UserTypeOrmEntity } from '@contexts/users/infrastructure/persistence/typeorm/entities/user.entity';
import { UserTypeOrmMapper } from '@contexts/users/infrastructure/persistence/typeorm/mappers/user-typeorm.mapper';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseDatabaseRepository,
  Criteria,
  PaginatedResult,
  SortDirection,
} from '@sisques-labs/nestjs-kit';
import { applyCriteriaToQueryBuilder } from '@sisques-labs/nestjs-kit/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { SpaceContext } from '../../../../../../shared/space-context/space-context.service';

const ALIAS = 'user';
const MEMBERSHIP_ALIAS = 'membership';

@Injectable()
export class UserTypeOrmReadRepository
  extends BaseDatabaseRepository
  implements IUserReadRepository
{
  constructor(
    @InjectRepository(UserTypeOrmEntity)
    private readonly repo: Repository<UserTypeOrmEntity>,
    private readonly mapper: UserTypeOrmMapper,
    private readonly spaceContext: SpaceContext,
  ) {
    super();
  }

  // A user's identity (users row) is global; space membership — not the
  // user's home space_id — determines who belongs to the active space, so
  // members who joined via invitation are resolved through this join too.
  private spaceMembersQueryBuilder(): SelectQueryBuilder<UserTypeOrmEntity> {
    return this.repo
      .createQueryBuilder(ALIAS)
      .innerJoin(
        'space_memberships',
        MEMBERSHIP_ALIAS,
        `${MEMBERSHIP_ALIAS}.user_id = ${ALIAS}.id`,
      )
      .where(`${MEMBERSHIP_ALIAS}.space_id = :spaceId`, {
        spaceId: this.spaceContext.require(),
      });
  }

  async findById(id: string): Promise<UserViewModel | null> {
    const entity = await this.spaceMembersQueryBuilder()
      .andWhere(`${ALIAS}.id = :id`, { id })
      .getOne();
    return entity ? this.mapper.toViewModel(entity) : null;
  }

  async findByCriteria(
    criteria: Criteria,
  ): Promise<PaginatedResult<UserViewModel>> {
    const { page, limit, skip } = await this.calculatePagination(criteria);

    const qb = this.spaceMembersQueryBuilder();

    applyCriteriaToQueryBuilder(qb, criteria, {
      alias: ALIAS,
      defaultSort: { field: 'createdAt', direction: SortDirection.DESC },
    });

    const [entities, total] = await qb.skip(skip).take(limit).getManyAndCount();

    const items = entities.map((e) => this.mapper.toViewModel(e));
    return new PaginatedResult(items, total, page, limit);
  }

  async save(_viewModel: UserViewModel): Promise<void> {
    // read-side projection — write side handles persistence
  }

  async delete(_id: string): Promise<void> {
    // read-side projection — write side handles persistence
  }

  async findByUsername(username: string): Promise<UserViewModel | null> {
    const entity = await this.spaceMembersQueryBuilder()
      .andWhere(`${ALIAS}.username = :username`, {
        username: username.toLowerCase(),
      })
      .getOne();
    return entity ? this.mapper.toViewModel(entity) : null;
  }
}
