import { UserAggregate } from '@contexts/users/domain/aggregates/user.aggregate';
import { IUserWriteRepository } from '@contexts/users/domain/repositories/write/user-write.repository';
import { UserTypeOrmEntity } from '@contexts/users/infrastructure/persistence/typeorm/entities/user.entity';
import { UserTypeOrmMapper } from '@contexts/users/infrastructure/persistence/typeorm/mappers/user-typeorm.mapper';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Criteria, PaginatedResult } from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';
import { SpaceContext } from '../../../../../../shared/space-context/space-context.service';
import { createTenantRepository } from '../../../../../../shared/tenant-repository/create-tenant-repository.factory';

@Injectable()
export class UserTypeOrmWriteRepository implements IUserWriteRepository {
  private readonly rawRepository: Repository<UserTypeOrmEntity>;
  private readonly repository: Repository<UserTypeOrmEntity>;

  constructor(
    private readonly userTypeOrmMapper: UserTypeOrmMapper,
    @InjectRepository(UserTypeOrmEntity)
    rawRepository: Repository<UserTypeOrmEntity>,
    private readonly spaceContext: SpaceContext,
  ) {
    this.rawRepository = rawRepository;
    this.repository = createTenantRepository(rawRepository, spaceContext);
  }

  // UUID-based lookups are globally unique — tenant filter is redundant and
  // breaks identity-scoped flows (delete-account) that run without ALS context.
  async findById(id: string): Promise<UserAggregate | null> {
    const entity = await this.rawRepository.findOne({ where: { id } });
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
    await this.rawRepository.delete(id);
  }
}
