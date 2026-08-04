import { AuthSessionAggregate } from '@contexts/auth/domain/aggregates/auth-session.aggregate';
import { FindLockedSessionById } from '@contexts/auth/domain/interfaces/find-locked-session-by-id.interface';
import { RotateSessionResult } from '@contexts/auth/domain/interfaces/rotate-session-result.interface';

export type RotateSessionCallback = (
  current: AuthSessionAggregate,
  findLockedById: FindLockedSessionById,
) => Promise<RotateSessionResult>;
