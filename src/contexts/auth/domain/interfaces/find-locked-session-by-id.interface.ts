import { AuthSessionAggregate } from '@contexts/auth/domain/aggregates/auth-session.aggregate';

export type FindLockedSessionById = (
  id: string,
) => Promise<AuthSessionAggregate | null>;
