import { EventBus } from '@nestjs/cqrs';

import { DeleteAccountCommandHandler } from '@contexts/auth/application/commands/delete-account/delete-account.handler';
import { DeleteAccountCommand } from '@contexts/auth/application/commands/delete-account/delete-account.command';
import { IUserProvisioningPort } from '@contexts/auth/application/ports/user-provisioning.port';
import { AccountBuilder } from '@contexts/auth/domain/builders/account.builder';
import { AccountNotFoundException } from '@contexts/auth/domain/exceptions/account-not-found.exception';
import { IAccountWriteRepository } from '@contexts/auth/domain/repositories/write/account-write.repository';
import { IAuthSessionWriteRepository } from '@contexts/auth/domain/repositories/write/auth-session-write.repository';

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
  let authSessionRepo: jest.Mocked<IAuthSessionWriteRepository>;
  let userProvisioningPort: jest.Mocked<IUserProvisioningPort>;
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

    authSessionRepo = {
      save: jest.fn(),
      findByTokenHash: jest.fn(),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      delete: jest.fn(),
      revokeAllByUserId: jest.fn().mockResolvedValue(0),
    } as unknown as jest.Mocked<IAuthSessionWriteRepository>;

    userProvisioningPort = {
      createUser: jest.fn(),
      deleteUser: jest.fn(),
    } as jest.Mocked<IUserProvisioningPort>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new DeleteAccountCommandHandler(
      accountWriteRepository,
      authSessionRepo,
      userProvisioningPort,
      eventBus,
    );
  });

  describe('execute()', () => {
    it('should delete the account, deprovision the user, and publish events when account is found', async () => {
      const account = buildAccount();
      const deleteSpy = jest.spyOn(account, 'delete');
      accountWriteRepository.findByUserId.mockResolvedValue(account);
      accountWriteRepository.delete.mockResolvedValue(undefined);
      userProvisioningPort.deleteUser.mockResolvedValue(undefined);

      await handler.execute(new DeleteAccountCommand(USER_ID));

      expect(accountWriteRepository.findByUserId).toHaveBeenCalledWith(USER_ID);
      expect(deleteSpy).toHaveBeenCalledTimes(1);
      expect(accountWriteRepository.delete).toHaveBeenCalledWith(ACCOUNT_ID);
      expect(userProvisioningPort.deleteUser).toHaveBeenCalledWith(USER_ID);
      expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
    });

    it('should throw AccountNotFoundException when account is not found', async () => {
      accountWriteRepository.findByUserId.mockResolvedValue(null);

      await expect(
        handler.execute(new DeleteAccountCommand(USER_ID)),
      ).rejects.toThrow(AccountNotFoundException);

      expect(accountWriteRepository.delete).not.toHaveBeenCalled();
      expect(userProvisioningPort.deleteUser).not.toHaveBeenCalled();
      expect(eventBus.publishAll).not.toHaveBeenCalled();
    });
  });
});
