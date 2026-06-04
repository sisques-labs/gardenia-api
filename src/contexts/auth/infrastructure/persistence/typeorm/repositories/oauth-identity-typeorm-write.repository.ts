import { OAuthIdentityEntity } from '@contexts/auth/domain/entities/oauth-identity/oauth-identity.entity';
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

  async save(identity: OAuthIdentityEntity): Promise<OAuthIdentityEntity> {
    const entity = this.mapper.toEntity(identity);
    const saved = await this.repo.save(entity);
    return this.mapper.toAggregate(saved);
  }

  async findById(id: string): Promise<OAuthIdentityEntity | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.mapper.toAggregate(entity) : null;
  }

  async findByProviderUserId(
    provider: string,
    providerUserId: string,
  ): Promise<OAuthIdentityEntity | null> {
    const entity = await this.repo.findOne({
      where: { provider, providerUserId },
    });
    return entity ? this.mapper.toAggregate(entity) : null;
  }

  async findByUserId(userId: string): Promise<OAuthIdentityEntity[]> {
    const entities = await this.repo.find({ where: { userId } });
    return entities.map((e) => this.mapper.toAggregate(e));
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async findByCriteria(
    _criteria: Criteria,
  ): Promise<PaginatedResult<OAuthIdentityEntity>> {
    return new PaginatedResult<OAuthIdentityEntity>([], 0, 1, 10);
  }
}
