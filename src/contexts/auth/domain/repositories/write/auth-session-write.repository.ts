import { AuthSessionAggregate } from '@contexts/auth/domain/aggregates/auth-session.aggregate';
import { IBaseWriteRepository } from '@sisques-labs/nestjs-kit';

export const AUTH_SESSION_WRITE_REPOSITORY = Symbol(
  'AUTH_SESSION_WRITE_REPOSITORY',
);

export interface IAuthSessionWriteRepository extends IBaseWriteRepository<AuthSessionAggregate> {
  findByTokenHash(tokenHash: string): Promise<AuthSessionAggregate | null>;
  revokeAllByUserId(userId: string): Promise<number>;
}
