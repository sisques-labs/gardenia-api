import { AccountAggregate } from '@contexts/auth/domain/aggregates/account.aggregate';
import { AccountCreatedEvent } from '@contexts/auth/domain/events/account-created/account-created.event';
import { AccountDeletedEvent } from '@contexts/auth/domain/events/account-deleted/account-deleted.event';
import { AccountPasswordChangedEvent } from '@contexts/auth/domain/events/field-changed/account-password-changed/account-password-changed.event';
import { InvalidCredentialsException } from '@contexts/auth/domain/exceptions/invalid-credentials.exception';
import { AccountBuilder } from '@contexts/auth/domain/builders/account.builder';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

const ACCOUNT_ID = '550e8400-e29b-41d4-a716-446655440001';
const USER_ID = '550e8400-e29b-41d4-a716-446655440002';
const EMAIL = 'test@example.com';
const PASSWORD_HASH =
  '$2b$10$abcdefghijklmnopqrstuvwxyz012345678901234567890123456';
const CREATED_AT = new Date('2024-01-01T00:00:00.000Z');
const UPDATED_AT = new Date('2024-01-01T00:00:00.000Z');

const buildAccount = (): AccountAggregate =>
  new AccountBuilder()
    .withId(ACCOUNT_ID)
    .withUserId(USER_ID)
    .withEmail(EMAIL)
    .withPasswordHash(PASSWORD_HASH)
    .withCreatedAt(CREATED_AT)
    .withUpdatedAt(UPDATED_AT)
    .build();

describe('AccountAggregate', () => {
  describe('constructor — hydration (ADR-1)', () => {
    it('should construct an aggregate with matching field values', () => {
      const account = buildAccount();

      expect(account.id.value).toBe(ACCOUNT_ID);
      expect(account.userId.value).toBe(USER_ID);
      expect(account.email.value).toBe(EMAIL);
      expect(account.passwordHash.value).toBe(PASSWORD_HASH);
    });

    it('should have empty uncommitted events after construction', () => {
      const account = buildAccount();

      expect(account.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe('create()', () => {
    it('should emit an AccountCreatedEvent', () => {
      const account = buildAccount();
      account.create();
      const events = account.getUncommittedEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(AccountCreatedEvent);
    });

    it('should emit AccountCreatedEvent with correct aggregate metadata', () => {
      const account = buildAccount();
      account.create();
      const event = account.getUncommittedEvents()[0] as AccountCreatedEvent;

      expect(event.aggregateRootId).toBe(ACCOUNT_ID);
      expect(event.aggregateRootType).toBe(AccountAggregate.name);
    });

    it('should include correct primitives in the AccountCreatedEvent data', () => {
      const account = buildAccount();
      account.create();
      const event = account.getUncommittedEvents()[0] as AccountCreatedEvent;

      expect(event.data.id).toBe(ACCOUNT_ID);
      expect(event.data.userId).toBe(USER_ID);
      expect(event.data.email).toBe(EMAIL);
    });
  });

  describe('changePassword()', () => {
    it('should update the password hash', () => {
      const account = buildAccount();
      const newPasswordHash =
        '$2b$10$zyxwvutsrqponmlkjihgfedcba987654321098765432109876543';

      account.changePassword(newPasswordHash);

      expect(account.passwordHash.value).toBe(newPasswordHash);
    });

    it('should emit an AccountPasswordChangedEvent', () => {
      const account = buildAccount();
      const newPasswordHash =
        '$2b$10$zyxwvutsrqponmlkjihgfedcba987654321098765432109876543';

      account.changePassword(newPasswordHash);
      const events = account.getUncommittedEvents();
      const passwordEvent = events.find(
        (e) => e instanceof AccountPasswordChangedEvent,
      );

      expect(passwordEvent).toBeInstanceOf(AccountPasswordChangedEvent);
    });

    it('should include old and new password hash in the event data', () => {
      const account = buildAccount();
      const newPasswordHash =
        '$2b$10$zyxwvutsrqponmlkjihgfedcba987654321098765432109876543';

      account.changePassword(newPasswordHash);
      const events = account.getUncommittedEvents();
      const passwordEvent = events.find(
        (e) => e instanceof AccountPasswordChangedEvent,
      ) as AccountPasswordChangedEvent;

      expect(passwordEvent.data.oldValue).toBe(PASSWORD_HASH);
      expect(passwordEvent.data.newValue).toBe(newPasswordHash);
    });
  });

  describe('delete()', () => {
    it('should emit an AccountDeletedEvent', () => {
      const account = buildAccount();
      account.delete();
      const events = account.getUncommittedEvents();
      const deletedEvent = events.find((e) => e instanceof AccountDeletedEvent);

      expect(deletedEvent).toBeInstanceOf(AccountDeletedEvent);
    });

    it('should emit AccountDeletedEvent with correct aggregate metadata', () => {
      const account = buildAccount();
      account.delete();
      const events = account.getUncommittedEvents();
      const deletedEvent = events.find(
        (e) => e instanceof AccountDeletedEvent,
      ) as AccountDeletedEvent;

      expect(deletedEvent.aggregateRootId).toBe(ACCOUNT_ID);
      expect(deletedEvent.entityType).toBe(AccountAggregate.name);
    });

    it('should include primitives in the AccountDeletedEvent data', () => {
      const account = buildAccount();
      account.delete();
      const events = account.getUncommittedEvents();
      const deletedEvent = events.find(
        (e) => e instanceof AccountDeletedEvent,
      ) as AccountDeletedEvent;

      expect(deletedEvent.data.id).toBe(ACCOUNT_ID);
    });
  });

  describe('changePasswordWithValidation()', () => {
    it('should throw InvalidCredentialsException when password does not match', async () => {
      const account = buildAccount();
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        account.changePasswordWithValidation(
          'current-password',
          'new-password-123',
        ),
      ).rejects.toThrow(InvalidCredentialsException);
    });

    it('should hash and change password when current password matches', async () => {
      const account = buildAccount();
      const newHashedPassword =
        '$2b$10$zyxwvutsrqponmlkjihgfedcba987654321098765432109876543';

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue(newHashedPassword);

      await account.changePasswordWithValidation(
        'current-password',
        'new-password-123',
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'current-password',
        PASSWORD_HASH,
      );
      expect(bcrypt.hash).toHaveBeenCalledWith('new-password-123', 10);
      expect(account.passwordHash.value).toBe(newHashedPassword);
    });
  });

  describe('toPrimitives()', () => {
    it('should return primitives matching the constructed values', () => {
      const account = buildAccount();
      const primitives = account.toPrimitives();

      expect(primitives.id).toBe(ACCOUNT_ID);
      expect(primitives.userId).toBe(USER_ID);
      expect(primitives.email).toBe(EMAIL);
      expect(primitives.passwordHash).toBe(PASSWORD_HASH);
      expect(primitives.createdAt).toEqual(CREATED_AT);
      expect(primitives.updatedAt).toEqual(UPDATED_AT);
    });
  });
});
