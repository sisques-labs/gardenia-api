import {
  BooleanValueObject,
  DateValueObject,
  StringValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { OAuthIdentityBuilder } from '@contexts/auth/domain/builders/oauth-identity.builder';
import { OAuthIdentityLinkedEvent } from '@contexts/auth/domain/events/oauth-identity-linked/oauth-identity-linked.event';
import { AccountEmailValueObject } from '@contexts/auth/domain/value-objects/account-email/account-email.vo';
import { OAuthProviderValueObject } from '@contexts/auth/domain/value-objects/oauth-provider/oauth-provider.vo';
import { OAuthIdentityAggregate } from './oauth-identity.aggregate';

const ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';

const buildAggregate = (): OAuthIdentityAggregate =>
  new OAuthIdentityBuilder()
    .withId(ID)
    .withUserId(USER_ID)
    .withProvider('google')
    .withProviderUserId('google-user-123')
    .withEmail('user@example.com')
    .withEmailVerified(true)
    .build();

describe('OAuthIdentityAggregate', () => {
  describe('construction', () => {
    it('has no uncommitted events after hydration', () => {
      const aggregate = buildAggregate();

      expect(aggregate.getUncommittedEvents()).toHaveLength(0);
    });

    it('exposes its fields via getters', () => {
      const aggregate = buildAggregate();

      expect(aggregate.id.value).toBe(ID);
      expect(aggregate.userId.value).toBe(USER_ID);
      expect(aggregate.provider.value).toBe('google');
      expect(aggregate.providerUserId.value).toBe('google-user-123');
      expect(aggregate.email?.value).toBe('user@example.com');
      expect(aggregate.emailVerified.value).toBe(true);
    });
  });

  describe('link()', () => {
    it('emits a single OAuthIdentityLinkedEvent', () => {
      const aggregate = buildAggregate();

      aggregate.link();

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(OAuthIdentityLinkedEvent);
    });

    it('reports null email in the event when the identity has no email', () => {
      const aggregate = new OAuthIdentityBuilder()
        .withId(ID)
        .withUserId(USER_ID)
        .withProvider('google')
        .withProviderUserId('google-user-123')
        .withEmail(null)
        .withEmailVerified(false)
        .build();

      aggregate.link();

      const event =
        aggregate.getUncommittedEvents()[0] as OAuthIdentityLinkedEvent;
      expect(event.data.email).toBeNull();
      expect(aggregate.toPrimitives().email).toBeNull();
    });

    it('includes the identity data in the event', () => {
      const aggregate = buildAggregate();

      aggregate.link();

      const event =
        aggregate.getUncommittedEvents()[0] as OAuthIdentityLinkedEvent;
      expect(event.data).toMatchObject({
        id: ID,
        userId: USER_ID,
        provider: 'google',
        providerUserId: 'google-user-123',
        email: 'user@example.com',
      });
    });
  });

  describe('updateTokens()', () => {
    it('replaces token fields with the provided values', () => {
      const aggregate = buildAggregate();
      const expiresAt = new Date('2026-06-01T00:00:00.000Z');

      aggregate.updateTokens(
        new StringValueObject('access-enc'),
        new StringValueObject('refresh-enc'),
        new DateValueObject(expiresAt),
      );

      expect(aggregate.accessTokenEnc?.value).toBe('access-enc');
      expect(aggregate.refreshTokenEnc?.value).toBe('refresh-enc');
      expect(aggregate.tokenExpiresAt?.value).toBe(expiresAt);
    });

    it('can clear token fields by passing nulls', () => {
      const aggregate = buildAggregate();

      aggregate.updateTokens(
        new StringValueObject('access-enc'),
        new StringValueObject('refresh-enc'),
        new DateValueObject(new Date()),
      );
      aggregate.updateTokens(null, null, null);

      expect(aggregate.accessTokenEnc).toBeNull();
      expect(aggregate.refreshTokenEnc).toBeNull();
      expect(aggregate.tokenExpiresAt).toBeNull();
    });
  });

  describe('toPrimitives()', () => {
    it('serializes the aggregate into a plain object', () => {
      const aggregate = buildAggregate();

      const primitives = aggregate.toPrimitives();

      expect(primitives).toMatchObject({
        id: ID,
        userId: USER_ID,
        provider: 'google',
        providerUserId: 'google-user-123',
        email: 'user@example.com',
        emailVerified: true,
        accessTokenEnc: null,
        refreshTokenEnc: null,
        tokenExpiresAt: null,
      });
    });

    it('falls back to a generated date when createdAt/updatedAt are null', () => {
      const aggregate = new OAuthIdentityAggregate({
        id: new UuidValueObject(ID),
        userId: new UuidValueObject(USER_ID),
        provider: new OAuthProviderValueObject('google'),
        providerUserId: new StringValueObject('google-user-123'),
        email: new AccountEmailValueObject('user@example.com'),
        emailVerified: new BooleanValueObject(true),
        accessTokenEnc: null,
        refreshTokenEnc: null,
        tokenExpiresAt: null,
        createdAt: null,
        updatedAt: null,
      });

      const primitives = aggregate.toPrimitives();

      expect(primitives.createdAt).toBeInstanceOf(Date);
      expect(primitives.updatedAt).toBeInstanceOf(Date);
    });
  });
});
