import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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
    return UserAggregate.fromPrimitives({
      id: entity.id,
      email: entity.email,
      passwordHash: entity.passwordHash,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private toEntity(aggregate: UserAggregate): UserEntity {
    const entity = new UserEntity();
    entity.id = aggregate.id.value;
    entity.email = aggregate.email;
    entity.passwordHash = aggregate.passwordHash;
    entity.createdAt = aggregate.createdAt.value;
    entity.updatedAt = aggregate.updatedAt.value;
    return entity;
  }
}
