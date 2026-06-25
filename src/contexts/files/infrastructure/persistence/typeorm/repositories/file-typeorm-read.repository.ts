import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseDatabaseRepository,
  Criteria,
  FilterOperator,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { IFileReadRepository } from '@contexts/files/domain/repositories/read/file-read.repository';
import { FileViewModel } from '@contexts/files/domain/view-models/file.view-model';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { createTenantRepository } from '@shared/tenant-repository/create-tenant-repository.factory';
import { FileTypeOrmEntity } from '../entities/file.entity';
import { FileTypeOrmMapper } from '../mappers/file-typeorm.mapper';

@Injectable()
export class FileTypeOrmReadRepository
  extends BaseDatabaseRepository
  implements IFileReadRepository
{
  private readonly repository: Repository<FileTypeOrmEntity>;

  constructor(
    @InjectRepository(FileTypeOrmEntity)
    rawRepo: Repository<FileTypeOrmEntity>,
    private readonly mapper: FileTypeOrmMapper,
    private readonly spaceContext: SpaceContext,
  ) {
    super();
    this.repository = createTenantRepository(rawRepo, spaceContext);
  }

  async findById(id: string): Promise<FileViewModel | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.mapper.toViewModel(entity) : null;
  }

  async findByCriteria(
    criteria: Criteria,
  ): Promise<PaginatedResult<FileViewModel>> {
    const { page, limit, skip } = await this.calculatePagination(criteria);

    const qb = this.repository.createQueryBuilder('file');
    qb.where('file.space_id = :spaceId', {
      spaceId: this.spaceContext.require(),
    });

    for (const filter of criteria.filters) {
      switch (filter.operator) {
        case FilterOperator.LIKE:
          qb.andWhere(`LOWER(file.${filter.field}) LIKE :${filter.field}`, {
            [filter.field]: `%${String(filter.value).toLowerCase()}%`,
          });
          break;
        case FilterOperator.EQUALS:
          qb.andWhere(`file.${filter.field} = :${filter.field}`, {
            [filter.field]: filter.value,
          });
          break;
      }
    }

    qb.orderBy('file.created_at', 'DESC');
    qb.skip(skip).take(limit);

    const [entities, total] = await qb.getManyAndCount();
    const items = entities.map((e) => this.mapper.toViewModel(e));

    return new PaginatedResult(items, total, page, limit);
  }

  async save(_vm: FileViewModel): Promise<void> {}

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
