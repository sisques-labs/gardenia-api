import { AuthSessionAggregate } from '@contexts/auth/domain/aggregates/auth-session.aggregate';
import { IAuthSessionWriteRepository } from '@contexts/auth/domain/repositories/write/auth-session-write.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Criteria, PaginatedResult } from '@sisques-labs/nestjs-kit';
import { Repository, IsNull } from 'typeorm';
import { AuthSessionEntity } from '../entities/auth-session.entity';
import { AuthSessionTypeOrmMapper } from '../mappers/auth-session-typeorm.mapper';

@Injectable()
export class AuthSessionTypeOrmWriteRepository implements IAuthSessionWriteRepository {
  constructor(
    @InjectRepository(AuthSessionEntity)
    private readonly repo: Repository<AuthSessionEntity>,
    private readonly mapper: AuthSessionTypeOrmMapper,
  ) {}

  async save(session: AuthSessionAggregate): Promise<AuthSessionAggregate> {
    const entity = this.mapper.toEntity(session);
    const saved = await this.repo.save(entity);
    return this.mapper.toAggregate(saved);
  }

  async findByTokenHash(
    tokenHash: string,
  ): Promise<AuthSessionAggregate | null> {
    const entity = await this.repo.findOne({ where: { tokenHash } });
    return entity ? this.mapper.toAggregate(entity) : null;
  }

  async findById(id: string): Promise<AuthSessionAggregate | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.mapper.toAggregate(entity) : null;
  }

  async findByCriteria(
    _criteria: Criteria,
  ): Promise<PaginatedResult<AuthSessionAggregate>> {
    return new PaginatedResult<AuthSessionAggregate>([], 0, 1, 10);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async findActiveByUserId(userId: string): Promise<AuthSessionAggregate[]> {
    const entities = await this.repo.find({
      where: { userId, revokedAt: IsNull() },
    });
    return entities.map((entity) => this.mapper.toAggregate(entity));
  }

  async revokeAllByUserId(userId: string): Promise<number> {
    const result = await this.repo.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
    return result.affected ?? 0;
  }
}
