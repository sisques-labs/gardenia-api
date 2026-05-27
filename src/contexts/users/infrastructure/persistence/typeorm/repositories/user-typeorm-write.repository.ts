import { UserAggregate } from '@contexts/users/domain/aggregates/user.aggregate';
import { IUserWriteRepository } from '@contexts/users/domain/repositories/write/user-write.repository';
import { UserTypeOrmEntity } from '@contexts/users/infrastructure/persistence/typeorm/entities/user.entity';
import { UserTypeOrmMapper } from '@contexts/users/infrastructure/persistence/typeorm/mappers/user-typeorm.mapper';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Criteria, PaginatedResult } from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

@Injectable()
export class UserTypeOrmWriteRepository implements IUserWriteRepository {
  constructor(
    private readonly userTypeOrmMapper: UserTypeOrmMapper,
    @InjectRepository(UserTypeOrmEntity)
    private readonly repository: Repository<UserTypeOrmEntity>,
  ) {}

  async findById(id: string): Promise<UserAggregate | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.userTypeOrmMapper.toAggregate(entity) : null;
  }

  async findByCriteria(
    _criteria: Criteria,
  ): Promise<PaginatedResult<UserAggregate>> {
    throw new Error('Method not implemented.');
  }

  async save(user: UserAggregate): Promise<UserAggregate> {
    const entity = this.userTypeOrmMapper.toEntity(user);
    await this.repository.save(entity);
    return this.userTypeOrmMapper.toAggregate(entity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
