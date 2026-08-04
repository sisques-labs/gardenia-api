import { AuthSessionAggregate } from '@contexts/auth/domain/aggregates/auth-session.aggregate';

export interface RotateSessionResult {
  revoked: AuthSessionAggregate;
  created: AuthSessionAggregate;
}
