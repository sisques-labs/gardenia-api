import { AccountAggregate } from '@contexts/auth/domain/aggregates/account.aggregate';
import { AccountBuilder } from '@contexts/auth/domain/builders/account.builder';
import { IAccountWriteRepository } from '@contexts/auth/domain/repositories/write/account-write.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Criteria, PaginatedResult } from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';
import { AccountEntity } from './account.entity';

@Injectable()
export class AccountTypeOrmWriteRepository implements IAccountWriteRepository {
  constructor(
    @InjectRepository(AccountEntity)
    private readonly repo: Repository<AccountEntity>,
  ) {}
  findById(id: string): Promise<AccountAggregate | null> {
    throw new Error('Method not implemented.');
  }
  findByCriteria(
    criteria: Criteria,
  ): Promise<PaginatedResult<AccountAggregate>> {
    throw new Error('Method not implemented.');
  }
  delete(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async save(account: AccountAggregate): Promise<AccountAggregate> {
    const entity = this.toEntity(account);
    await this.repo.save(entity);
  }

  async findByEmail(email: string): Promise<AccountAggregate | null> {
    const entity = await this.repo.findOne({ where: { email } });
    return entity ? this.toAggregate(entity) : null;
  }

  async findByUserId(userId: string): Promise<AccountAggregate | null> {
    const entity = await this.repo.findOne({ where: { userId } });
    return entity ? this.toAggregate(entity) : null;
  }

  private toAggregate(entity: AccountEntity): AccountAggregate {
    return new AccountBuilder()
      .withId(entity.id)
      .withUserId(entity.userId)
      .withEmail(entity.email)
      .withPasswordHash(entity.passwordHash)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt)
      .build();
  }

  private toEntity(aggregate: AccountAggregate): AccountEntity {
    const primitives = aggregate.toPrimitives();
    const entity = new AccountEntity();
    entity.id = primitives.id;
    entity.userId = primitives.userId;
    entity.email = primitives.email;
    entity.passwordHash = primitives.passwordHash;
    entity.createdAt = primitives.createdAt;
    entity.updatedAt = primitives.updatedAt;
    return entity;
  }
}
