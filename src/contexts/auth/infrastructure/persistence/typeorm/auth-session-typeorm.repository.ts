import { AuthSessionAggregate } from '@contexts/auth/domain/aggregates/auth-session.aggregate';
import { IAuthSessionWriteRepository } from '@contexts/auth/domain/repositories/write/auth-session-write.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { AuthSessionEntity } from './auth-session.entity';
import { AuthSessionTypeOrmMapper } from './auth-session.mapper';

@Injectable()
export class AuthSessionTypeOrmRepository implements IAuthSessionWriteRepository {
  constructor(
    @InjectRepository(AuthSessionEntity)
    private readonly repo: Repository<AuthSessionEntity>,
    private readonly mapper: AuthSessionTypeOrmMapper,
  ) {}

  async save(session: AuthSessionAggregate): Promise<void> {
    await this.repo.save(this.mapper.toEntity(session));
  }

  async findByTokenHash(
    tokenHash: string,
  ): Promise<AuthSessionAggregate | null> {
    const entity = await this.repo.findOne({ where: { tokenHash } });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findById(id: string): Promise<AuthSessionAggregate | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async revokeAllByUserId(userId: string): Promise<number> {
    const result = await this.repo.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
    return result.affected ?? 0;
  }
}
