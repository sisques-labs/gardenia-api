import { IAccountReadRepository } from '@contexts/auth/domain/repositories/read/account-read.repository';
import { AccountViewModel } from '@contexts/auth/domain/view-models/account.view-model';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseDatabaseRepository,
  Criteria,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';
import { AccountEntity } from './account.entity';
import { AccountTypeOrmMapper } from './account-typeorm.mapper';

@Injectable()
export class AccountTypeOrmReadRepository
  extends BaseDatabaseRepository
  implements IAccountReadRepository
{
  constructor(
    @InjectRepository(AccountEntity)
    private readonly repo: Repository<AccountEntity>,
    private readonly mapper: AccountTypeOrmMapper,
  ) {
    super();
  }

  async findById(id: string): Promise<AccountViewModel | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.mapper.toViewModel(entity) : null;
  }

  async findByCriteria(
    criteria: Criteria,
  ): Promise<PaginatedResult<AccountViewModel>> {
    const { page, limit, skip } = await this.calculatePagination(criteria);

    const where =
      criteria.filters?.reduce(
        (acc, f) => ({ ...acc, [f.field]: f.value }),
        {},
      ) ?? {};

    const [entities, total] = await this.repo.findAndCount({
      where,
      skip,
      take: limit,
      order: criteria.sorts.reduce(
        (acc, s) => ({ ...acc, [s.field]: s.direction }),
        {},
      ),
    });

    const items = entities.map((entity) => this.mapper.toViewModel(entity));
    return new PaginatedResult(items, total, page, limit);
  }

  async save(_viewModel: AccountViewModel): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async delete(_id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
