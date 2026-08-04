import { AuthSessionAggregate } from '@contexts/auth/domain/aggregates/auth-session.aggregate';
import { RotateResult } from '@contexts/auth/domain/interfaces/rotate-result.interface';
import { RotateSessionCallback } from '@contexts/auth/domain/interfaces/rotate-session-callback.interface';
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

  async revokeAllByUserId(userId: string): Promise<number> {
    const result = await this.repo.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
    return result.affected ?? 0;
  }

  async rotate(
    tokenHash: string,
    fn: RotateSessionCallback,
  ): Promise<RotateResult> {
    return this.repo.manager.transaction(async (em) => {
      const entity = await em.findOne(AuthSessionEntity, {
        where: { tokenHash },
        lock: { mode: 'pessimistic_write' },
      });

      if (!entity) return { status: 'not-found' };

      const current = this.mapper.toAggregate(entity);

      const findLockedById = async (
        id: string,
      ): Promise<AuthSessionAggregate | null> => {
        const found = await em.findOne(AuthSessionEntity, {
          where: { id },
          lock: { mode: 'pessimistic_write' },
        });
        return found ? this.mapper.toAggregate(found) : null;
      };

      const { revoked, created } = await fn(current, findLockedById);

      // `revoked.replacedBySessionId` points at `created.id`, which doesn't
      // exist in the DB yet — insert `created` first, or the FK constraint
      // on `revoked`'s row rejects the reference.
      await em.save(AuthSessionEntity, this.mapper.toEntity(created));
      await em.save(AuthSessionEntity, this.mapper.toEntity(revoked));

      return { status: 'ok', oldSession: revoked, newSession: created };
    });
  }
}
