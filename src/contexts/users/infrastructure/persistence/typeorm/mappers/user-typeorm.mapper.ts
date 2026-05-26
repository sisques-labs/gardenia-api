import { UserAggregate } from '@contexts/users/domain/aggregates/user.aggregate';
import { UserBuilder } from '@contexts/users/domain/builders/user.builder';
import { UserViewModel } from '@contexts/users/domain/view-models/user.view-model';
import { UserTypeOrmEntity } from '@contexts/users/infrastructure/persistence/typeorm/entities/user.entity';
import { Injectable } from '@nestjs/common';
import { UserStatusEnum } from '@sisques-labs/nestjs-kit';

@Injectable()
export class UserTypeOrmMapper {
  constructor(private readonly userBuilder: UserBuilder) {}

  public toAggregate(entity: UserTypeOrmEntity): UserAggregate {
    return this.userBuilder
      .withId(entity.id)
      .withStatus(entity.status as UserStatusEnum)
      .withUsername(entity.username)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt)
      .build();
  }

  public toEntity(user: UserAggregate): UserTypeOrmEntity {
    const primitives = user.toPrimitives();
    const entity = new UserTypeOrmEntity();

    entity.id = primitives.id;
    entity.status = primitives.status as UserStatusEnum;
    entity.username = primitives.username;
    entity.createdAt = primitives.createdAt;
    entity.updatedAt = primitives.updatedAt;

    return entity;
  }

  public toViewModel(entity: UserTypeOrmEntity): UserViewModel {
    return new UserViewModel({
      id: entity.id,
      status: entity.status,
      username: entity.username,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
