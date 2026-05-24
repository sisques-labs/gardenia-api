import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserAggregateReconstructBuilder } from '../../../domain/builders/user-aggregate.builder';
import { UserAggregate } from '../../../domain/aggregates/user.aggregate';
import { IUserWriteRepository } from '../../../domain/repositories/i-user-write.repository';
import { UserEntity } from './user.entity';

@Injectable()
export class UserTypeOrmWriteRepository implements IUserWriteRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  async save(user: UserAggregate): Promise<void> {
    const entity = this.toEntity(user);
    await this.repo.save(entity);
  }

  async findByEmail(email: string): Promise<UserAggregate | null> {
    const entity = await this.repo.findOne({ where: { email } });
    return entity ? this.toAggregate(entity) : null;
  }

  async findById(id: string): Promise<UserAggregate | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.toAggregate(entity) : null;
  }

  private toAggregate(entity: UserEntity): UserAggregate {
    return new UserAggregateReconstructBuilder()
      .withId(entity.id)
      .withEmail(entity.email)
      .withPasswordHash(entity.passwordHash)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt)
      .build();
  }

  private toEntity(aggregate: UserAggregate): UserEntity {
    const primitives = aggregate.toPrimitives();
    const entity = new UserEntity();
    entity.id = primitives.id;
    entity.email = primitives.email;
    entity.passwordHash = primitives.passwordHash;
    entity.createdAt = primitives.createdAt;
    entity.updatedAt = primitives.updatedAt;
    return entity;
  }
}
