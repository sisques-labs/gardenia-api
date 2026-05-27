import { IUserReadRepository } from '@contexts/users/domain/repositories/read/user-read.repository';
import { UserViewModel } from '@contexts/users/domain/view-models/user.view-model';
import { UserTypeOrmEntity } from '@contexts/users/infrastructure/persistence/typeorm/entities/user.entity';
import { UserTypeOrmMapper } from '@contexts/users/infrastructure/persistence/typeorm/mappers/user-typeorm.mapper';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Criteria, PaginatedResult } from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

@Injectable()
export class UserTypeOrmReadRepository implements IUserReadRepository {
  constructor(
    @InjectRepository(UserTypeOrmEntity)
    private readonly repo: Repository<UserTypeOrmEntity>,
    private readonly mapper: UserTypeOrmMapper,
  ) {}

  async findById(id: string): Promise<UserViewModel | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.mapper.toViewModel(entity) : null;
  }

  async findByCriteria(
    criteria: Criteria,
  ): Promise<PaginatedResult<UserViewModel>> {
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

    const items = entities.map((e) => this.mapper.toViewModel(e));
    return new PaginatedResult(items, total, page, perPage);
  }

  async save(_viewModel: UserViewModel): Promise<void> {
    // read-side projection — write side handles persistence
  }

  async delete(_id: string): Promise<void> {
    // read-side projection — write side handles persistence
  }

  async findByUsername(username: string): Promise<UserViewModel | null> {
    const entity = await this.repo.findOne({
      where: { username: username.toLowerCase() },
    });
    return entity ? this.mapper.toViewModel(entity) : null;
  }
}
