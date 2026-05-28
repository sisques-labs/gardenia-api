import { AccountAggregate } from '@contexts/auth/domain/aggregates/account.aggregate';
import { AccountNotFoundException } from '@contexts/auth/domain/exceptions/account-not-found.exception';
import { InvalidCredentialsException } from '@contexts/auth/domain/exceptions/invalid-credentials.exception';
import { IAccountWriteRepository } from '@contexts/auth/domain/repositories/write/account-write.repository';
import { AccountPasswordChangedEvent } from '@contexts/auth/domain/events/field-changed/account-password-changed/account-password-changed.event';
import { EventBus } from '@nestjs/cqrs';
import * as bcrypt from 'bcrypt';
import { ChangePasswordCommand } from './change-password.command';
import { ChangePasswordCommandHandler } from './change-password.handler';

jest.mock('bcrypt');

const USER_ID = '660e8400-e29b-41d4-a716-446655440001';

describe('ChangePasswordCommandHandler', () => {
  let handler: ChangePasswordCommandHandler;
  let accountWriteRepository: jest.Mocked<IAccountWriteRepository>;
  let eventBus: jest.Mocked<EventBus>;
  let mockAccount: jest.Mocked<AccountAggregate>;

  beforeEach(() => {
    jest.clearAllMocks();

    accountWriteRepository = {
      findByUserId: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findByCriteria: jest.fn(),
    } as unknown as jest.Mocked<IAccountWriteRepository>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    mockAccount = {
      passwordHash: { value: 'hashed_current_password' },
      assertCurrentPasswordMatches: jest.fn(),
      changePassword: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
      getUncommittedEvents: jest.fn().mockReturnValue([
        new AccountPasswordChangedEvent(
          {
            aggregateRootId: 'some-id',
            aggregateRootType: 'AccountAggregate',
            entityId: 'some-id',
            entityType: 'AccountAggregate',
            eventType: AccountPasswordChangedEvent.name,
          },
          { id: 'some-id', oldValue: 'old', newValue: 'new' },
        ),
      ]),
    } as unknown as jest.Mocked<AccountAggregate>;

    handler = new ChangePasswordCommandHandler(
      accountWriteRepository,
      eventBus,
    );
  });

  it('should throw AccountNotFoundException when account is not found', async () => {
    accountWriteRepository.findByUserId.mockResolvedValue(null);

    const command = new ChangePasswordCommand({
      userId: USER_ID,
      currentPassword: 'currentPass',
      newPassword: 'newPass123!',
    });

    await expect(handler.execute(command)).rejects.toThrow(
      AccountNotFoundException,
    );
    expect(accountWriteRepository.save).not.toHaveBeenCalled();
  });

  it('should throw InvalidCredentialsException when current password does not match', async () => {
    accountWriteRepository.findByUserId.mockResolvedValue(mockAccount);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const command = new ChangePasswordCommand({
      userId: USER_ID,
      currentPassword: 'wrongCurrentPass',
      newPassword: 'newPass123!',
    });

    mockAccount.assertCurrentPasswordMatches.mockImplementation(() => {
      throw new InvalidCredentialsException();
    });

    await expect(handler.execute(command)).rejects.toThrow(
      InvalidCredentialsException,
    );
    expect(mockAccount.changePassword).not.toHaveBeenCalled();
    expect(accountWriteRepository.save).not.toHaveBeenCalled();
  });

  it('should change password, save, and publish events on success', async () => {
    accountWriteRepository.findByUserId.mockResolvedValue(mockAccount);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockResolvedValue('new_hashed_password');
    accountWriteRepository.save.mockResolvedValue(undefined as any);

    const command = new ChangePasswordCommand({
      userId: USER_ID,
      currentPassword: 'currentPass',
      newPassword: 'newPass123!',
    });

    await handler.execute(command);

    expect(mockAccount.changePassword).toHaveBeenCalledWith(
      'new_hashed_password',
    );
    expect(accountWriteRepository.save).toHaveBeenCalledWith(mockAccount);
    expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
  });

  it('should call bcrypt.hash with newPassword and salt rounds 10', async () => {
    accountWriteRepository.findByUserId.mockResolvedValue(mockAccount);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockResolvedValue('new_hashed_password');
    accountWriteRepository.save.mockResolvedValue(undefined as any);

    const command = new ChangePasswordCommand({
      userId: USER_ID,
      currentPassword: 'currentPass',
      newPassword: 'newPass123!',
    });

    await handler.execute(command);

    expect(bcrypt.hash).toHaveBeenCalledWith('newPass123!', 10);
  });
});
