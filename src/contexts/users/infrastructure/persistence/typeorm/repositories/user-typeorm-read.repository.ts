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
} from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';
import { SpaceContext } from '../../../../../../shared/space-context/space-context.service';

@Injectable()
export class UserTypeOrmReadRepository
  extends BaseDatabaseRepository
  implements IUserReadRepository
{
  constructor(
    @InjectRepository(UserTypeOrmEntity)
    private readonly rawRepo: Repository<UserTypeOrmEntity>,
    private readonly mapper: UserTypeOrmMapper,
    private readonly spaceContext: SpaceContext,
  ) {
    super();
  }

  private membershipQuery(alias = 'u') {
    return this.rawRepo
      .createQueryBuilder(alias)
      .innerJoin(
        'space_memberships',
        'sm',
        'sm.user_id = u.id AND sm.space_id = :spaceId',
        { spaceId: this.spaceContext.require() },
      );
  }

  async findById(id: string): Promise<UserViewModel | null> {
    const entity = await this.membershipQuery()
      .where('u.id = :id', { id })
      .getOne();
    return entity ? this.mapper.toViewModel(entity) : null;
  }

  async findByCriteria(
    criteria: Criteria,
  ): Promise<PaginatedResult<UserViewModel>> {
    const { page, limit, skip } = await this.calculatePagination(criteria);

    const qb = this.membershipQuery().skip(skip).take(limit);

    for (const sort of criteria.sorts) {
      qb.addOrderBy(`u.${sort.field}`, sort.direction as 'ASC' | 'DESC');
    }

    const [entities, total] = await qb.getManyAndCount();

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
    const entity = await this.membershipQuery()
      .where('u.username = :username', { username: username.toLowerCase() })
      .getOne();
    return entity ? this.mapper.toViewModel(entity) : null;
  }
}
