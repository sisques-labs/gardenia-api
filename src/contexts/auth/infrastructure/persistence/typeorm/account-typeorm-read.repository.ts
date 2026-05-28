import { IAccountReadRepository } from '@contexts/auth/domain/repositories/read/account-read.repository';
import { AccountViewModel } from '@contexts/auth/domain/view-models/account.view-model';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Criteria, PaginatedResult } from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';
import { AccountEntity } from './account.entity';
import { AccountTypeOrmMapper } from './account-typeorm.mapper';

@Injectable()
export class AccountTypeOrmReadRepository implements IAccountReadRepository {
  constructor(
    @InjectRepository(AccountEntity)
    private readonly repo: Repository<AccountEntity>,
    private readonly mapper: AccountTypeOrmMapper,
  ) {}

  async findById(id: string): Promise<AccountViewModel | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.mapper.toViewModel(entity) : null;
  }

  // filters intentionally not applied — mirrors users context
  async findByCriteria(
    criteria: Criteria,
  ): Promise<PaginatedResult<AccountViewModel>> {
    const { page, perPage } = criteria.pagination;
    const skip = (page - 1) * perPage;

    const [entities, total] = await this.repo.findAndCount({
      skip,
      take: perPage,
      order: criteria.sorts.reduce(
        (acc, s) => ({ ...acc, [s.field]: s.direction }),
        {},
      ),
    });

    const items = entities.map((entity) => this.mapper.toViewModel(entity));
    return new PaginatedResult(items, total, page, perPage);
  }

  async save(_viewModel: AccountViewModel): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async delete(_id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
