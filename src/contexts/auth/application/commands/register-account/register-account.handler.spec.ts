import { RegisterAccountCommandHandler } from './register-account.handler';
import { RegisterAccountCommand } from './register-account.command';
import { AccountAggregate } from '@contexts/auth/domain/aggregates/account.aggregate';
import { IAccountWriteRepository } from '@contexts/auth/domain/repositories/write/account-write.repository';
import { SpaceContext } from '../../../../../shared/space-context/space-context.service';
import { CommandBus, EventBus } from '@nestjs/cqrs';

const EXISTING_USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const NEW_SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';

describe('RegisterAccountCommandHandler', () => {
  let handler: RegisterAccountCommandHandler;
  let accountWriteRepository: jest.Mocked<IAccountWriteRepository>;
  let commandBus: jest.Mocked<CommandBus>;
  let eventBus: jest.Mocked<EventBus>;
  let spaceContext: jest.Mocked<SpaceContext>;

  beforeEach(() => {
    jest.clearAllMocks();

    accountWriteRepository = {
      findByEmail: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
      findByCriteria: jest.fn(),
    } as unknown as jest.Mocked<IAccountWriteRepository>;

    commandBus = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CommandBus>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    spaceContext = {
      run: jest
        .fn()
        .mockImplementation((_spaceId: string, fn: () => unknown) => fn()),
      get: jest.fn(),
      require: jest.fn(),
    } as unknown as jest.Mocked<SpaceContext>;

    handler = new RegisterAccountCommandHandler(
      accountWriteRepository,
      commandBus,
      spaceContext,
      eventBus,
    );
  });

  const setupSuccessCommandBus = () => {
    commandBus.execute
      .mockResolvedValueOnce(EXISTING_USER_ID)
      .mockResolvedValueOnce(NEW_SPACE_ID);
  };

  it('should dispatch CreateUserCommand then CreateSpaceCommand and use returned ids', async () => {
    setupSuccessCommandBus();
    accountWriteRepository.save.mockResolvedValue(undefined as any);

    await handler.execute(
      new RegisterAccountCommand({
        email: 'new@example.com',
        password: 'Password123!',
      }),
    );

    expect(commandBus.execute).toHaveBeenCalledTimes(2);
    const savedAccount: AccountAggregate =
      accountWriteRepository.save.mock.calls[0][0];
    expect(savedAccount.userId.value).toBe(EXISTING_USER_ID);
  });

  it('should call SpaceContext.run with the new spaceId when saving account', async () => {
    setupSuccessCommandBus();
    accountWriteRepository.save.mockResolvedValue(undefined as any);

    await handler.execute(
      new RegisterAccountCommand({
        email: 'new@example.com',
        password: 'Password123!',
      }),
    );

    expect(spaceContext.run).toHaveBeenCalledWith(
      NEW_SPACE_ID,
      expect.any(Function),
    );
  });

  it('should return the spaceId in the handler result', async () => {
    setupSuccessCommandBus();
    accountWriteRepository.save.mockResolvedValue(undefined as any);

    const result = await handler.execute(
      new RegisterAccountCommand({
        email: 'new@example.com',
        password: 'Password123!',
      }),
    );

    expect(result).toEqual(expect.objectContaining({ spaceId: NEW_SPACE_ID }));
  });

  it('should not save account if CreateSpaceCommand fails', async () => {
    commandBus.execute
      .mockResolvedValueOnce(EXISTING_USER_ID)
      .mockRejectedValueOnce(new Error('Space creation failed'));

    await expect(
      handler.execute(
        new RegisterAccountCommand({
          email: 'new@example.com',
          password: 'Password123!',
        }),
      ),
    ).rejects.toThrow('Space creation failed');
    expect(accountWriteRepository.save).not.toHaveBeenCalled();
  });

  it('should not save account if CreateUserCommand fails', async () => {
    commandBus.execute.mockRejectedValue(new Error('User creation failed'));

    await expect(
      handler.execute(
        new RegisterAccountCommand({
          email: 'new@example.com',
          password: 'Password123!',
        }),
      ),
    ).rejects.toThrow('User creation failed');
    expect(accountWriteRepository.save).not.toHaveBeenCalled();
  });

  it('should save account and publish events when registration succeeds', async () => {
    setupSuccessCommandBus();
    accountWriteRepository.save.mockResolvedValue(undefined as any);

    await handler.execute(
      new RegisterAccountCommand({
        email: 'new@example.com',
        password: 'Password123!',
      }),
    );

    expect(accountWriteRepository.save).toHaveBeenCalledTimes(1);
    expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
  });
});
