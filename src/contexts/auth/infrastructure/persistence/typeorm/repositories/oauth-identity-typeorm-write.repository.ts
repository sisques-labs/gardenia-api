import { OAuthIdentityAggregate } from '@contexts/auth/domain/aggregates/oauth-identity.aggregate';
import { IOAuthIdentityWriteRepository } from '@contexts/auth/domain/repositories/write/oauth-identity-write.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Criteria, PaginatedResult } from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';
import { OAuthIdentityTypeOrmEntity } from '../entities/oauth-identity.entity';
import { OAuthIdentityTypeOrmMapper } from '../mappers/oauth-identity-typeorm.mapper';

@Injectable()
export class OAuthIdentityTypeOrmWriteRepository implements IOAuthIdentityWriteRepository {
  constructor(
    @InjectRepository(OAuthIdentityTypeOrmEntity)
    private readonly repo: Repository<OAuthIdentityTypeOrmEntity>,
    private readonly mapper: OAuthIdentityTypeOrmMapper,
  ) {}

  async save(
    identity: OAuthIdentityAggregate,
  ): Promise<OAuthIdentityAggregate> {
    const entity = this.mapper.toEntity(identity);
    const saved = await this.repo.save(entity);
    return this.mapper.toAggregate(saved);
  }

  async findById(id: string): Promise<OAuthIdentityAggregate | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.mapper.toAggregate(entity) : null;
  }

  async findByProviderUserId(
    provider: string,
    providerUserId: string,
  ): Promise<OAuthIdentityAggregate | null> {
    const entity = await this.repo.findOne({
      where: { provider, providerUserId },
    });
    return entity ? this.mapper.toAggregate(entity) : null;
  }

  async findByUserId(userId: string): Promise<OAuthIdentityAggregate[]> {
    const entities = await this.repo.find({ where: { userId } });
    return entities.map((e) => this.mapper.toAggregate(e));
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async findByCriteria(
    _criteria: Criteria,
  ): Promise<PaginatedResult<OAuthIdentityAggregate>> {
    return new PaginatedResult<OAuthIdentityAggregate>([], 0, 1, 10);
  }
}
