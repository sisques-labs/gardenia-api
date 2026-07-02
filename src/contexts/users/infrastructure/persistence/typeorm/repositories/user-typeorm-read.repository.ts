import { IUserReadRepository } from '@contexts/users/domain/repositories/read/user-read.repository';
import { UserViewModel } from '@contexts/users/domain/view-models/user.view-model';
import { UserTypeOrmEntity } from '@contexts/users/infrastructure/persistence/typeorm/entities/user.entity';
import { UserTypeOrmMapper } from '@contexts/users/infrastructure/persistence/typeorm/mappers/user-typeorm.mapper';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseDatabaseRepository,
  Criteria,
  Filter,
  FilterOperator,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { SpaceContext } from '../../../../../../shared/space-context/space-context.service';
import { createTenantRepository } from '../../../../../../shared/tenant-repository/create-tenant-repository.factory';

const ALIAS = 'user';

@Injectable()
export class UserTypeOrmReadRepository
  extends BaseDatabaseRepository
  implements IUserReadRepository
{
  private readonly repo: Repository<UserTypeOrmEntity>;

  constructor(
    @InjectRepository(UserTypeOrmEntity)
    rawRepo: Repository<UserTypeOrmEntity>,
    private readonly mapper: UserTypeOrmMapper,
    private readonly spaceContext: SpaceContext,
  ) {
    super();
    this.repo = createTenantRepository(rawRepo, spaceContext);
  }

  async findById(id: string): Promise<UserViewModel | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.mapper.toViewModel(entity) : null;
  }

  async findByCriteria(
    criteria: Criteria,
  ): Promise<PaginatedResult<UserViewModel>> {
    const { page, limit, skip } = await this.calculatePagination(criteria);

    // createQueryBuilder bypasses createTenantRepository's find/findOne
    // proxy interception, so the space scope must be applied explicitly here.
    const qb = this.repo
      .createQueryBuilder(ALIAS)
      .where(`${ALIAS}.spaceId = :spaceId`, {
        spaceId: this.spaceContext.require(),
      });

    (criteria.filters ?? []).forEach((filter, index) =>
      this.applyFilter(qb, filter, index),
    );

    this.applySort(qb, criteria);

    const [entities, total] = await qb.skip(skip).take(limit).getManyAndCount();

    const items = entities.map((e) => this.mapper.toViewModel(e));
    return new PaginatedResult(items, total, page, limit);
  }

  private applyFilter(
    qb: SelectQueryBuilder<UserTypeOrmEntity>,
    filter: Filter,
    index: number,
  ): void {
    const column = `${ALIAS}.${filter.field}`;
    const param = `filter${index}`;

    switch (filter.operator) {
      case FilterOperator.EQUALS:
        qb.andWhere(`${column} = :${param}`, { [param]: filter.value });
        break;
      case FilterOperator.NOT_EQUALS:
        qb.andWhere(`${column} != :${param}`, { [param]: filter.value });
        break;
      case FilterOperator.LIKE:
        qb.andWhere(`${column} ILIKE :${param}`, {
          [param]: `%${filter.value}%`,
        });
        break;
      case FilterOperator.IN:
        qb.andWhere(`${column} IN (:...${param})`, {
          [param]: Array.isArray(filter.value) ? filter.value : [filter.value],
        });
        break;
      case FilterOperator.GREATER_THAN:
        qb.andWhere(`${column} > :${param}`, { [param]: filter.value });
        break;
      case FilterOperator.LESS_THAN:
        qb.andWhere(`${column} < :${param}`, { [param]: filter.value });
        break;
      case FilterOperator.GREATER_THAN_OR_EQUAL:
        qb.andWhere(`${column} >= :${param}`, { [param]: filter.value });
        break;
      case FilterOperator.LESS_THAN_OR_EQUAL:
        qb.andWhere(`${column} <= :${param}`, { [param]: filter.value });
        break;
    }
  }

  private applySort(
    qb: SelectQueryBuilder<UserTypeOrmEntity>,
    criteria: Criteria,
  ): void {
    if (!criteria.sorts?.length) {
      qb.orderBy(`${ALIAS}.createdAt`, 'DESC');
      return;
    }

    criteria.sorts.forEach((sort, index) => {
      const column = `${ALIAS}.${sort.field}`;
      if (index === 0) qb.orderBy(column, sort.direction);
      else qb.addOrderBy(column, sort.direction);
    });
  }

  async save(_viewModel: UserViewModel): Promise<void> {
    // read-side projection — write side handles persistence
  }

  async delete(_id: string): Promise<void> {
    // read-side projection — write side handles persistence
  }

  async findByUsername(username: string): Promise<UserViewModel | null> {
    const entity = await this.repo.findOne({
      where: { username: username.toLowerCase() },
    });
    return entity ? this.mapper.toViewModel(entity) : null;
  }
}
