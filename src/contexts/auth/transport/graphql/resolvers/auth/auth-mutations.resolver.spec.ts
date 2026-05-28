import { CommandBus } from '@nestjs/cqrs';
import { MutationResponseGraphQLMapper } from '@sisques-labs/nestjs-kit';

import { ChangePasswordCommand } from '@contexts/auth/application/commands/change-password/change-password.command';
import { DeleteAccountCommand } from '@contexts/auth/application/commands/delete-account/delete-account.command';
import { LoginAccountCommand } from '@contexts/auth/application/commands/login-account/login-account.command';
import { RegisterAccountCommand } from '@contexts/auth/application/commands/register-account/register-account.command';
import { CurrentUserPayload } from '@contexts/auth/infrastructure/decorators/current-user.decorator';

import { AuthMutationsResolver } from './auth-mutations.resolver';

const buildMockContext = () => ({
  req: {
    cookies: {} as Record<string, string>,
    res: {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    },
  },
});

describe('AuthMutationsResolver', () => {
  let sut: AuthMutationsResolver;
  let commandBus: jest.Mocked<CommandBus>;
  let mutationResponseGraphQLMapper: jest.Mocked<MutationResponseGraphQLMapper>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    mutationResponseGraphQLMapper = {
      toResponseDto: jest.fn(),
    } as unknown as jest.Mocked<MutationResponseGraphQLMapper>;
    sut = new AuthMutationsResolver(commandBus, mutationResponseGraphQLMapper);
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
  });

  describe('login()', () => {
    it('should execute LoginAccountCommand and return accessToken', async () => {
      commandBus.execute.mockResolvedValue({
        accessToken: 'jwt-token',
        refreshToken: 'plain-refresh',
      });
      const ctx = buildMockContext();

      const result = await sut.login(
        { email: 'test@example.com', password: 'SuperStr0ng!Pass' },
        ctx,
      );

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(LoginAccountCommand),
      );
      expect(result.accessToken).toBe('jwt-token');
      expect(ctx.req.res.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'plain-refresh',
        expect.any(Object),
      );
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
      const dispatched = commandBus.execute.mock
        .calls[0][0] as DeleteAccountCommand;
      expect(dispatched.userId).toBe(currentUser.userId);
    });

    it('should return true', async () => {
      commandBus.execute.mockResolvedValue(undefined);

      const result = await sut.deleteAccount(currentUser);

      expect(result).toBe(true);
    });
  });

  describe('changePassword()', () => {
    const currentUser: CurrentUserPayload = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      email: 'test@example.com',
    };

    it('should dispatch ChangePasswordCommand with correct fields', async () => {
      commandBus.execute.mockResolvedValue(undefined);
      mutationResponseGraphQLMapper.toResponseDto.mockReturnValue({
        success: true,
        message: 'Password changed successfully',
      });

      await sut.changePassword(
        { currentPassword: 'OldPass1!', newPassword: 'NewPass1!' },
        currentUser,
      );

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(ChangePasswordCommand),
      );
    });
  });
});
