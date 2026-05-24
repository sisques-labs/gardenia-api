import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AccountAggregate } from '../../../domain/aggregates/account.aggregate';
import { AccountAggregateReconstructBuilder } from '../../../domain/builders/account-aggregate.builder';
import { IAccountWriteRepository } from '../../../domain/repositories/i-account-write.repository';
import { AccountEntity } from './account.entity';

@Injectable()
export class AccountTypeOrmWriteRepository implements IAccountWriteRepository {
  constructor(
    @InjectRepository(AccountEntity)
    private readonly repo: Repository<AccountEntity>,
  ) {}

  async save(account: AccountAggregate): Promise<void> {
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
    return new AccountAggregateReconstructBuilder()
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
