import { RegisterAccountCommandHandler } from './register-account.handler';
import { RegisterAccountCommand } from './register-account.command';
import { ISpaceProvisioningPort } from '@contexts/auth/application/ports/space-provisioning.port';
import { IUserProvisioningPort } from '@contexts/auth/application/ports/user-provisioning.port';
import { IAccountWriteRepository } from '@contexts/auth/domain/repositories/write/account-write.repository';
import { SpaceContext } from '../../../../../shared/space-context/space-context.service';
import { EventBus } from '@nestjs/cqrs';

const NEW_SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';

describe('RegisterAccountCommandHandler', () => {
  let handler: RegisterAccountCommandHandler;
  let accountWriteRepository: jest.Mocked<IAccountWriteRepository>;
  let spaceProvisioningPort: jest.Mocked<ISpaceProvisioningPort>;
  let userProvisioningPort: jest.Mocked<IUserProvisioningPort>;
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

    spaceProvisioningPort = {
      createDefaultSpace: jest.fn(),
    } as jest.Mocked<ISpaceProvisioningPort>;

    userProvisioningPort = {
      createUser: jest.fn(),
      deleteUser: jest.fn(),
    } as jest.Mocked<IUserProvisioningPort>;

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
      spaceProvisioningPort,
      userProvisioningPort,
      spaceContext,
      eventBus,
    );
  });

  const setupSuccessProvisioning = () => {
    spaceProvisioningPort.createDefaultSpace.mockResolvedValue(NEW_SPACE_ID);
    userProvisioningPort.createUser.mockResolvedValue(undefined);
  };

  it('should provision the default space then the user', async () => {
    setupSuccessProvisioning();
    accountWriteRepository.save.mockResolvedValue(undefined as any);

    await handler.execute(
      new RegisterAccountCommand({
        email: 'new@example.com',
        password: 'Password123!',
      }),
    );

    expect(spaceProvisioningPort.createDefaultSpace).toHaveBeenCalledTimes(1);
    expect(spaceProvisioningPort.createDefaultSpace).toHaveBeenCalledWith({
      ownerId: expect.any(String),
      name: `new@example.com's Space`,
    });
    expect(userProvisioningPort.createUser).toHaveBeenCalledTimes(1);
  });

  it('should call SpaceContext.run with the new spaceId', async () => {
    setupSuccessProvisioning();
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
    setupSuccessProvisioning();
    accountWriteRepository.save.mockResolvedValue(undefined as any);

    const result = await handler.execute(
      new RegisterAccountCommand({
        email: 'new@example.com',
        password: 'Password123!',
      }),
    );

    expect(result).toEqual(expect.objectContaining({ spaceId: NEW_SPACE_ID }));
  });

  it('should not save account if space provisioning fails', async () => {
    spaceProvisioningPort.createDefaultSpace.mockRejectedValue(
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

  it('should not save account if user provisioning fails', async () => {
    spaceProvisioningPort.createDefaultSpace.mockResolvedValue(NEW_SPACE_ID);
    userProvisioningPort.createUser.mockRejectedValue(
      new Error('User creation failed'),
    );

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
    setupSuccessProvisioning();
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
