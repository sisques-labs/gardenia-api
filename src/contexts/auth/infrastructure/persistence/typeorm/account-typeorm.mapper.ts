import { AccountAggregate } from '@contexts/auth/domain/aggregates/account.aggregate';
import { AccountBuilder } from '@contexts/auth/domain/builders/account.builder';
import { AccountViewModel } from '@contexts/auth/domain/view-models/account.view-model';
import { Injectable } from '@nestjs/common';
import { AccountEntity } from './account.entity';

@Injectable()
export class AccountTypeOrmMapper {
  constructor(private readonly accountBuilder: AccountBuilder) {}

  public toAggregate(entity: AccountEntity): AccountAggregate {
    return this.accountBuilder
      .withId(entity.id)
      .withUserId(entity.userId)
      .withEmail(entity.email)
      .withPasswordHash(entity.passwordHash)
      .withAppRole(entity.appRole)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt)
      .build();
  }

  public toEntity(aggregate: AccountAggregate): AccountEntity {
    const primitives = aggregate.toPrimitives();
    const entity = new AccountEntity();
    entity.id = primitives.id;
    entity.userId = primitives.userId;
    entity.email = primitives.email;
    entity.passwordHash = primitives.passwordHash;
    entity.appRole = primitives.appRole;
    entity.createdAt = primitives.createdAt;
    entity.updatedAt = primitives.updatedAt;
    return entity;
  }

  public toViewModel(entity: AccountEntity): AccountViewModel {
    return new AccountViewModel({
      id: entity.id,
      userId: entity.userId,
      email: entity.email,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
