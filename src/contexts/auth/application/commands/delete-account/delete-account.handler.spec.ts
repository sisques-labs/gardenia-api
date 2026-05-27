import { EventBus } from '@nestjs/cqrs';

import { DeleteAccountCommandHandler } from '@contexts/auth/application/commands/delete-account/delete-account.handler';
import { DeleteAccountCommand } from '@contexts/auth/application/commands/delete-account/delete-account.command';
import { AccountBuilder } from '@contexts/auth/domain/builders/account.builder';
import { IAccountWriteRepository } from '@contexts/auth/domain/repositories/write/account-write.repository';

const ACCOUNT_ID = '550e8400-e29b-41d4-a716-446655440001';
const USER_ID = '550e8400-e29b-41d4-a716-446655440002';
const EMAIL = 'test@example.com';
const PASSWORD_HASH =
  '$2b$10$abcdefghijklmnopqrstuvwxyz012345678901234567890123456';

const buildAccount = () =>
  new AccountBuilder()
    .withId(ACCOUNT_ID)
    .withUserId(USER_ID)
    .withEmail(EMAIL)
    .withPasswordHash(PASSWORD_HASH)
    .withCreatedAt(new Date('2024-01-01'))
    .withUpdatedAt(new Date('2024-01-01'))
    .build();

describe('DeleteAccountCommandHandler', () => {
  let handler: DeleteAccountCommandHandler;
  let accountWriteRepository: jest.Mocked<IAccountWriteRepository>;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    jest.clearAllMocks();

    accountWriteRepository = {
      findByUserId: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<IAccountWriteRepository>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new DeleteAccountCommandHandler(accountWriteRepository, eventBus);
  });

  describe('execute()', () => {
    it('should call delete on the repository when account is found', async () => {
      const account = buildAccount();
      accountWriteRepository.findByUserId.mockResolvedValue(account);
      accountWriteRepository.delete.mockResolvedValue(undefined);

      await handler.execute(new DeleteAccountCommand(USER_ID));

      expect(accountWriteRepository.findByUserId).toHaveBeenCalledWith(USER_ID);
      expect(accountWriteRepository.delete).toHaveBeenCalledWith(ACCOUNT_ID);
    });

    it('should not call delete when account is not found', async () => {
      accountWriteRepository.findByUserId.mockResolvedValue(null);

      await handler.execute(new DeleteAccountCommand(USER_ID));

      expect(accountWriteRepository.findByUserId).toHaveBeenCalledWith(USER_ID);
      expect(accountWriteRepository.delete).not.toHaveBeenCalled();
    });

    it('should resolve without throwing when account is found and deleted', async () => {
      const account = buildAccount();
      accountWriteRepository.findByUserId.mockResolvedValue(account);
      accountWriteRepository.delete.mockResolvedValue(undefined);

      await expect(
        handler.execute(new DeleteAccountCommand(USER_ID)),
      ).resolves.not.toThrow();
    });

    it('should resolve without throwing when account is not found', async () => {
      accountWriteRepository.findByUserId.mockResolvedValue(null);

      await expect(
        handler.execute(new DeleteAccountCommand(USER_ID)),
      ).resolves.not.toThrow();
    });
  });
});
