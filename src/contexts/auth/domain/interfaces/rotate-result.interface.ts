import { AuthSessionAggregate } from '@contexts/auth/domain/aggregates/auth-session.aggregate';

export type RotateResult =
  | { status: 'not-found' }
  | {
      status: 'ok';
      oldSession: AuthSessionAggregate;
      newSession: AuthSessionAggregate;
    };
