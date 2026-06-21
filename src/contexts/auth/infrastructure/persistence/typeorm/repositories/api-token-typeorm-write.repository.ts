import { ApiTokenAggregate } from '@contexts/auth/domain/aggregates/api-token.aggregate';
import { IApiTokenWriteRepository } from '@contexts/auth/domain/repositories/write/api-token-write.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Criteria, PaginatedResult } from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { ApiTokenEntity } from '../entities/api-token.entity';
import { ApiTokenTypeOrmMapper } from '../mappers/api-token-typeorm.mapper';

@Injectable()
export class ApiTokenTypeOrmWriteRepository implements IApiTokenWriteRepository {
  constructor(
    @InjectRepository(ApiTokenEntity)
    private readonly repo: Repository<ApiTokenEntity>,
    private readonly mapper: ApiTokenTypeOrmMapper,
  ) {}

  async save(token: ApiTokenAggregate): Promise<ApiTokenAggregate> {
    const saved = await this.repo.save(this.mapper.toEntity(token));
    return this.mapper.toAggregate(saved);
  }

  async findById(id: string): Promise<ApiTokenAggregate | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.mapper.toAggregate(entity) : null;
  }

  async findByTokenHash(tokenHash: string): Promise<ApiTokenAggregate | null> {
    const entity = await this.repo.findOne({ where: { tokenHash } });
    return entity ? this.mapper.toAggregate(entity) : null;
  }

  async findByUserId(userId: string): Promise<ApiTokenAggregate[]> {
    const entities = await this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return entities.map((entity) => this.mapper.toAggregate(entity));
  }

  async findByCriteria(
    _criteria: Criteria,
  ): Promise<PaginatedResult<ApiTokenAggregate>> {
    return new PaginatedResult<ApiTokenAggregate>([], 0, 1, 10);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
