import { AuthSessionCreatedEvent } from '@contexts/auth/domain/events/auth-session-created/auth-session-created.event';
import { AuthSessionReuseDetectedEvent } from '@contexts/auth/domain/events/auth-session-reuse-detected/auth-session-reuse-detected.event';
import { AuthSessionRevokedEvent } from '@contexts/auth/domain/events/auth-session-revoked/auth-session-revoked.event';
import { AuthSessionIdValueObject } from '@contexts/auth/domain/value-objects/auth-session-id/auth-session-id.vo';
import { RefreshTokenHashValueObject } from '@contexts/auth/domain/value-objects/refresh-token-hash/refresh-token-hash.vo';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';
import { AuthSessionAggregate } from './auth-session.aggregate';

const VALID_HASH = 'a3b4c5d6'.repeat(8);

function buildSession(overrides?: {
  revokedAt?: Date | null;
}): AuthSessionAggregate {
  return new AuthSessionAggregate({
    id: new AuthSessionIdValueObject('550e8400-e29b-41d4-a716-446655440000'),
    userId: new UuidValueObject('550e8400-e29b-41d4-a716-446655440001'),
    tokenHash: new RefreshTokenHashValueObject(VALID_HASH),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    revokedAt: overrides?.revokedAt ?? null,
    deviceInfo: null,
    createdAt: null,
    updatedAt: null,
  });
}

describe('AuthSessionAggregate', () => {
  describe('create()', () => {
    it('should emit AuthSessionCreatedEvent', () => {
      const session = buildSession();
      session.create();

      const events = session.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(AuthSessionCreatedEvent);
    });
  });

  describe('revoke()', () => {
    it('should set revokedAt and emit AuthSessionRevokedEvent with reason', () => {
      const session = buildSession();
      session.revoke('user-logout');

      const events = session.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(AuthSessionRevokedEvent);
      expect((events[0] as AuthSessionRevokedEvent).data.reason).toBe(
        'user-logout',
      );
      expect(session.revokedAt).not.toBeNull();
    });

    it('should be idempotent: calling revoke twice emits event only once', () => {
      const session = buildSession();
      session.revoke('first');
      session.commit();
      session.revoke('second');

      const events = session.getUncommittedEvents();
      expect(events).toHaveLength(0);
    });
  });

  describe('markReuseDetected()', () => {
    it('should emit AuthSessionReuseDetectedEvent without mutating state', () => {
      const revokedAt = new Date(2023, 1, 1);
      const session = buildSession({ revokedAt });
      session.markReuseDetected();

      const events = session.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(AuthSessionReuseDetectedEvent);
      // State NOT mutated — revokedAt stays as is
      expect(session.revokedAt).toEqual(revokedAt);
    });
  });
});
