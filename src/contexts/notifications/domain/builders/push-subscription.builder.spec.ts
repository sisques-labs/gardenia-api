import { FieldIsRequiredException } from '@sisques-labs/nestjs-kit';

import { PushSubscriptionBuilder } from './push-subscription.builder';

const ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const ENDPOINT = 'https://fcm.googleapis.com/fcm/send/abc123';
const CREATED_AT = new Date('2026-01-01T00:00:00.000Z');
const UPDATED_AT = new Date('2026-01-02T00:00:00.000Z');

const base = (): PushSubscriptionBuilder =>
  new PushSubscriptionBuilder()
    .withId(ID)
    .withUserId(USER_ID)
    .withEndpoint(ENDPOINT)
    .withP256dh('p256dh-key')
    .withAuth('auth-secret')
    .withCreatedAt(CREATED_AT)
    .withUpdatedAt(UPDATED_AT);

describe('PushSubscriptionBuilder', () => {
  describe('build()', () => {
    it('builds an aggregate with required fields and a null userAgent by default', () => {
      const aggregate = base().build();

      expect(aggregate.id.value).toBe(ID);
      expect(aggregate.userId.value).toBe(USER_ID);
      expect(aggregate.endpoint.value).toBe(ENDPOINT);
      expect(aggregate.p256dh.value).toBe('p256dh-key');
      expect(aggregate.auth.value).toBe('auth-secret');
      expect(aggregate.userAgent).toBeNull();
    });

    it('wraps userAgent when provided', () => {
      const aggregate = base().withUserAgent('Mozilla/5.0').build();
      expect(aggregate.userAgent?.value).toBe('Mozilla/5.0');
    });
  });

  describe('buildViewModel()', () => {
    it('builds a view model with primitive values', () => {
      const vm = base().buildViewModel();

      expect(vm.id).toBe(ID);
      expect(vm.userId).toBe(USER_ID);
      expect(vm.endpoint).toBe(ENDPOINT);
    });
  });

  describe('validate()', () => {
    it('throws when userId is missing', () => {
      expect(() =>
        base()
          .withUserId(undefined as unknown as string)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });

    it('throws when endpoint is missing', () => {
      expect(() =>
        base()
          .withEndpoint(undefined as unknown as string)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });

    it('throws when p256dh is missing', () => {
      expect(() =>
        base()
          .withP256dh(undefined as unknown as string)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });

    it('throws when auth is missing', () => {
      expect(() =>
        base()
          .withAuth(undefined as unknown as string)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });
  });
});
