import { AccountAggregate } from '@contexts/auth/domain/aggregates/account.aggregate';
import { AccountExternalSubjectLinkedEvent } from '@contexts/auth/domain/events/account-external-subject-linked/account-external-subject-linked.event';
import { AccountNotFoundException } from '@contexts/auth/domain/exceptions/account-not-found.exception';
import { AccountBuilder } from '@contexts/auth/domain/builders/account.builder';
import { IAccountWriteRepository } from '@contexts/auth/domain/repositories/write/account-write.repository';
import { EventBus } from '@nestjs/cqrs';

import { LinkExternalSubjectCommand } from './link-external-subject.command';
import { LinkExternalSubjectCommandHandler } from './link-external-subject.handler';

const ACCOUNT_ID = '550e8400-e29b-41d4-a716-446655440001';
const USER_ID = '550e8400-e29b-41d4-a716-446655440002';
const EMAIL = 'user@example.com';
const PASSWORD_HASH =
  '$2b$10$abcdefghijklmnopqrstuvwxyz012345678901234567890123456';
const SUBJECT = 'platform-subject-abc';

const NOW = new Date('2024-01-01T00:00:00.000Z');

const buildExistingAccount = (): AccountAggregate =>
  new AccountBuilder()
    .withId(ACCOUNT_ID)
    .withUserId(USER_ID)
    .withEmail(EMAIL)
    .withPasswordHash(PASSWORD_HASH)
    .withCreatedAt(NOW)
    .withUpdatedAt(NOW)
    .build();

describe('LinkExternalSubjectCommandHandler', () => {
  let handler: LinkExternalSubjectCommandHandler;
  let accountRepo: jest.Mocked<IAccountWriteRepository>;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    accountRepo = {
      findByEmail: jest.fn(),
      findByUserId: jest.fn(),
      findByExternalSubject: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
    } as unknown as jest.Mocked<IAccountWriteRepository>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new LinkExternalSubjectCommandHandler(eventBus, accountRepo);
  });

  it('links the matching account by verified email', async () => {
    const account = buildExistingAccount();
    accountRepo.findByEmail.mockResolvedValue(account);
    accountRepo.save.mockResolvedValue(account);

    const result = await handler.execute(
      new LinkExternalSubjectCommand({
        email: EMAIL,
        externalSubject: SUBJECT,
      }),
    );

    expect(result.externalSubject?.value).toBe(SUBJECT);
    expect(accountRepo.save).toHaveBeenCalledWith(account);
  });

  it('does not modify the password hash or appRole while linking', async () => {
    const account = buildExistingAccount();
    accountRepo.findByEmail.mockResolvedValue(account);
    accountRepo.save.mockResolvedValue(account);

    const result = await handler.execute(
      new LinkExternalSubjectCommand({
        email: EMAIL,
        externalSubject: SUBJECT,
      }),
    );

    expect(result.passwordHash.value).toBe(PASSWORD_HASH);
    expect(result.appRole.value).toBe('user');
  });

  it('publishes exactly one AccountExternalSubjectLinkedEvent', async () => {
    const account = buildExistingAccount();
    accountRepo.findByEmail.mockResolvedValue(account);
    accountRepo.save.mockResolvedValue(account);
    // publishAll receives a live reference to the aggregate's internal event
    // array, which BaseCommandHandler.publishEvents() truncates via commit()
    // right after — snapshot the contents at call time instead.
    let publishedEvents: unknown[] = [];
    eventBus.publishAll.mockImplementation(async (events: unknown[]) => {
      publishedEvents = [...events];
    });

    await handler.execute(
      new LinkExternalSubjectCommand({
        email: EMAIL,
        externalSubject: SUBJECT,
      }),
    );

    expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
    expect(publishedEvents).toHaveLength(1);
    expect(publishedEvents[0]).toBeInstanceOf(
      AccountExternalSubjectLinkedEvent,
    );
  });

  it('throws AccountNotFoundException when no account matches the email', async () => {
    accountRepo.findByEmail.mockResolvedValue(null);

    await expect(
      handler.execute(
        new LinkExternalSubjectCommand({
          email: 'missing@example.com',
          externalSubject: SUBJECT,
        }),
      ),
    ).rejects.toThrow(AccountNotFoundException);

    expect(accountRepo.save).not.toHaveBeenCalled();
  });
});
