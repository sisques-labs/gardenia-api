import { RegisterAccountCommandHandler } from './register-account.handler';
import { RegisterAccountCommand } from './register-account.command';
import { IAccountWriteRepository } from '@contexts/auth/domain/repositories/write/account-write.repository';
import { SpaceContext } from '../../../../../shared/space-context/space-context.service';
import { CommandBus, EventBus } from '@nestjs/cqrs';

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
    // Order: CreateSpaceCommand (→ spaceId), then CreateUserCommand (→ void)
    commandBus.execute
      .mockResolvedValueOnce(NEW_SPACE_ID)
      .mockResolvedValueOnce(undefined);
  };

  it('should dispatch CreateSpaceCommand then CreateUserCommand', async () => {
    setupSuccessCommandBus();
    accountWriteRepository.save.mockResolvedValue(undefined as any);

    await handler.execute(
      new RegisterAccountCommand({
        email: 'new@example.com',
        password: 'Password123!',
      }),
    );

    expect(commandBus.execute).toHaveBeenCalledTimes(2);
  });

  it('should call SpaceContext.run with the new spaceId', async () => {
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
    commandBus.execute.mockRejectedValueOnce(
      new Error('Space creation failed'),
    );

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
    commandBus.execute
      .mockResolvedValueOnce(NEW_SPACE_ID)
      .mockRejectedValueOnce(new Error('User creation failed'));

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
