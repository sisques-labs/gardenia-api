import { AccountAggregate } from '@contexts/auth/domain/aggregates/account.aggregate';
import { AccountBuilder } from '@contexts/auth/domain/builders/account.builder';

const ACCOUNT_ID = '550e8400-e29b-41d4-a716-446655440001';
const USER_ID = '550e8400-e29b-41d4-a716-446655440002';
const EMAIL = 'test@example.com';
const PASSWORD_HASH =
  '$2b$10$abcdefghijklmnopqrstuvwxyz012345678901234567890123456';
const CREATED_AT = new Date('2024-01-01T00:00:00.000Z');
const UPDATED_AT = new Date('2024-01-01T00:00:00.000Z');

describe('AccountBuilder', () => {
  describe('build()', () => {
    it('should produce a valid AccountAggregate when all fields are set', () => {
      const account = new AccountBuilder()
        .withId(ACCOUNT_ID)
        .withUserId(USER_ID)
        .withEmail(EMAIL)
        .withPasswordHash(PASSWORD_HASH)
        .withCreatedAt(CREATED_AT)
        .withUpdatedAt(UPDATED_AT)
        .build();

      expect(account).toBeInstanceOf(AccountAggregate);
      expect(account.id.value).toBe(ACCOUNT_ID);
      expect(account.userId.value).toBe(USER_ID);
      expect(account.email.value).toBe(EMAIL);
      expect(account.passwordHash.value).toBe(PASSWORD_HASH);
      expect(account.createdAt.value).toEqual(CREATED_AT);
      expect(account.updatedAt.value).toEqual(UPDATED_AT);
    });

    it('should produce an aggregate with no uncommitted events (ADR-1)', () => {
      const account = new AccountBuilder()
        .withId(ACCOUNT_ID)
        .withUserId(USER_ID)
        .withEmail(EMAIL)
        .withPasswordHash(PASSWORD_HASH)
        .withCreatedAt(CREATED_AT)
        .withUpdatedAt(UPDATED_AT)
        .build();

      expect(account.getUncommittedEvents()).toHaveLength(0);
    });

    it('should throw when id is missing', () => {
      expect(() =>
        new AccountBuilder()
          .withUserId(USER_ID)
          .withEmail(EMAIL)
          .withPasswordHash(PASSWORD_HASH)
          .build(),
      ).toThrow();
    });

    it('should throw when userId is missing', () => {
      expect(() =>
        new AccountBuilder()
          .withId(ACCOUNT_ID)
          .withEmail(EMAIL)
          .withPasswordHash(PASSWORD_HASH)
          .build(),
      ).toThrow();
    });

    it('should throw when email is missing', () => {
      expect(() =>
        new AccountBuilder()
          .withId(ACCOUNT_ID)
          .withUserId(USER_ID)
          .withPasswordHash(PASSWORD_HASH)
          .build(),
      ).toThrow();
    });

    it('should throw when passwordHash is missing', () => {
      expect(() =>
        new AccountBuilder()
          .withId(ACCOUNT_ID)
          .withUserId(USER_ID)
          .withEmail(EMAIL)
          .build(),
      ).toThrow();
    });
  });

  describe('setters', () => {
    it('should be chainable and return the builder instance', () => {
      const builder = new AccountBuilder();
      const result = builder
        .withId(ACCOUNT_ID)
        .withUserId(USER_ID)
        .withEmail(EMAIL)
        .withPasswordHash(PASSWORD_HASH);

      expect(result).toBe(builder);
    });
  });
});
