import { AuthSessionAggregate } from '@contexts/auth/domain/aggregates/auth-session.aggregate';

export const AUTH_SESSION_WRITE_REPOSITORY = Symbol(
  'AUTH_SESSION_WRITE_REPOSITORY',
);

export interface IAuthSessionWriteRepository {
  save(session: AuthSessionAggregate): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<AuthSessionAggregate | null>;
  findById(id: string): Promise<AuthSessionAggregate | null>;
  revokeAllByUserId(userId: string): Promise<number>;
}
