import { CommandBus } from '@nestjs/cqrs';
import { MutationResponseGraphQLMapper } from '@sisques-labs/nestjs-kit';

import { DeleteAccountCommand } from '@contexts/auth/application/commands/delete-account/delete-account.command';
import { LoginAccountCommand } from '@contexts/auth/application/commands/login-account/login-account.command';
import { RegisterAccountCommand } from '@contexts/auth/application/commands/register-account/register-account.command';
import { CurrentUserPayload } from '@contexts/auth/infrastructure/decorators/current-user.decorator';

import { AuthResolver } from './auth.resolver';

describe('AuthResolver', () => {
  let sut: AuthResolver;
  let commandBus: jest.Mocked<CommandBus>;
  let mutationResponseGraphQLMapper: jest.Mocked<MutationResponseGraphQLMapper>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    mutationResponseGraphQLMapper = {
      toResponseDto: jest.fn(),
    } as unknown as jest.Mocked<MutationResponseGraphQLMapper>;
    sut = new AuthResolver(commandBus, mutationResponseGraphQLMapper);
  });

  describe('register()', () => {
    it('should execute RegisterAccountCommand with correct input', async () => {
      commandBus.execute.mockResolvedValue(undefined);

      const result = await sut.register({
        email: 'test@example.com',
        password: 'SuperStr0ng!Pass',
      });

      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(RegisterAccountCommand),
      );
      expect(result).toBe(true);
    });

    it('should dispatch exactly one RegisterAccountCommand per call', async () => {
      commandBus.execute.mockResolvedValue(undefined);

      await sut.register({
        email: 'user@test.com',
        password: 'AnotherStr0ng!Pass',
      });
      await sut.register({ email: 'other@test.com', password: 'other123' });

      expect(commandBus.execute).toHaveBeenCalledTimes(2);
      expect(commandBus.execute.mock.calls[0][0]).toBeInstanceOf(
        RegisterAccountCommand,
      );
      expect(commandBus.execute.mock.calls[1][0]).toBeInstanceOf(
        RegisterAccountCommand,
      );
    });
  });

  describe('login()', () => {
    it('should execute LoginAccountCommand with correct input', async () => {
      commandBus.execute.mockResolvedValue({ accessToken: 'jwt-token' });

      await sut.login({
        email: 'test@example.com',
        password: 'SuperStr0ng!Pass',
      });

      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(LoginAccountCommand),
      );
    });

    it('should return AuthPayloadObject with accessToken', async () => {
      commandBus.execute.mockResolvedValue({ accessToken: 'jwt-token' });

      const result = await sut.login({
        email: 'test@example.com',
        password: 'SuperStr0ng!Pass',
      });

      expect(result.accessToken).toBe('jwt-token');
    });
  });

  describe('deleteAccount()', () => {
    const currentUser: CurrentUserPayload = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      email: 'test@example.com',
    };

    it('should dispatch DeleteAccountCommand with correct userId', async () => {
      commandBus.execute.mockResolvedValue(undefined);

      await sut.deleteAccount(currentUser);

      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(DeleteAccountCommand),
      );
    });

    it('should return true', async () => {
      commandBus.execute.mockResolvedValue(undefined);

      const result = await sut.deleteAccount(currentUser);

      expect(result).toBe(true);
    });

    it('should dispatch exactly one DeleteAccountCommand per call', async () => {
      commandBus.execute.mockResolvedValue(undefined);

      await sut.deleteAccount(currentUser);

      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      const dispatched = commandBus.execute.mock
        .calls[0][0] as DeleteAccountCommand;
      expect(dispatched.userId).toBe(currentUser.userId);
    });
  });
});
