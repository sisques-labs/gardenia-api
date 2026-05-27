import { AccountAggregate } from '@contexts/auth/domain/aggregates/account.aggregate';
import { IAccountWriteRepository } from '@contexts/auth/domain/repositories/write/account-write.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Criteria, PaginatedResult } from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';
import { AccountEntity } from './account.entity';
import { AccountTypeOrmMapper } from './account-typeorm.mapper';

@Injectable()
export class AccountTypeOrmWriteRepository implements IAccountWriteRepository {
  constructor(
    @InjectRepository(AccountEntity)
    private readonly repo: Repository<AccountEntity>,
    private readonly mapper: AccountTypeOrmMapper,
  ) {}

  async findById(id: string): Promise<AccountAggregate | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.mapper.toAggregate(entity) : null;
  }

  async findByCriteria(
    _criteria: Criteria,
  ): Promise<PaginatedResult<AccountAggregate>> {
    return new PaginatedResult<AccountAggregate>([], 0, 1, 10);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async save(account: AccountAggregate): Promise<AccountAggregate> {
    const entity = this.mapper.toEntity(account);
    const saved = await this.repo.save(entity);
    return this.mapper.toAggregate(saved);
  }

  async findByEmail(email: string): Promise<AccountAggregate | null> {
    const entity = await this.repo.findOne({ where: { email } });
    return entity ? this.mapper.toAggregate(entity) : null;
  }

  async findByUserId(userId: string): Promise<AccountAggregate | null> {
    const entity = await this.repo.findOne({ where: { userId } });
    return entity ? this.mapper.toAggregate(entity) : null;
  }
}
