import { RegisterAccountCommandHandler } from './register-account.handler';
import { RegisterAccountCommand } from './register-account.command';
import { IAccountWriteRepository } from '@contexts/auth/domain/repositories/write/account-write.repository';
import { AccountAlreadyExistsException } from '@contexts/auth/domain/exceptions/account-already-exists.exception';
import { AccountAggregate } from '@contexts/auth/domain/aggregates/account.aggregate';
import { AccountBuilder } from '@contexts/auth/domain/builders/account.builder';
import { EventBus } from '@nestjs/cqrs';

const buildExistingAccount = (): AccountAggregate =>
  new AccountBuilder()
    .withId('550e8400-e29b-41d4-a716-446655440000')
    .withUserId('660e8400-e29b-41d4-a716-446655440001')
    .withEmail('existing@example.com')
    .withPasswordHash('hashed-password')
    .withCreatedAt(new Date('2024-01-01'))
    .withUpdatedAt(new Date('2024-01-01'))
    .build();

describe('RegisterAccountCommandHandler', () => {
  let handler: RegisterAccountCommandHandler;
  let accountWriteRepository: jest.Mocked<IAccountWriteRepository>;
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

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new RegisterAccountCommandHandler(accountWriteRepository, eventBus);
  });

  it('should call findByEmail (not findByCriteria) to check for duplicates', async () => {
    accountWriteRepository.findByEmail.mockResolvedValue(null);
    accountWriteRepository.save.mockResolvedValue(buildExistingAccount());

    const command = new RegisterAccountCommand({
      email: 'new@example.com',
      password: 'Password123!',
    });

    await handler.execute(command);

    expect(accountWriteRepository.findByEmail).toHaveBeenCalledWith('new@example.com');
    expect(accountWriteRepository.findByCriteria).not.toHaveBeenCalled();
  });

  it('should throw AccountAlreadyExistsException when email is already registered', async () => {
    accountWriteRepository.findByEmail.mockResolvedValue(buildExistingAccount());

    const command = new RegisterAccountCommand({
      email: 'existing@example.com',
      password: 'Password123!',
    });

    await expect(handler.execute(command)).rejects.toThrow(
      AccountAlreadyExistsException,
    );
    expect(accountWriteRepository.save).not.toHaveBeenCalled();
  });

  it('should save and publish events when email is new', async () => {
    accountWriteRepository.findByEmail.mockResolvedValue(null);
    const savedAccount = buildExistingAccount();
    accountWriteRepository.save.mockResolvedValue(savedAccount);

    const command = new RegisterAccountCommand({
      email: 'new@example.com',
      password: 'Password123!',
    });

    await handler.execute(command);

    expect(accountWriteRepository.save).toHaveBeenCalledTimes(1);
    expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
  });
});
