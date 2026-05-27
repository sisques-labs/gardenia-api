import { CommandBus } from '@nestjs/cqrs';

import { LoginAccountCommand } from '@contexts/auth/application/commands/login-account/login-account.command';
import { RegisterAccountCommand } from '@contexts/auth/application/commands/register-account/register-account.command';

import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let sut: AuthController;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    sut = new AuthController(commandBus);
  });

  describe('register()', () => {
    it('should execute RegisterAccountCommand with correct input', async () => {
      commandBus.execute.mockResolvedValue(undefined);

      await sut.register({
        email: 'test@example.com',
        password: 'SuperStr0ng!Pass',
      });

      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(RegisterAccountCommand),
      );
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

    it('should return payload containing accessToken', async () => {
      commandBus.execute.mockResolvedValue({ accessToken: 'jwt-token' });

      const result = await sut.login({
        email: 'test@example.com',
        password: 'SuperStr0ng!Pass',
      });

      expect(result).toHaveProperty('accessToken', 'jwt-token');
    });
  });
});
