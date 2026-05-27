import { RegisterAccountCommandHandler } from './register-account.handler';
import { RegisterAccountCommand } from './register-account.command';
import { AssertAccountEmailAvailableService } from '@contexts/auth/application/services/write/assert-account-email-available/assert-account-email-available.service';
import { AccountAlreadyExistsException } from '@contexts/auth/domain/exceptions/account-already-exists.exception';
import { AccountAggregate } from '@contexts/auth/domain/aggregates/account.aggregate';
import { AccountBuilder } from '@contexts/auth/domain/builders/account.builder';
import { IAccountWriteRepository } from '@contexts/auth/domain/repositories/write/account-write.repository';
import { CommandBus, EventBus } from '@nestjs/cqrs';

const EXISTING_USER_ID = '660e8400-e29b-41d4-a716-446655440001';

const buildExistingAccount = (): AccountAggregate =>
  new AccountBuilder()
    .withId('550e8400-e29b-41d4-a716-446655440000')
    .withUserId(EXISTING_USER_ID)
    .withEmail('existing@example.com')
    .withPasswordHash('hashed-password')
    .withCreatedAt(new Date('2024-01-01'))
    .withUpdatedAt(new Date('2024-01-01'))
    .build();

describe('RegisterAccountCommandHandler', () => {
  let handler: RegisterAccountCommandHandler;
  let accountWriteRepository: jest.Mocked<IAccountWriteRepository>;
  let assertAccountEmailAvailableService: jest.Mocked<AssertAccountEmailAvailableService>;
  let commandBus: jest.Mocked<CommandBus>;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    jest.clearAllMocks();

    accountWriteRepository = {
      findByEmail: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
      findByCriteria: jest.fn(),
    } as unknown as jest.Mocked<IAccountWriteRepository>;

    assertAccountEmailAvailableService = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AssertAccountEmailAvailableService>;

    commandBus = {
      execute: jest.fn().mockResolvedValue(EXISTING_USER_ID),
    } as unknown as jest.Mocked<CommandBus>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new RegisterAccountCommandHandler(
      accountWriteRepository,
      assertAccountEmailAvailableService,
      commandBus,
      eventBus,
    );
  });

  it('should call AssertAccountEmailAvailableService before creating user', async () => {
    accountWriteRepository.save.mockResolvedValue(undefined as any);

    const command = new RegisterAccountCommand({
      email: 'new@example.com',
      password: 'Password123!',
    });

    await handler.execute(command);

    expect(assertAccountEmailAvailableService.execute).toHaveBeenCalledTimes(1);
  });

  it('should throw AccountAlreadyExistsException when email is already registered', async () => {
    assertAccountEmailAvailableService.execute.mockRejectedValue(
      new AccountAlreadyExistsException('existing@example.com'),
    );

    const command = new RegisterAccountCommand({
      email: 'existing@example.com',
      password: 'Password123!',
    });

    await expect(handler.execute(command)).rejects.toThrow(AccountAlreadyExistsException);
    expect(commandBus.execute).not.toHaveBeenCalled();
    expect(accountWriteRepository.save).not.toHaveBeenCalled();
  });

  it('should dispatch CreateUserCommand and use the returned userId for the account', async () => {
    accountWriteRepository.save.mockResolvedValue(undefined as any);

    const command = new RegisterAccountCommand({
      email: 'new@example.com',
      password: 'Password123!',
    });

    await handler.execute(command);

    expect(commandBus.execute).toHaveBeenCalledTimes(1);

    const savedAccount: AccountAggregate = accountWriteRepository.save.mock.calls[0][0];
    expect(savedAccount.userId.value).toBe(EXISTING_USER_ID);
  });

  it('should save the account and publish events when registration succeeds', async () => {
    accountWriteRepository.save.mockResolvedValue(undefined as any);

    const command = new RegisterAccountCommand({
      email: 'new@example.com',
      password: 'Password123!',
    });

    await handler.execute(command);

    expect(accountWriteRepository.save).toHaveBeenCalledTimes(1);
    expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
  });

  it('should not save account if CreateUserCommand fails', async () => {
    commandBus.execute.mockRejectedValue(new Error('User creation failed'));

    const command = new RegisterAccountCommand({
      email: 'new@example.com',
      password: 'Password123!',
    });

    await expect(handler.execute(command)).rejects.toThrow('User creation failed');
    expect(accountWriteRepository.save).not.toHaveBeenCalled();
  });
});
